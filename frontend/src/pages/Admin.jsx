import { useEffect, useState } from "react";
import { BarChart3, Database, FileText, Inbox, KeyRound, LayoutGrid, LogOut, MessageSquareQuote } from "lucide-react";
import Logo from "../components/Logo";
import { adminApi, btnCls, fmtErr, inputCls } from "../admin/api";
import ProjectsTab from "../admin/ProjectsTab";
import SkillsTab from "../admin/SkillsTab";
import TestimonialsTab from "../admin/TestimonialsTab";
import ResumeTab from "../admin/ResumeTab";
import EnquiriesTab from "../admin/EnquiriesTab";
import PasswordTab from "../admin/PasswordTab";
import AnalyticsTab from "../admin/AnalyticsTab";

const TABS = [
  ["analytics", "Analytics", BarChart3],
  ["projects", "Projects", LayoutGrid],
  ["skills", "Tech Stack", Database],
  ["testimonials", "Testimonials", MessageSquareQuote],
  ["resume", "Resume", FileText],
  ["enquiries", "Enquiries", Inbox],
  ["password", "Password", KeyRound],
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("analytics");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false));
  }, []);

  async function login(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { data } = await adminApi.post("/auth/login", { email, password });
      localStorage.setItem("admin_token", data.token);
      setUser(data.user);
    } catch (e2) {
      setErr(fmtErr(e2));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try { await adminApi.post("/auth/logout"); } catch {}
    localStorage.removeItem("admin_token");
    setUser(false);
  }

  if (user === null) {
    return <div className="grid min-h-screen place-items-center bg-night font-mono text-xs text-slate-500">loading…</div>;
  }

  if (user === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-night px-5">
        <form onSubmit={login} data-testid="admin-login-form" className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-8">
          <div className="mb-8 flex justify-center"><Logo size={40} /></div>
          <h1 className="mb-6 text-center font-display text-xl font-bold text-slate-50">Admin login</h1>
          <div className="grid gap-3">
            <input type="email" required autoComplete="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} data-testid="admin-email-input" className={inputCls} />
            <input type="password" required autoComplete="current-password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} data-testid="admin-password-input" className={inputCls} />
            {err && <p className="text-sm text-red-400" data-testid="admin-login-error">{err}</p>}
            <button type="submit" disabled={busy} data-testid="admin-login-button" className={btnCls}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
          <a href="/" className="mt-5 block text-center font-mono text-xs text-slate-500 hover:text-emerald-300">← back to site</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night font-body text-slate-300">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/"><Logo size={32} /></a>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-slate-500 sm:block">{user.email}</span>
            <button onClick={logout} data-testid="admin-logout-button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-emerald-400/50 hover:text-emerald-300">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <nav className="mb-8 flex flex-wrap gap-2">
          {TABS.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} data-testid={`admin-tab-${key}`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                tab === key ? "border-emerald-400 bg-emerald-400 text-onacc" : "border-white/15 text-slate-400 hover:border-emerald-400/50 hover:text-emerald-300"
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "projects" && <ProjectsTab />}
        {tab === "skills" && <SkillsTab />}
        {tab === "testimonials" && <TestimonialsTab />}
        {tab === "resume" && <ResumeTab />}
        {tab === "enquiries" && <EnquiriesTab />}
        {tab === "password" && <PasswordTab />}
      </div>
    </div>
  );
}
