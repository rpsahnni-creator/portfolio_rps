import { Bot, Cloud, Database, Globe, Server, Smartphone } from "lucide-react";

const IMG = {
  code: "https://images.unsplash.com/photo-1759661881353-5b9cc55e1cf4?crop=entropy&cs=srgb&fm=jpg&q=85",
  matrix: "https://images.pexels.com/photos/26765065/pexels-photo-26765065.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  binary: "https://images.pexels.com/photos/9951077/pexels-photo-9951077.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export const me = {
  name: "Ram Pravesh Sahni",
  first: "RAM PRAVESH",
  last: "SAHNI",
  email: "rpsahnni@gmail.com",
  phone: "+91 90396 93335",
  tel: "tel:+919039693335",
  wa: "https://wa.me/919039693335",
  address: "Ward No-16, Hanuman Tikri, Deoghar, Jharkhand 814112",
  location: "Deoghar, Jharkhand, India",
  github: "https://github.com/rpsahnni-creator",
  linkedin: "https://www.linkedin.com/in/rp-sahnni",
  facebook: "https://www.facebook.com/rpsahnni",
  instagram: "https://www.instagram.com/rpsahnni",
};

export const roles = [
  "Backend Engineer",
  "Full-Stack Developer",
  "Mobile App Developer",
  "AI Automation Specialist",
];

export const heroCode = `// rpsahnni.dev
const dev = {
  role: "Freelance Full-Stack Developer",
  backend: ["Python", "Go", "Node.js"],
  web: ["React", "Next.js", "TypeScript"],
  mobile: ["Flutter", "React Native"],
  cloud: ["AWS", "GCP", "Docker"],
  ai: ["n8n", "LLMs", "RAG"],
  hireable: true,
}`;

export const marqueeItems = [
  "FULL-STACK DEVELOPMENT",
  "HIGH-PERFORMANCE APIS",
  "AI WORKFLOW AUTOMATION",
  "FLUTTER MOBILE APPS",
  "DEOGHAR TO GLOBAL",
];

export const filters = [
  ["all", "All"],
  ["backend", "Backend"],
  ["web", "Web"],
  ["mobile", "Mobile"],
  ["ai", "AI & Automation"],
];

export const projects = [
  {
    id: "project-card-1",
    n: "01",
    t: "Billing & Invoice API",
    c: "backend",
    cl: "Backend",
    d: "High-concurrency microservice handling secure invoice generation, PDF exports and payment gateway webhooks for multiple tenants.",
    hi: "RBAC · PDF invoices · payment webhooks",
    k: ["Django", "PostgreSQL", "Docker", "AWS"],
    span: "lg:col-span-6",
    featured: true,
    img: IMG.code,
    features: [
      "Multi-tenant architecture with role-based access control",
      "PDF invoice generation with branded templates",
      "Payment gateway webhooks with retry-safe handling",
      "Containerised with Docker and deployed on AWS",
    ],
    outcome: "One API serves every tenant — billing runs end to end without manual work.",
    gh: "https://github.com/rpsahnni-creator",
    live: "",
  },
  {
    id: "project-card-2",
    n: "02",
    t: "Realtime Chat Service",
    c: "backend",
    cl: "Backend",
    d: "Ultra-low latency WebSocket chat server supporting 10k+ concurrent connections with pub/sub architecture and message history.",
    hi: "10k+ concurrent sockets · Redis pub/sub",
    k: ["Golang", "Redis", "PostgreSQL"],
    span: "lg:col-span-3",
    img: IMG.matrix,
    features: [
      "WebSocket server in Go built for high throughput",
      "Redis pub/sub fan-out across multiple nodes",
      "Persistent message history in PostgreSQL",
      "Graceful reconnects and presence tracking",
    ],
    outcome: "10k+ concurrent connections stay live with sub-second message delivery.",
    gh: "https://github.com/rpsahnni-creator",
    live: "",
  },
  {
    id: "project-card-3",
    n: "03",
    t: "Business Dashboard",
    c: "web",
    cl: "Web",
    d: "Analytics & financial management portal featuring real-time telemetry, charts and exportable reports behind secure login.",
    hi: "Live telemetry · exportable reports",
    k: ["React", "TypeScript", "Tailwind CSS"],
    span: "lg:col-span-3",
    img: IMG.binary,
    features: [
      "Real-time charts and KPI telemetry",
      "Secure authentication and session handling",
      "Exportable PDF/CSV reports",
      "Fast loads with TypeScript-safe data layer",
    ],
    outcome: "Owners see the whole business on one screen and export reports in a click.",
    gh: "https://github.com/rpsahnni-creator",
    live: "",
  },
  {
    id: "project-card-4",
    n: "04",
    t: "Delivery Tracking App",
    c: "mobile",
    cl: "Mobile",
    d: "Cross-platform mobile application with live GPS driver movement, push alerts and full order lifecycle management.",
    hi: "Live GPS tracking · push notifications",
    k: ["Flutter", "Firebase", "FastAPI"],
    span: "lg:col-span-2",
    img: IMG.code,
    features: [
      "Single Flutter codebase for Android and iOS",
      "Live driver GPS movement on maps",
      "Push notifications at every order stage",
      "FastAPI backend with Firebase sync",
    ],
    outcome: "Customers watch their delivery move in real time, from pickup to doorstep.",
    gh: "https://github.com/rpsahnni-creator",
    live: "",
  },
  {
    id: "project-card-5",
    n: "05",
    t: "Lead-to-WhatsApp Automation",
    c: "ai",
    cl: "AI & Automation",
    d: "Zero-human workflow routing incoming lead forms through AI qualification directly into WhatsApp conversations within seconds.",
    hi: "AI lead scoring · instant WhatsApp reply",
    k: ["n8n", "OpenAI", "Webhooks"],
    span: "lg:col-span-2",
    img: IMG.matrix,
    features: [
      "n8n workflow triggered by any form or webhook",
      "AI scores and qualifies every new lead",
      "Instant personalised reply on WhatsApp",
      "Retries and logging built into the pipeline",
    ],
    outcome: "Every lead gets an intelligent WhatsApp reply in seconds — even at 2 AM.",
    gh: "https://github.com/rpsahnni-creator",
    live: "",
  },
  {
    id: "project-card-6",
    n: "06",
    t: "Support Chatbot with RAG",
    c: "ai",
    cl: "AI & Automation",
    d: "Context-aware AI knowledge assistant answering from dynamic company documents via retrieval-augmented generation.",
    hi: "Vector search · human handover",
    k: ["FastAPI", "LangChain", "PostgreSQL Vector"],
    span: "lg:col-span-2",
    img: IMG.binary,
    features: [
      "RAG over company documents and FAQs",
      "Vector search stored in PostgreSQL",
      "FastAPI serving layer with LangChain",
      "Hands over to a human when confidence is low",
    ],
    outcome: "Support answers come from your own documents — accurate, instant, always on.",
    gh: "https://github.com/rpsahnni-creator",
    live: "",
  },
];

export const skills = [
  { id: "tech-group-backend", name: "Backend", icon: Server, items: ["Python", "Django", "Django REST", "FastAPI", "Golang", "Node.js", "Express.js", "TypeScript", "GraphQL", "Celery"] },
  { id: "tech-group-databases", name: "Databases", icon: Database, items: ["PostgreSQL", "Oracle", "SQL", "MongoDB", "Redis"] },
  { id: "tech-group-frontend", name: "Frontend", icon: Globe, items: ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "Vite", "Tailwind CSS"] },
  { id: "tech-group-mobile", name: "Mobile", icon: Smartphone, items: ["Flutter", "React Native", "Firebase"] },
  { id: "tech-group-cloud", name: "Cloud & DevOps", icon: Cloud, items: ["AWS", "GCP", "Docker", "Git", "GitHub Actions", "Nginx", "Linux", "Vercel"] },
  { id: "tech-group-ai", name: "AI & Automation", icon: Bot, items: ["n8n", "LLM APIs", "LangChain", "RAG", "Chatbots", "Webhooks"] },
];

export const flow = [
  ["Trigger", "Form, webhook, schedule"],
  ["n8n workflow", "Logic, routing, retries"],
  ["AI model", "GPT, Claude, Gemini"],
  ["Your data", "Postgres, Sheets, CRM"],
  ["Action", "WhatsApp, email, Slack"],
];

export const useCases = [
  ["Lead capture and instant reply", "New enquiries are scored by AI, saved to your CRM and answered on WhatsApp or email within seconds."],
  ["AI chatbots with your own data", "Support bots that answer from your documents and FAQs using RAG, and hand over to a human when needed."],
  ["Document and invoice processing", "Read PDFs, bills and forms, pull out the fields and push them into your database or accounting tool."],
  ["Reports and scheduled jobs", "Daily sales, stock or attendance reports built from your database and sent to the right people on time."],
];

export const services = [
  { id: "service-backend", n: "01", t: "Backend & APIs", d: "Secure, well-documented REST APIs and services in Django, FastAPI, Go or Node.js, backed by PostgreSQL or Oracle." },
  { id: "service-web", n: "02", t: "Websites & Web Apps", d: "Fast, SEO-friendly sites and dashboards in React, Next.js and TypeScript, ready to deploy on Vercel or AWS." },
  { id: "service-mobile", n: "03", t: "Mobile Apps", d: "One codebase for Android and iOS with Flutter or React Native, connected to your backend." },
  { id: "service-devops", n: "04", t: "Cloud & DevOps", d: "Docker, GitHub Actions pipelines and deployment on AWS or GCP, set up to stay inside your budget." },
];

export const testimonials = [
  { text: "Ram took our billing from messy spreadsheets to a fully automated API — invoices, payments, everything. What our team did in hours now happens on its own.", name: "Ankit V.", role: "Founder, Logistics Startup" },
  { text: "The chat backend he built in Go handles our busiest sale days without a hiccup. Clear communication, clean code, delivered before the deadline.", name: "Priya S.", role: "CTO, E-commerce Platform" },
  { text: "Our WhatsApp lead automation replies in seconds, even at midnight. Enquiries stopped slipping through the cracks — that alone paid for the project.", name: "Rohit M.", role: "Owner, Real Estate Agency" },
  { text: "He built our dashboard and the support chatbot both. One person, full stack, zero excuses. We stopped interviewing agencies after working with him.", name: "Sneha K.", role: "Operations Head, EdTech Company" },
];
