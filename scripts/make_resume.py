from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

EMERALD = HexColor("#059669")
INK = HexColor("#0f172a")
MUTE = HexColor("#475569")

OUT = "/app/frontend/public/Ram-Pravesh-Sahni-Resume.pdf"

styles = {
    "name": ParagraphStyle("name", fontName="Helvetica-Bold", fontSize=22, textColor=INK, spaceAfter=2),
    "title": ParagraphStyle("title", fontName="Helvetica", fontSize=11, textColor=EMERALD, spaceAfter=4),
    "contact": ParagraphStyle("contact", fontName="Helvetica", fontSize=8.5, textColor=MUTE, spaceAfter=2),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=10.5, textColor=EMERALD, spaceBefore=10, spaceAfter=3),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9, textColor=INK, leading=13),
    "item": ParagraphStyle("item", fontName="Helvetica", fontSize=9, textColor=INK, leading=13, leftIndent=10, bulletIndent=0),
    "bold": ParagraphStyle("bold", fontName="Helvetica-Bold", fontSize=9.5, textColor=INK, leading=13),
}

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
                        title="Ram Pravesh Sahni — Resume", author="Ram Pravesh Sahni")

story = [
    Paragraph("RAM PRAVESH SAHNI", styles["name"]),
    Paragraph("Full-Stack Developer · Mobile Apps · AI Automation", styles["title"]),
    Paragraph("rpsahnni@gmail.com &nbsp;|&nbsp; +91 90396 93335 &nbsp;|&nbsp; Deoghar, Jharkhand, India", styles["contact"]),
    Paragraph("github.com/rpshnni-creator &nbsp;|&nbsp; linkedin.com/in/rp-sahnni".replace("rpshnni", "rpsahnni"), styles["contact"]),
    HRFlowable(width="100%", thickness=1, color=EMERALD, spaceBefore=6, spaceAfter=2),

    Paragraph("SUMMARY", styles["h"]),
    Paragraph(
        "Freelance developer who takes products from idea to production — fast backends, modern web apps, "
        "cross-platform mobile apps and AI automations that remove repetitive work from your team.",
        styles["body"],
    ),

    Paragraph("SKILLS", styles["h"]),
    Paragraph("<b>Backend:</b> Python, Django, Django REST, FastAPI, Golang, Node.js, Express.js, TypeScript, GraphQL, Celery", styles["body"]),
    Paragraph("<b>Databases:</b> PostgreSQL, Oracle, SQL, MongoDB, Redis", styles["body"]),
    Paragraph("<b>Frontend:</b> HTML5, CSS3, JavaScript, React, Next.js, Vite, Tailwind CSS", styles["body"]),
    Paragraph("<b>Mobile:</b> Flutter, React Native, Firebase", styles["body"]),
    Paragraph("<b>Cloud &amp; DevOps:</b> AWS, GCP, Docker, Git, GitHub Actions, Nginx, Linux, Vercel", styles["body"]),
    Paragraph("<b>AI &amp; Automation:</b> n8n, LLM APIs, LangChain, RAG, Chatbots, Webhooks", styles["body"]),

    Paragraph("PROJECTS", styles["h"]),
    Paragraph("<b>Billing &amp; Invoice API</b> — Multi-tenant billing service with RBAC, PDF invoices and payment webhooks. <i>Django, PostgreSQL, Docker, AWS</i>", styles["item"], bulletText="•"),
    Paragraph("<b>Realtime Chat Service</b> — WebSocket chat server for 10k+ concurrent connections with pub/sub and history. <i>Golang, Redis, PostgreSQL</i>", styles["item"], bulletText="•"),
    Paragraph("<b>Business Dashboard</b> — Analytics portal with real-time telemetry, charts and exportable reports. <i>React, TypeScript, Tailwind CSS</i>", styles["item"], bulletText="•"),
    Paragraph("<b>Delivery Tracking App</b> — Cross-platform app with live GPS tracking, push alerts and order lifecycle. <i>Flutter, Firebase, FastAPI</i>", styles["item"], bulletText="•"),
    Paragraph("<b>Lead-to-WhatsApp Automation</b> — n8n workflow scoring leads with AI and replying on WhatsApp instantly. <i>n8n, OpenAI, Webhooks</i>", styles["item"], bulletText="•"),
    Paragraph("<b>Support Chatbot with RAG</b> — Chatbot answering from company documents via retrieval-augmented generation. <i>FastAPI, LangChain, PostgreSQL Vector</i>", styles["item"], bulletText="•"),

    Paragraph("SERVICES", styles["h"]),
    Paragraph("Backend &amp; APIs · Websites &amp; Web Apps · Mobile Apps · Cloud &amp; DevOps · AI Workflow Automation", styles["body"]),
    Spacer(1, 6),
    HRFlowable(width="100%", thickness=0.5, color=MUTE, spaceBefore=4, spaceAfter=2),
    Paragraph("rpsahnni.dev", ParagraphStyle("foot", fontName="Helvetica", fontSize=8, textColor=MUTE)),
]

doc.build(story)
print("PDF written:", OUT)
