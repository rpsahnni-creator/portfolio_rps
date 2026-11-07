from dotenv import load_dotenv
load_dotenv()

from email.message import EmailMessage
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Response
from starlette.middleware.cors import CORSMiddleware
import os
import re
import json
import time
import uuid
import logging
import ipaddress
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone, timedelta
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import io
import httpx
import aiosmtplib
import bcrypt
import jwt
from PIL import Image

from db import init_pool, init_schema, close_pool, get_pool

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Ram Pravesh Sahni")
OWNER_EMAIL = os.environ["OWNER_EMAIL"]
# When mail goes out from a no-reply sender, a client's reply must still reach the owner.
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO") or OWNER_EMAIL
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].lower()
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", OWNER_EMAIL)
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() != "false"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
# httpx logs every request URL at INFO; keep outbound API calls out of the logs.
logging.getLogger("httpx").setLevel(logging.WARNING)


def get_client_ip(request: Request) -> str:
    # When running behind Nginx/ALB, request.client.host is the proxy's own address,
    # so the real visitor IP must come from the forwarded header the proxy sets.
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

# ---------------- Auth ----------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(email: str) -> str:
    payload = {"sub": email, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        h = request.headers.get("Authorization", "")
        if h.startswith("Bearer "):
            token = h[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    pool = get_pool()
    row = await pool.fetchrow("SELECT email, name, role FROM users WHERE email=$1", payload["sub"])
    if not row or row["role"] != "admin":
        raise HTTPException(status_code=401, detail="Not authorized")
    return dict(row)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    pool = get_pool()
    email = payload.email.lower()
    ip = get_client_ip(request)
    ident = f"{ip}:{email}"
    att = await pool.fetchrow("SELECT count, locked_until FROM login_attempts WHERE identifier=$1", ident)
    if att and att["locked_until"] and att["locked_until"] > time.time():
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")

    user = await pool.fetchrow("SELECT * FROM users WHERE email=$1", email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        count = (att["count"] if att else 0) + 1
        now = time.time()
        if count >= 5:
            locked_until = now + 900
            await pool.execute(
                """INSERT INTO login_attempts (identifier, count, first_at, locked_until) VALUES ($1,$2,$3,$4)
                   ON CONFLICT (identifier) DO UPDATE SET count=$2, first_at=$3, locked_until=$4""",
                ident, count, now, locked_until,
            )
        else:
            await pool.execute(
                """INSERT INTO login_attempts (identifier, count, first_at) VALUES ($1,$2,$3)
                   ON CONFLICT (identifier) DO UPDATE SET count=$2, first_at=$3""",
                ident, count, now,
            )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await pool.execute("DELETE FROM login_attempts WHERE identifier=$1", ident)
    token = create_access_token(email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    return {"token": token, "user": {"email": email, "name": user["name"] or "Admin", "role": "admin"}}


@api_router.get("/auth/me")
async def auth_me(admin=Depends(get_current_admin)):
    return admin


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"status": "ok"}


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


@api_router.post("/auth/change-password")
async def change_password(payload: ChangePasswordIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    user = await pool.fetchrow("SELECT password_hash FROM users WHERE email=$1", admin["email"])
    if not user or not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await pool.execute("UPDATE users SET password_hash=$1 WHERE email=$2", hash_password(payload.new_password), admin["email"])
    return {"status": "ok"}


async def seed_admin():
    pool = get_pool()
    existing = await pool.fetchrow("SELECT 1 FROM users WHERE email=$1", ADMIN_EMAIL)
    if existing is None:
        await pool.execute(
            "INSERT INTO users (email, password_hash, name, role, created_at) VALUES ($1,$2,$3,$4,$5)",
            ADMIN_EMAIL, hash_password(ADMIN_PASSWORD), "Ram Pravesh Sahni", "admin",
            datetime.now(timezone.utc).isoformat(),
        )
        logger.info("Admin user seeded")

# ---------------- Content (public) ----------------

CAT_LABELS = {"backend": "Backend", "web": "Web", "mobile": "Mobile", "ai": "AI & Automation"}
SPAN_PATTERN = ["lg:col-span-3", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2"]

DEFAULT_PROJECTS = [
    {"title": "Realtime Chat Service", "cat": "backend", "desc": "Ultra-low latency WebSocket chat server supporting 10k+ concurrent connections with pub/sub architecture and message history.", "hi": "10k+ concurrent sockets · Redis pub/sub", "tech": ["Golang", "Redis", "PostgreSQL"], "featured": False, "order": 1, "img": "https://images.pexels.com/photos/26765065/pexels-photo-26765065.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "features": ["WebSocket server in Go built for high throughput", "Redis pub/sub fan-out across multiple nodes", "Persistent message history in PostgreSQL", "Graceful reconnects and presence tracking"], "outcome": "10k+ concurrent connections stay live with sub-second message delivery.", "gh": "https://github.com/rpsahnni-creator", "live": ""},
    {"title": "Business Dashboard", "cat": "web", "desc": "Analytics & financial management portal featuring real-time telemetry, charts and exportable reports behind secure login.", "hi": "Live telemetry · exportable reports", "tech": ["React", "TypeScript", "Tailwind CSS"], "featured": False, "order": 2, "img": "https://images.pexels.com/photos/9951077/pexels-photo-9951077.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "features": ["Real-time charts and KPI telemetry", "Secure authentication and session handling", "Exportable PDF/CSV reports", "Fast loads with TypeScript-safe data layer"], "outcome": "Owners see the whole business on one screen and export reports in a click.", "gh": "https://github.com/rpsahnni-creator", "live": ""},
    {"title": "Delivery Tracking App", "cat": "mobile", "desc": "Cross-platform mobile application with live GPS driver movement, push alerts and full order lifecycle management.", "hi": "Live GPS tracking · push notifications", "tech": ["Flutter", "Firebase", "FastAPI"], "featured": False, "order": 3, "img": "https://images.unsplash.com/photo-1759661881353-5b9cc55e1cf4?crop=entropy&cs=srgb&fm=jpg&q=85", "features": ["Single Flutter codebase for Android and iOS", "Live driver GPS movement on maps", "Push notifications at every order stage", "FastAPI backend with Firebase sync"], "outcome": "Customers watch their delivery move in real time, from pickup to doorstep.", "gh": "https://github.com/rpsahnni-creator", "live": ""},
    {"title": "Lead-to-WhatsApp Automation", "cat": "ai", "desc": "Zero-human workflow routing incoming lead forms through AI qualification directly into WhatsApp conversations within seconds.", "hi": "AI lead scoring · instant WhatsApp reply", "tech": ["n8n", "OpenAI", "Webhooks"], "featured": False, "order": 4, "img": "https://images.pexels.com/photos/26765065/pexels-photo-26765065.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "features": ["n8n workflow triggered by any form or webhook", "AI scores and qualifies every new lead", "Instant personalised reply on WhatsApp", "Retries and logging built into the pipeline"], "outcome": "Every lead gets an intelligent WhatsApp reply in seconds — even at 2 AM.", "gh": "https://github.com/rpsahnni-creator", "live": ""},
    {"title": "Support Chatbot with RAG", "cat": "ai", "desc": "Context-aware AI knowledge assistant answering from dynamic company documents via retrieval-augmented generation.", "hi": "Vector search · human handover", "tech": ["FastAPI", "LangChain", "PostgreSQL Vector"], "featured": False, "order": 5, "img": "https://images.pexels.com/photos/9951077/pexels-photo-9951077.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "features": ["RAG over company documents and FAQs", "Vector search stored in PostgreSQL", "FastAPI serving layer with LangChain", "Hands over to a human when confidence is low"], "outcome": "Support answers come from your own documents — accurate, instant, always on.", "gh": "https://github.com/rpsahnni-creator", "live": ""},
]

DEFAULT_SKILLS = [
    {"name": "Backend", "items": ["Python", "Django", "Django REST", "FastAPI", "Golang", "Node.js", "Express.js", "TypeScript", "GraphQL", "Celery"], "order": 0},
    {"name": "Databases", "items": ["PostgreSQL", "Oracle", "SQL", "MongoDB", "Redis"], "order": 1},
    {"name": "Frontend", "items": ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "Vite", "Tailwind CSS"], "order": 2},
    {"name": "Mobile", "items": ["Flutter", "React Native", "Firebase"], "order": 3},
    {"name": "Cloud & DevOps", "items": ["AWS", "GCP", "Docker", "Git", "GitHub Actions", "Nginx", "Linux", "Vercel"], "order": 4},
    {"name": "AI & Automation", "items": ["n8n", "LLM APIs", "LangChain", "RAG", "Chatbots", "Webhooks"], "order": 5},
]

DEFAULT_TESTIMONIALS = [
    {"text": "Ram took our billing from messy spreadsheets to a fully automated API — invoices, payments, everything. What our team did in hours now happens on its own.", "name": "Ankit V.", "role": "Founder, Logistics Startup", "order": 0},
    {"text": "The chat backend he built in Go handles our busiest sale days without a hiccup. Clear communication, clean code, delivered before the deadline.", "name": "Priya S.", "role": "CTO, E-commerce Platform", "order": 1},
    {"text": "Our WhatsApp lead automation replies in seconds, even at midnight. Enquiries stopped slipping through the cracks — that alone paid for the project.", "name": "Rohit M.", "role": "Owner, Real Estate Agency", "order": 2},
    {"text": "He built our dashboard and the support chatbot both. One person, full stack, zero excuses. We stopped interviewing agencies after working with him.", "name": "Sneha K.", "role": "Operations Head, EdTech Company", "order": 3},
]


# Real, shipped client projects. Unlike DEFAULT_PROJECTS (only used for an empty
# table), each of these is inserted exactly once per database — tracked by `key` in
# seed_markers — so a new entry here reaches production on the next deploy, while an
# admin can still edit or delete it afterwards without it reappearing.
# `order` is the fixed position on the site (lower = higher up; the placeholders use 0-5).
# Leave gaps so a new project can slot in between, and keep the list in display order.
SHOWCASE_PROJECTS = [
    {
        "key": "kiji-studymate",
        "order": -400,
        "title": "Kiji StudyMate — AI Quizzes from Textbook Scans",
        "cat": "ai",
        "desc": (
            "An AI study platform built for Kiji Technology OPC Pvt. Ltd.: students photograph textbook pages and get an instant practice quiz. A Go API runs the whole pipeline — PaddleOCR with a Gemini Vision fallback, then Gemini quiz generation with multi-level caching to keep AI costs down — and serves a Next.js web app, an admin panel and an Expo / React Native Android app. Plans are sold through Razorpay and PayU, with auto-renew, refunds and account credits."
        ),
        "hi": "Scan → OCR → AI quiz · Gemini + PaddleOCR · Web, Android & admin",
        "tech": ["Go", "Next.js", "React Native", "Expo", "PostgreSQL", "Redis / Valkey", "Gemini AI", "PaddleOCR"],
        "featured": True,
        "img": "/projects/kiji-studymate.webp",
        "features": [
            "End-to-end pipeline: scan pages (camera, gallery, crop, multi-page upload) → OCR → AI-generated quiz → attempt → results with explanations",
            "PaddleOCR microservice (Python + FastAPI) as the primary OCR engine, with Gemini Vision as a fallback for hard pages",
            "Gemini quiz generation and answer engine behind a circuit breaker, with OpenAI available as an alternate provider",
            "Multi-tier caching of OCR text, content and the quiz bank (Redis + PostgreSQL) to cut AI cost — a chapter already processed is served from cache",
            "Students review draft questions, publish quizzes and track progress through reports, topic analytics and quiz history",
            "Career goals with a daily practice path, plus email and push notifications with quiet hours",
            "Billing with Razorpay and PayU: plans, usage limits, auto-renew, payment history, refund requests and account credits",
            "Admin panel: users, scan jobs and retries, AI cost monitoring, cache controls, content moderation, feature flags, payments, refunds and an audit log",
            "Production-grade backend: Docker on Fly.io, 39 database migrations, CI with race detection and linting, health/readiness probes and Prometheus metrics",
        ],
        "outcome": (
            "Turns any textbook page into a ready-to-take practice quiz, and gives the client one platform — web app, Android app and admin console — to run and monetise it."
        ),
        "gh": "",
        "live": "https://studymate.kijitechnology.in",
    },
    {
        "key": "kijibooks",
        "order": -300,
        "title": "KijiBooks — GST Billing & Accounting SaaS",
        "cat": "web",
        "desc": (
            "A multi-tenant SaaS for Indian small businesses, built for Kiji Technology OPC Pvt. Ltd.: GST invoicing, POS billing, inventory, payments, expenses and banking in one place, with one-click GST and Tally exports for the accountant. A single Go service runs the API and the embedded React app, PostgreSQL row-level security keeps every business's data isolated, staff bill on the go with a Flutter mobile app, and plans are sold through Razorpay subscriptions."
        ),
        "hi": "Multi-tenant SaaS · GSTR-1/3B & Tally exports · Go + PostgreSQL RLS",
        "tech": ["Go", "React", "TypeScript", "PostgreSQL", "Flutter", "Tailwind CSS", "Razorpay", "Docker"],
        "featured": True,
        "img": "/projects/kijibooks.webp",
        "features": [
            "Complete billing workflow: sales, POS billing, quotes and orders, purchases, credit/debit notes, repeating bills, payments, banking and expenses",
            "GST built in: GSTIN validation, place-of-supply rules, and one-click GSTR-1/3B working sheets, GSTR-1 JSON, Tally XML and register exports for the CA",
            "Tenant isolation in three layers — ORM scoping, PostgreSQL row-level security and a startup check that refuses a privileged database role — proven by tests against a restricted role",
            "Team roles for owner, admin, accountant, cashier, read-only CA and viewer, with invitations and a full audit trail",
            "Secure accounts: e-mail verification, login lockout, rotating refresh tokens with reuse detection, rate limiting and security headers",
            "Free / Starter / Pro / Business plans with a 14-day Pro trial, Razorpay subscriptions, signed idempotent webhooks and plan limits",
            "Connected to KijiBestiee: every student payment there becomes a GST invoice in Sales automatically",
            "Businesses add or hide their own fields on sales, purchases, customers, products, expenses and payments",
            "Production-ready operations: Docker + Caddy, CI, health/readiness/metrics endpoints, JSON logs, Sentry, nightly backups and DPDP/GDPR data export and deletion",
        ],
        "outcome": (
            "One product a business can sign up for and run its daily billing on, with GST-ready books its accountant can file from — built as a SaaS the client can sell to many businesses."
        ),
        "gh": "",
        "live": "https://kijibooks.kijitechnology.in",
    },
    {
        "key": "kijibestiee",
        "order": -200,
        "title": "KijiBestiee — Bilingual Exam-Prep Platform",
        "cat": "web",
        "desc": (
            "A live, bilingual (English & Hindi) exam-preparation platform built end to end for "
            "Kiji Technology OPC Pvt. Ltd. University students prepare for their FYUGP Semester-I exams "
            "with chapter-wise study notes and 4,235+ practice MCQs across four courses, then unlock "
            "subjects through Razorpay payments or UPI AutoPay. One React Native codebase serves web and "
            "mobile, backed by a FastAPI + PostgreSQL API and a full admin console for students, orders and revenue."
        ),
        "hi": "Live in production · 4,235+ bilingual MCQs · Razorpay & UPI AutoPay",
        "tech": ["React Native", "Expo", "TypeScript", "FastAPI", "PostgreSQL", "SQLAlchemy", "Razorpay", "Sentry"],
        "featured": True,
        "img": "/projects/kijibestiee.webp",
        "features": [
            "Delivered the whole product: UX, React Native/Expo app (web + Android-ready), FastAPI backend, database and deployment",
            "Bilingual English/Hindi content with an instant language toggle on every screen",
            "Quiz engine with timer, instant scoring and answer review with explanations, plus a daily practice streak",
            "Razorpay checkout with one-time payments, UPI AutoPay e-mandates and a 12-hour free trial — each payment verified three ways (client signature, server check and webhooks)",
            "Automatic branded email receipts and renewal reminders, capped at one email per student per day",
            "Account security: single-device login, duplicate-account prevention via phone and canonical-email checks, and rate limiting",
            "Content protection on paid material: copy, print and dev-tools blocking on the web",
            "Admin console with revenue and student analytics, manual access grants, password resets, remote logout, receipt resends and a full audit log",
        ],
        "outcome": (
            "The client launched a paid, self-serve learning product: students sign up, pay and start "
            "practising on their own, while the team runs content, access and revenue from one dashboard."
        ),
        "gh": "",
        "live": "https://kijibestiee.kijitechnology.in",
    },
    {
        "key": "navya-society-manager",
        "order": -100,
        "title": "Navya Sen Naman Vatika — Society Management App",
        "cat": "mobile",
        "desc": (
            "A live society-management platform for the Navya Sen Naman Vatika Flat Owners Association in Deoghar, built and maintained (AMC) by Kiji Technology. The committee, gate guards and residents each get their own web dashboard and a native Flutter Android app on one Django REST backend: maintenance bills are generated every month automatically, residents pay by UPI in a tap, and the admin verifies each payment against the bank statement before a PDF receipt is emailed."
        ),
        "hi": "Live · Web + Flutter Android app · Auto-billing & UPI payments",
        "tech": ["React", "TypeScript", "Vite", "Tailwind CSS", "Django", "Django REST Framework", "PostgreSQL", "Flutter"],
        "featured": True,
        "img": "/projects/navya-society-manager.webp",
        "features": [
            "Three roles with their own dashboards: committee admin, gate guard, and flat owner/tenant (who signs in with a mobile number)",
            "Bills generated automatically on the 1st of every month from each flat's maintenance charge, with overdue reminders by email",
            "UPI “Pay Now” to the society's bank QR: residents submit the transaction ID, the admin verifies it against the bank statement, and the bill is marked paid for both owner and tenant",
            "PDF bills and receipts, emailed to the owner and the tenant and downloadable any time",
            "Gate desk for guards: visitor log, owner directory with call and gate-to-owner chat, and SOS alerts",
            "Community tools: notice board, broadcast messages, amenities, complaints, expenses and service providers",
            "Native Flutter Android app on the same backend, with guard shift attendance and a monthly Excel export",
            "One-command import of the society's Excel flat register (flats, owners, tenants and charges), safe to re-run to keep records in sync",
            "JWT sign-in with password or email OTP, a mobile-responsive UI and production health checks",
        ],
        "outcome": (
            "The association now runs billing, collections, gate security and notices from one system, and every payment is traceable to a verified bank transaction."
        ),
        "gh": "",
        "live": "https://nsnv.kijitechnology.in",
    },
    {
        "key": "srt-college-dhamri",
        "order": -50,
        "title": "S.R.T. College Dhamri — Official College Website",
        "cat": "web",
        "desc": (
            "The official website of S.R.T. College, Dhamri — a constituent college of Sido Kanhu Murmu University, Dumka — built by Kiji Technology with PHP 8, MySQL and modern HTML, CSS and JavaScript. A responsive, bilingual (English & Hindi) site of 50+ pages covers admissions, academics, administration, student amenities and a complete IQAC / NAAC section, with an admin panel that lets college staff keep news, notices and galleries up to date."
        ),
        "hi": "Live · 50+ pages · PHP 8 + MySQL · IQAC / NAAC ready",
        "tech": ["PHP 8", "MySQL", "HTML5", "CSS3", "JavaScript", "Tailwind CSS", "DataTables", "SweetAlert2"],
        "featured": True,
        "img": "/projects/srt-college-dhamri.webp",
        "features": [
            "Responsive, bilingual (English & Hindi) website of 50+ pages for students, parents, staff and accreditation bodies",
            "Admissions hub: guidelines, prospectus and fee structure, with links to online admission and the university exam portal for admit cards and results",
            "Complete IQAC section for NAAC: AQAR, meeting minutes, action-taken reports, policies, best practices, institutional distinctiveness and feedback analysis",
            "Academics and administration: programmes, NEP information, academic calendar, teaching and non-teaching staff directories, committees and the principal's message",
            "Student amenities: library, NCC, NSS and student activities, plus grievance, student-query and stakeholder feedback forms",
            "Database-driven news, notices and events, photo galleries (academic, campus, events) and a video section",
            "Admin panel for college staff to update content without touching code",
            "Quick links to NAAC, NIRF, webmail, alumni, social channels and national e-learning resources such as NPTEL, NDL and DIKSHA",
            "Built on PHP 8 and MySQL with clean HTML, CSS and JavaScript — lightweight and easy to host",
        ],
        "outcome": (
            "The college has one official, up-to-date home online for admissions, notices and NAAC / IQAC documentation — kept current by its own staff."
        ),
        "gh": "",
        "live": "https://srtc.ac.in",
    },
    {
        "key": "kiji-technology-website",
        "order": -25,
        "title": "Kiji Technology — Company Website & Product Catalogue",
        "cat": "web",
        "desc": (
            "The company website of Kiji Technology OPC Pvt. Ltd., the software firm behind several of the products in this portfolio. A server-rendered React 19 site built on TanStack Start, Tailwind CSS v4 and shadcn/ui presents 9 services and a catalogue of ready-to-deploy products — from school, college and university systems to society management and AI automation — each on its own search-friendly page, with a blog and a WhatsApp-first lead flow."
        ),
        "hi": "Live · SSR React 19 + TanStack Start · 30+ pages · WhatsApp lead flow",
        "tech": ["React 19", "TypeScript", "TanStack Start", "TanStack Router", "Tailwind CSS v4", "shadcn/ui", "Vite", "Vitest"],
        "featured": True,
        "img": "/projects/kiji-technology-website.webp",
        "features": [
            "Server-side rendered React 19 on TanStack Start (Nitro) with type-safe, file-based routing — fast first load and fully crawlable by search engines",
            "30+ pages: home, about, 9 service pages, a product catalogue with a page per product, technologies, hire-developers, blog and legal pages",
            "Desktop products mega-menu and a mobile accordion menu, with deep links to every product",
            "WhatsApp-first lead flow: the quote form turns a visitor's details into a ready-to-send WhatsApp message, backed by a floating WhatsApp button and a FAQ chat assistant that hands over to WhatsApp",
            "SEO built in: per-page titles and descriptions, Open Graph and Twitter cards, JSON-LD structured data and a sitemap",
            "Custom brand design system with Tailwind CSS v4 OKLCH colour tokens (sun yellow, leaf green, forest green) and Sora + Manrope typography",
            "46 accessible shadcn/ui (Radix) components for keyboard-friendly, ARIA-compliant UI",
            "All content — contact details, services, products, tech stack and process — lives in one data file, so adding a product or service is a single edit",
            "Production hardening: security headers, CSRF protection on server functions, a graceful 500 fallback page, routing tests with Vitest and Google Analytics ready to switch on",
        ],
        "outcome": (
            "Kiji Technology now has a professional storefront that explains every service and product on its own search-friendly page and turns visitors straight into WhatsApp conversations."
        ),
        "gh": "",
        "live": "https://kijitechnology.in",
    },
]


# Placeholder projects replaced by a real one. Each is deleted once per database
# (tracked in seed_markers), so re-adding it by hand in the admin panel sticks.
RETIRED_PROJECT_TITLES = [
    "Billing & Invoice API",  # replaced by KijiBooks
]


async def retire_placeholders():
    pool = get_pool()
    for title in RETIRED_PROJECT_TITLES:
        async with pool.acquire() as conn, conn.transaction():
            claimed = await conn.fetchval(
                "INSERT INTO seed_markers (key, applied_at) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING key",
                f"retire:{title}", datetime.now(timezone.utc).isoformat(),
            )
            if claimed:
                res = await conn.execute("DELETE FROM projects WHERE title=$1", title)
                logger.info(f"Retired placeholder project {title!r} ({res})")


# Bump when the `order` or `live` URL of an already-seeded project changes in the list
# above: on the next start, those two fields are re-applied once to existing databases.
# v2: KijiBooks got its live URL.
SHOWCASE_SYNC_VERSION = 2


async def seed_showcase():
    pool = get_pool()
    now = datetime.now(timezone.utc).isoformat()
    for p in SHOWCASE_PROJECTS:
        async with pool.acquire() as conn, conn.transaction():
            # Claiming the marker first makes this safe with several workers starting at once.
            claimed = await conn.fetchval(
                "INSERT INTO seed_markers (key, applied_at) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING key",
                f"project:{p['key']}", now,
            )
            if not claimed:
                continue
            await conn.execute(
                """INSERT INTO projects (id,title,cat,description,hi,tech,featured,sort_order,img,features,outcome,gh,live)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
                str(uuid.uuid4()), p["title"], p["cat"], p["desc"], p.get("hi", ""),
                json.dumps(p.get("tech", [])), p.get("featured", False), p["order"],
                p.get("img", ""), json.dumps(p.get("features", [])), p.get("outcome", ""),
                p.get("gh", ""), p.get("live", ""),
            )
            logger.info(f"Showcase project added: {p['title']}")

    # Rows seeded earlier keep whatever order/live they were inserted with; sync them once per version.
    async with pool.acquire() as conn, conn.transaction():
        claimed = await conn.fetchval(
            "INSERT INTO seed_markers (key, applied_at) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING key",
            f"showcase-sync:v{SHOWCASE_SYNC_VERSION}", now,
        )
        if claimed:
            for p in SHOWCASE_PROJECTS:
                await conn.execute(
                    "UPDATE projects SET sort_order=$1, live=$2 WHERE title=$3",
                    p["order"], p.get("live", ""), p["title"],
                )


async def seed_content():
    pool = get_pool()
    if await pool.fetchval("SELECT count(*) FROM projects") == 0:
        for p in DEFAULT_PROJECTS:
            await pool.execute(
                """INSERT INTO projects (id,title,cat,description,hi,tech,featured,sort_order,img,features,outcome,gh,live)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
                str(uuid.uuid4()), p["title"], p["cat"], p["desc"], p.get("hi", ""),
                json.dumps(p.get("tech", [])), p.get("featured", False), p.get("order", 0),
                p.get("img", ""), json.dumps(p.get("features", [])), p.get("outcome", ""),
                p.get("gh", ""), p.get("live", ""),
            )
    if await pool.fetchval("SELECT count(*) FROM skills") == 0:
        for s in DEFAULT_SKILLS:
            await pool.execute(
                "INSERT INTO skills (id,name,items,sort_order) VALUES ($1,$2,$3,$4)",
                str(uuid.uuid4()), s["name"], json.dumps(s.get("items", [])), s.get("order", 0),
            )
    if await pool.fetchval("SELECT count(*) FROM testimonials") == 0:
        for t in DEFAULT_TESTIMONIALS:
            await pool.execute(
                "INSERT INTO testimonials (id,body,name,role,sort_order) VALUES ($1,$2,$3,$4,$5)",
                str(uuid.uuid4()), t["text"], t["name"], t.get("role", ""), t.get("order", 0),
            )


def parse_project_row(row) -> dict:
    d = dict(row)
    d["desc"] = d.pop("description")
    d["order"] = d.pop("sort_order")
    d["tech"] = json.loads(d.get("tech") or "[]")
    d["features"] = json.loads(d.get("features") or "[]")
    return d


def parse_skill_row(row) -> dict:
    d = dict(row)
    d["order"] = d.pop("sort_order")
    d["items"] = json.loads(d.get("items") or "[]")
    return d


def parse_testimonial_row(row) -> dict:
    d = dict(row)
    d["text"] = d.pop("body")
    d["order"] = d.pop("sort_order")
    return d


def shape_project(p, i, span):
    return {
        "id": p["id"], "n": f"{i + 1:02d}", "t": p["title"], "c": p["cat"],
        "cl": CAT_LABELS.get(p["cat"], p["cat"]), "d": p["desc"], "hi": p.get("hi", ""),
        "k": p.get("tech", []), "span": span, "featured": bool(p.get("featured")),
        "img": p.get("img", ""), "features": p.get("features", []),
        "outcome": p.get("outcome", ""), "gh": p.get("gh", ""), "live": p.get("live", ""),
    }


@api_router.get("/content")
async def get_content():
    pool = get_pool()
    proj_rows = await pool.fetch("SELECT * FROM projects ORDER BY sort_order ASC LIMIT 200")
    projs = [parse_project_row(r) for r in proj_rows]
    shaped = []
    j = 0
    for i, p in enumerate(projs):
        if p.get("featured"):
            span = "lg:col-span-6"
        else:
            span = SPAN_PATTERN[j % len(SPAN_PATTERN)]
            j += 1
        shaped.append(shape_project(p, i, span))
    skill_rows = await pool.fetch("SELECT * FROM skills ORDER BY sort_order ASC LIMIT 50")
    skills = [parse_skill_row(r) for r in skill_rows]
    testi_rows = await pool.fetch("SELECT * FROM testimonials ORDER BY sort_order ASC LIMIT 50")
    testis = [parse_testimonial_row(r) for r in testi_rows]
    resume = await pool.fetchrow("SELECT id FROM files WHERE id='resume'")
    return {
        "projects": shaped,
        "skills": [{"id": s["id"], "name": s["name"], "items": s["items"], "order": s["order"]} for s in skills],
        "testimonials": [{"id": t["id"], "text": t["text"], "name": t["name"], "role": t["role"], "order": t["order"]} for t in testis],
        "resumeUrl": "/api/resume" if resume else "",
    }

# ---------------- Admin CRUD ----------------

class ProjectIn(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    cat: str = Field(pattern="^(backend|web|mobile|ai)$")
    desc: str = Field(min_length=5, max_length=600)
    hi: str = ""
    tech: list[str] = []
    features: list[str] = []
    outcome: str = ""
    gh: str = ""
    live: str = ""
    img: str = ""
    featured: bool = False
    order: int = 0


class SkillIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    items: list[str] = []
    order: int = 0


class TestimonialIn(BaseModel):
    text: str = Field(min_length=5, max_length=600)
    name: str = Field(min_length=2, max_length=60)
    role: str = ""
    order: int = 0


@api_router.get("/admin/projects")
async def admin_list_projects(admin=Depends(get_current_admin)):
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM projects ORDER BY sort_order ASC LIMIT 200")
    return [parse_project_row(r) for r in rows]


@api_router.post("/admin/projects")
async def admin_create_project(p: ProjectIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    pid = str(uuid.uuid4())
    await pool.execute(
        """INSERT INTO projects (id,title,cat,description,hi,tech,featured,sort_order,img,features,outcome,gh,live)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
        pid, p.title, p.cat, p.desc, p.hi, json.dumps(p.tech), p.featured, p.order,
        p.img, json.dumps(p.features), p.outcome, p.gh, p.live,
    )
    doc = p.model_dump()
    doc["id"] = pid
    return doc


@api_router.put("/admin/projects/{pid}")
async def admin_update_project(pid: str, p: ProjectIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    res = await pool.execute(
        """UPDATE projects SET title=$1,cat=$2,description=$3,hi=$4,tech=$5,featured=$6,
           sort_order=$7,img=$8,features=$9,outcome=$10,gh=$11,live=$12 WHERE id=$13""",
        p.title, p.cat, p.desc, p.hi, json.dumps(p.tech), p.featured, p.order,
        p.img, json.dumps(p.features), p.outcome, p.gh, p.live, pid,
    )
    if res == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "ok"}


@api_router.delete("/admin/projects/{pid}")
async def admin_delete_project(pid: str, admin=Depends(get_current_admin)):
    pool = get_pool()
    await pool.execute("DELETE FROM projects WHERE id=$1", pid)
    return {"status": "ok"}


@api_router.get("/admin/skills")
async def admin_list_skills(admin=Depends(get_current_admin)):
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM skills ORDER BY sort_order ASC LIMIT 50")
    return [parse_skill_row(r) for r in rows]


@api_router.post("/admin/skills")
async def admin_create_skill(s: SkillIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    sid = str(uuid.uuid4())
    await pool.execute(
        "INSERT INTO skills (id,name,items,sort_order) VALUES ($1,$2,$3,$4)",
        sid, s.name, json.dumps(s.items), s.order,
    )
    doc = s.model_dump()
    doc["id"] = sid
    return doc


@api_router.put("/admin/skills/{sid}")
async def admin_update_skill(sid: str, s: SkillIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    res = await pool.execute(
        "UPDATE skills SET name=$1,items=$2,sort_order=$3 WHERE id=$4",
        s.name, json.dumps(s.items), s.order, sid,
    )
    if res == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Skill group not found")
    return {"status": "ok"}


@api_router.delete("/admin/skills/{sid}")
async def admin_delete_skill(sid: str, admin=Depends(get_current_admin)):
    pool = get_pool()
    await pool.execute("DELETE FROM skills WHERE id=$1", sid)
    return {"status": "ok"}


@api_router.get("/admin/testimonials")
async def admin_list_testimonials(admin=Depends(get_current_admin)):
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM testimonials ORDER BY sort_order ASC LIMIT 50")
    return [parse_testimonial_row(r) for r in rows]


@api_router.post("/admin/testimonials")
async def admin_create_testimonial(t: TestimonialIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    tid = str(uuid.uuid4())
    await pool.execute(
        "INSERT INTO testimonials (id,body,name,role,sort_order) VALUES ($1,$2,$3,$4,$5)",
        tid, t.text, t.name, t.role, t.order,
    )
    doc = t.model_dump()
    doc["id"] = tid
    return doc


@api_router.put("/admin/testimonials/{tid}")
async def admin_update_testimonial(tid: str, t: TestimonialIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    res = await pool.execute(
        "UPDATE testimonials SET body=$1,name=$2,role=$3,sort_order=$4 WHERE id=$5",
        t.text, t.name, t.role, t.order, tid,
    )
    if res == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"status": "ok"}


@api_router.delete("/admin/testimonials/{tid}")
async def admin_delete_testimonial(tid: str, admin=Depends(get_current_admin)):
    pool = get_pool()
    await pool.execute("DELETE FROM testimonials WHERE id=$1", tid)
    return {"status": "ok"}


@api_router.get("/admin/enquiries")
async def admin_enquiries(admin=Depends(get_current_admin)):
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 200")
    return [dict(r) for r in rows]


class ReplyIn(BaseModel):
    message: str = Field(min_length=2, max_length=4000)


@api_router.post("/admin/enquiries/{eid}/reply")
async def admin_reply_enquiry(eid: str, payload: ReplyIn, admin=Depends(get_current_admin)):
    pool = get_pool()
    enq = await pool.fetchrow("SELECT * FROM enquiries WHERE id=$1", eid)
    if not enq:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    name_e = escape(enq["name"])
    msg_e = escape(payload.message).replace("\n", "<br/>")
    subject = "Re: your enquiry to rpsahnni.dev"
    html = (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px;'
        'font-family:Arial,sans-serif;color:#111827">'
        f'<p style="margin:0 0 12px">Hi {name_e},</p>'
        f'<p style="margin:0 0 12px">{msg_e}</p>'
        '<p style="margin:0 0 12px">— Ram Pravesh Sahni, Full-Stack, Mobile &amp; AI Automation Developer</p>'
        f'<p style="margin:24px 0 0;font-size:12px;color:#6b7280">Sent by {escape(EMAIL_FROM_NAME)} in reply to your enquiry. '
        'We never ask for your password or card details by email.</p>'
        '</td></tr></table>'
    )
    await send_email(to=enq["email"], subject=subject, html=html)
    await pool.execute(
        "UPDATE enquiries SET replied_at=$1 WHERE id=$2",
        datetime.now(timezone.utc).isoformat(), eid,
    )
    return {"status": "ok"}


class TrackIn(BaseModel):
    path: str = Field(max_length=200)
    sid: str = Field(max_length=64)
    ref: str = ""


@api_router.post("/track")
async def track_view(t: TrackIn, request: Request):
    if not t.path.startswith("/"):
        raise HTTPException(status_code=400, detail="bad path")
    if not await _rate_ok(get_client_ip(request), kind="track", limit=30, window=600):
        return {"status": "ignored"}
    pool = get_pool()
    ua = request.headers.get("user-agent", "")[:300]
    await pool.execute(
        "INSERT INTO pageviews (id, path, sid, ref, ua, at) VALUES ($1,$2,$3,$4,$5,$6)",
        str(uuid.uuid4()), t.path, t.sid, t.ref[:300], ua, datetime.now(timezone.utc).isoformat(),
    )
    return {"status": "ok"}


def _device_family(ua: str) -> str:
    u = (ua or "").lower()
    if "ipad" in u or "tablet" in u:
        return "Tablet"
    if "mobi" in u or "iphone" in u or "android" in u:
        return "Mobile"
    return "Desktop"


def _browser_family(ua: str) -> str:
    u = (ua or "").lower()
    if "edg/" in u:
        return "Edge"
    if "chrome/" in u and "chromium" not in u:
        return "Chrome"
    if "firefox/" in u:
        return "Firefox"
    if "safari/" in u and "chrome/" not in u:
        return "Safari"
    return "Other"


@api_router.get("/admin/analytics")
async def admin_analytics(admin=Depends(get_current_admin)):
    pool = get_pool()
    views = [dict(r) for r in await pool.fetch("SELECT sid, ref, ua, at FROM pageviews")]
    enqs = [dict(r) for r in await pool.fetch("SELECT created_at FROM enquiries")]
    now = datetime.now(timezone.utc)
    days = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date().isoformat()
        days.append({
            "day": day,
            "views": sum(1 for v in views if str(v.get("at", "")).startswith(day)),
            "enquiries": sum(1 for e in enqs if str(e.get("created_at", "")).startswith(day)),
        })
    refs = {}
    devices = {}
    browsers = {}
    for v in views:
        r = v.get("ref") or ""
        host = "Direct"
        if r:
            host = urlparse(r).hostname or "Direct"
        refs[host] = refs.get(host, 0) + 1
        d = _device_family(v.get("ua", ""))
        b = _browser_family(v.get("ua", ""))
        devices[d] = devices.get(d, 0) + 1
        browsers[b] = browsers.get(b, 0) + 1
    top = sorted(refs.items(), key=lambda x: -x[1])[:5]
    return {
        "totalViews": len(views),
        "uniqueSessions": len({v.get("sid") for v in views if v.get("sid")}),
        "totalEnquiries": len(enqs),
        "days": days,
        "topReferrers": [{"source": k, "count": c} for k, c in top],
        "devices": sorted(({"name": k, "count": c} for k, c in devices.items()), key=lambda x: -x["count"]),
        "browsers": sorted(({"name": k, "count": c} for k, c in browsers.items()), key=lambda x: -x["count"]),
    }

# ---------------- Files (images + resume) ----------------

def _optimize_image(data: bytes, max_dim: int = 1920, quality: int = 82) -> bytes:
    """Re-encode to WebP and cap the longest side, so uploads from a phone/DSLR
    don't ship multi-MB images to every visitor."""
    img = Image.open(io.BytesIO(data))
    img.load()
    if img.mode == "P":
        img = img.convert("RGBA" if "transparency" in img.info else "RGB")
    elif img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGB")
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="WEBP", quality=quality, method=6)
    return out.getvalue()


@api_router.post("/admin/files")
async def admin_upload_file(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads allowed here")
    try:
        data = _optimize_image(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read this image file")
    pool = get_pool()
    fid = str(uuid.uuid4())
    await pool.execute(
        "INSERT INTO files (id, filename, content_type, data, created_at) VALUES ($1,$2,$3,$4,$5)",
        fid, file.filename, "image/webp", data, datetime.now(timezone.utc).isoformat(),
    )
    return {"id": fid, "url": f"/api/files/{fid}"}


@api_router.post("/admin/resume")
async def admin_upload_resume(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF allowed for resume")
    pool = get_pool()
    await pool.execute(
        """INSERT INTO files (id, filename, content_type, data, created_at)
           VALUES ('resume', $1, 'application/pdf', $2, $3)
           ON CONFLICT (id) DO UPDATE SET filename=$1, content_type='application/pdf', data=$2, created_at=$3""",
        file.filename, data, datetime.now(timezone.utc).isoformat(),
    )
    return {"status": "ok", "url": "/api/resume"}


@api_router.get("/files/{fid}")
async def get_file(fid: str):
    pool = get_pool()
    doc = await pool.fetchrow("SELECT content_type, data FROM files WHERE id=$1", fid)
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=bytes(doc["data"]), media_type=doc["content_type"],
                    headers={"Cache-Control": "public, max-age=31536000, immutable"})


@api_router.get("/resume")
async def get_resume():
    pool = get_pool()
    doc = await pool.fetchrow("SELECT filename, data FROM files WHERE id='resume'")
    if not doc:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")
    # Uploaded filenames can contain quotes or non-Latin-1 characters, which would break
    # (or inject into) the header — serve a fixed, safe name instead.
    return Response(content=bytes(doc["data"]), media_type="application/pdf",
                    headers={"Content-Disposition": 'inline; filename="Ram-Pravesh-Sahni-Resume.pdf"',
                             "Cache-Control": "public, max-age=300"})

# ---------------- Email (contact form) ----------------

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None,
                     scan: tuple[str, str] | None = None) -> None:
    # `scan` lets a caller run the safety check on its own template instead of the final
    # HTML, so quoted visitor text (e.g. "we need CVV validation") can't block a notification.
    try:
        _assert_safe_email(*(scan or (subject, html)))
    except ValueError as e:
        logger.error(f"Email blocked by safety check: {e}")
        raise HTTPException(status_code=400, detail="This email could not be sent")
    if not SMTP_HOST:
        logger.warning("SMTP not configured — email not sent")
        raise HTTPException(status_code=503, detail="Email is temporarily unavailable")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{EMAIL_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = to
    rt = reply_to or EMAIL_REPLY_TO
    if rt:
        msg["Reply-To"] = rt
    msg.set_content("This email requires an HTML-capable mail client to view.")
    msg.add_alternative(html, subtype="html")
    try:
        await aiosmtplib.send(
            msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_PASSWORD,
            start_tls=SMTP_USE_TLS, timeout=30,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email send error: {e}")
        raise HTTPException(status_code=502, detail="Failed to send email")


async def _rate_ok(ip: str, kind: str = "contact", limit: int = 5, window: int = 600) -> bool:
    # DB-backed so the limit holds across worker processes/restarts, not just in one process's memory.
    pool = get_pool()
    now = time.time()
    cutoff = now - window
    count = await pool.fetchval(
        "SELECT count(*) FROM rate_hits WHERE ip=$1 AND kind=$2 AND at>$3", ip, kind, cutoff
    )
    if count >= limit:
        return False
    await pool.execute("INSERT INTO rate_hits (ip, kind, at) VALUES ($1,$2,$3)", ip, kind, now)
    await pool.execute("DELETE FROM rate_hits WHERE ip=$1 AND kind=$2 AND at<=$3", ip, kind, cutoff)
    return True


# ---------------- Chatbot ----------------

CONTACT_EMAIL = "rpsahnni@gmail.com"
CONTACT_PHONE = "+91 90396 93335"

CHAT_PROVIDER = os.environ.get("CHAT_PROVIDER", "").strip().lower()
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

ANTHROPIC_CHAT_MODEL = os.environ.get("ANTHROPIC_CHAT_MODEL", "claude-sonnet-5-5")
OPENAI_CHAT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")
GEMINI_CHAT_MODEL = os.environ.get("GEMINI_CHAT_MODEL", "gemini-3.5-flash")

_CHAT_PROVIDER_KEYS = {"anthropic": ANTHROPIC_API_KEY, "openai": OPENAI_API_KEY, "gemini": GEMINI_API_KEY}


def _active_chat_provider() -> str | None:
    if CHAT_PROVIDER in _CHAT_PROVIDER_KEYS and _CHAT_PROVIDER_KEYS[CHAT_PROVIDER]:
        return CHAT_PROVIDER
    for name in ("anthropic", "openai", "gemini"):
        if _CHAT_PROVIDER_KEYS[name]:
            return name
    return None


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)


async def _build_chat_system_prompt() -> str:
    pool = get_pool()
    proj_rows = await pool.fetch(
        "SELECT title, cat, description, tech FROM projects ORDER BY sort_order ASC LIMIT 20"
    )
    skill_rows = await pool.fetch("SELECT name, items FROM skills ORDER BY sort_order ASC LIMIT 20")

    projects_txt = "\n".join(
        f"- {r['title']} ({r['cat']}): {r['description']} [tech: {', '.join(json.loads(r['tech'] or '[]'))}]"
        for r in proj_rows
    ) or "No projects listed yet."

    skills_txt = "\n".join(
        f"- {r['name']}: {', '.join(json.loads(r['items'] or '[]'))}" for r in skill_rows
    ) or "No skills listed yet."

    services_txt = (
        "- Backend & APIs: Secure, well-documented REST APIs/services in Django, FastAPI, Go or Node.js, "
        "backed by PostgreSQL or Oracle.\n"
        "- Websites & Web Apps: Fast, SEO-friendly sites and dashboards in React, Next.js and TypeScript, "
        "deployable on Vercel or AWS.\n"
        "- Mobile Apps: One codebase for Android and iOS with Flutter or React Native, connected to a backend.\n"
        "- Cloud & DevOps: Docker, GitHub Actions pipelines and deployment on AWS or GCP, kept inside budget."
    )

    return (
        f"You are the AI assistant embedded on {EMAIL_FROM_NAME}'s portfolio website (rpsahnni.dev). "
        f"{EMAIL_FROM_NAME} is a freelance full-stack, mobile and AI-automation developer based in Deoghar, "
        "Jharkhand, India.\n\n"
        "Your job: give every visitor a complete, accurate answer in one go — about his projects, skills, "
        "services, working style, availability, and how to get in touch. Be warm, concise and specific; "
        "use short paragraphs or simple bullet points, not walls of text.\n"
        "Reply in PLAIN TEXT only — this is rendered as-is in a chat bubble with no markdown support. "
        "Never use asterisks, hash headers, backticks or markdown links. For a list, start each line with "
        "'- '. For emphasis, just write plainly instead of using bold/italics.\n"
        "Never invent projects, numbers, prices or claims that are not in the context below — if you don't "
        "know something, say so plainly and point them to the contact form or email.\n"
        "If asked something unrelated to him, his work, or hiring him, politely redirect to what you can help with.\n\n"
        f"PROJECTS:\n{projects_txt}\n\n"
        f"SKILLS:\n{skills_txt}\n\n"
        f"SERVICES:\n{services_txt}\n\n"
        "CONTACT:\n"
        f"- Email: {CONTACT_EMAIL}\n"
        f"- Phone / WhatsApp: {CONTACT_PHONE} (wa.me/919039693335)\n"
        "- GitHub: github.com/rpsahnni-creator — LinkedIn: linkedin.com/in/rp-sahnni\n"
        "- There is also a contact form on this site (the 'Let's build something' section) that sends the "
        "enquiry straight to him.\n"
    )


async def _call_anthropic(system: str, messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={"model": ANTHROPIC_CHAT_MODEL, "max_tokens": 600, "system": system, "messages": messages},
        )
        resp.raise_for_status()
        data = resp.json()
        return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text").strip()


async def _call_openai(system: str, messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "content-type": "application/json"},
            json={
                "model": OPENAI_CHAT_MODEL,
                "max_tokens": 600,
                "messages": [{"role": "system", "content": system}] + messages,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


async def _call_gemini(system: str, messages: list[dict]) -> str:
    contents = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_CHAT_MODEL}:generateContent",
            # Header, not ?key= — a query-string key ends up in httpx/proxy access logs.
            headers={"x-goog-api-key": GEMINI_API_KEY},
            json={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": contents,
                "generationConfig": {"maxOutputTokens": 1024, "thinkingConfig": {"thinkingBudget": 0}},
            },
        )
        resp.raise_for_status()
        data = resp.json()
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts).strip()


def _normalize_history(history: list[ChatMessage], message: str) -> list[dict]:
    # LLM APIs (Anthropic especially) reject a conversation that starts with an assistant
    # turn — e.g. the widget's welcome bubble — or has two same-role turns in a row.
    out: list[dict] = []
    for m in history:
        if not out and m.role != "user":
            continue
        if out and out[-1]["role"] == m.role:
            out[-1]["content"] += "\n\n" + m.content
        else:
            out.append({"role": m.role, "content": m.content})
    if out and out[-1]["role"] == "user":
        out[-1]["content"] += "\n\n" + message
    else:
        out.append({"role": "user", "content": message})
    return out


@api_router.post("/chat")
async def chat(payload: ChatIn, request: Request):
    ip = get_client_ip(request)
    if not await _rate_ok(ip, kind="chat", limit=20, window=600):
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a bit and try again.")

    provider = _active_chat_provider()
    if not provider:
        return {
            "reply": (
                "The AI assistant isn't fully set up yet — but I'd still love to help! Please reach out via "
                f"the contact form below, WhatsApp, or email {CONTACT_EMAIL}."
            ),
            "provider": None,
        }

    system = await _build_chat_system_prompt()
    messages = _normalize_history(payload.history[-10:], payload.message)

    try:
        if provider == "anthropic":
            reply = await _call_anthropic(system, messages)
        elif provider == "openai":
            reply = await _call_openai(system, messages)
        else:
            reply = await _call_gemini(system, messages)
    except Exception as e:
        logger.error(f"Chat provider {provider} error: {e}")
        raise HTTPException(
            status_code=502, detail="The assistant is temporarily unavailable. Please try again or use the contact form."
        )

    if not reply:
        raise HTTPException(
            status_code=502, detail="The assistant is temporarily unavailable. Please try again or use the contact form."
        )

    return {"reply": reply, "provider": provider}


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(min_length=10, max_length=4000)
    phone: str = Field(default="", max_length=40)
    # Honeypot: hidden from humans in the form; bots that fill every field get silently dropped.
    website: str = Field(default="", max_length=200)


@api_router.get("/")
async def root():
    return {"message": "rpsahnni.dev API", "status": "ok"}


@api_router.post("/contact")
async def create_enquiry(payload: ContactIn, request: Request):
    if payload.website.strip():
        logger.info("Contact honeypot triggered — dropping submission")
        return {"status": "ok", "id": str(uuid.uuid4()), "emailed": True}

    ip = get_client_ip(request)
    if not await _rate_ok(ip):
        raise HTTPException(status_code=429, detail="Too many messages. Please try again later.")

    # CR/LF in the name would make EmailMessage raise when it goes into the Subject header.
    name = " ".join(payload.name.split())
    phone = " ".join(payload.phone.split())
    message = payload.message.strip()
    if len(name) < 2 or len(message) < 10:
        raise HTTPException(status_code=422, detail="Please fill in your name and a short message")
    if phone:
        message = f"{message}\n\nPhone / WhatsApp: {phone}"

    pool = get_pool()
    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": payload.email,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await pool.execute(
        "INSERT INTO enquiries (id,name,email,message,created_at) VALUES ($1,$2,$3,$4,$5)",
        doc["id"], doc["name"], doc["email"], doc["message"], doc["created_at"],
    )

    def owner_html_for(n: str, e: str, m: str) -> str:
        return (
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px;'
            'font-family:Arial,sans-serif;color:#111827">'
            f'<h2 style="margin:0 0 16px;font-size:18px">New enquiry on {escape(EMAIL_FROM_NAME)}</h2>'
            f'<p style="margin:0 0 8px"><strong>Name:</strong> {n}</p>'
            f'<p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:{e}">{e}</a></p>'
            f'<p style="margin:16px 0 4px"><strong>Message:</strong></p>'
            f'<p style="margin:0;padding:12px;background:#f3f4f6;border-radius:8px">{m}</p>'
            '<p style="margin:16px 0 0;font-size:13px">Just hit Reply — it goes straight to the client.</p>'
            f'<p style="margin:24px 0 0;font-size:12px;color:#6b7280">Sent by the contact form on {escape(EMAIL_FROM_NAME)}. '
            'We never ask for your password or card details by email.</p>'
            '</td></tr></table>'
        )

    name_e = escape(name)
    email_e = escape(payload.email)
    msg_e = escape(message).replace("\n", "<br/>")

    owner_subject = f"New project enquiry from {name[:60]}"
    owner_html = owner_html_for(name_e, email_e, msg_e)

    visitor_subject = "Thanks for reaching out"
    visitor_html = (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px;'
        'font-family:Arial,sans-serif;color:#111827">'
        f'<p style="margin:0 0 12px">Hi {name_e},</p>'
        '<p style="margin:0 0 12px">Thanks for your enquiry — I have received your message and will reply within a day.</p>'
        f'<p style="margin:0 0 12px">Need a faster answer? Call or WhatsApp me on {escape(CONTACT_PHONE)}.</p>'
        '<p style="margin:0 0 12px">— Ram Pravesh Sahni, Full-Stack, Mobile &amp; AI Automation Developer</p>'
        f'<p style="margin:24px 0 0;font-size:12px;color:#6b7280">Sent by {escape(EMAIL_FROM_NAME)}. '
        'We never ask for your password or card details by email.</p>'
        '</td></tr></table>'
    )

    emailed = True
    try:
        # Reply-To = visitor, so hitting "Reply" in the inbox goes straight to the client.
        await send_email(
            to=OWNER_EMAIL, subject=owner_subject, html=owner_html, reply_to=payload.email,
            scan=("New project enquiry", owner_html_for("Visitor", "visitor@example.com", "Message")),
        )
    except HTTPException:
        emailed = False
        logger.warning(f"Enquiry {doc['id']} saved but owner notification failed")
    try:
        await send_email(to=payload.email, subject=visitor_subject, html=visitor_html)
    except HTTPException:
        logger.warning(f"Enquiry {doc['id']} saved but visitor confirmation failed")

    return {"status": "ok", "id": doc["id"], "emailed": emailed}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',') if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    if JWT_SECRET in ("replace-with-a-long-random-value", "change-me") or len(JWT_SECRET) < 16:
        logger.warning("JWT_SECRET looks like a placeholder — set a long random value before going live")
    if OWNER_EMAIL.endswith("@example.com"):
        logger.warning("OWNER_EMAIL is still a placeholder — contact-form notifications will go nowhere")
    if not SMTP_HOST:
        logger.warning("SMTP_HOST not set — enquiries are saved but no email notification is sent")
    await init_pool()
    await init_schema()
    await seed_admin()
    await seed_content()
    await seed_showcase()
    await retire_placeholders()


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_pool()
