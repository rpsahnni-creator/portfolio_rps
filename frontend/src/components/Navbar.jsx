import { useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Lock, Menu, Moon, Sun, X } from "lucide-react";
import Logo from "./Logo";

const links = [
  ["About", "#about", "nav-about-link"],
  ["Projects", "#projects", "nav-projects-link"],
  ["Stack", "#stack", "nav-stack-link"],
  ["AI Workflows", "#ai", "nav-ai-link"],
  ["Services", "#services", "nav-services-link"],
  ["Contact", "#contact", "nav-contact-link"],
];

export default function Navbar({ dark, onToggleTheme }) {
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  const themeBtn = (
    <button
      onClick={onToggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      data-testid="theme-toggle"
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-300 transition-colors duration-200 hover:border-emerald-400/50 hover:text-emerald-300"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  const loginBtn = (
    <a
      href="/admin"
      aria-label="Admin login"
      data-testid="nav-login-link"
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-300 transition-colors duration-200 hover:border-emerald-400/50 hover:text-emerald-300"
    >
      <Lock size={15} />
    </a>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" data-testid="nav-logo" aria-label="rpsahnni.dev home" onClick={() => setOpen(false)}>
          <Logo size={34} />
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-400 md:flex">
          {links.map(([label, href, tid]) => (
            <a key={href} href={href} data-testid={tid} className="transition-colors duration-200 hover:text-emerald-400">
              {label}
            </a>
          ))}
          {themeBtn}
          {loginBtn}
          <a
            href="#contact"
            data-testid="nav-cta-button"
            className="rounded-full bg-emerald-500 px-5 py-2 font-semibold text-onacc transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            Hire me
          </a>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {themeBtn}
          {loginBtn}
          <button
            className="text-slate-200"
            aria-label="Toggle menu"
            data-testid="nav-menu-toggle"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/5 bg-night/95 md:hidden"
          >
            <div className="flex flex-col gap-4 px-5 py-5 text-sm font-medium text-slate-300">
              {links.map(([label, href, tid]) => (
                <a key={href} href={href} data-testid={`${tid}-mobile`} onClick={() => setOpen(false)}>
                  {label}
                </a>
              ))}
              <a href="/admin" data-testid="nav-login-link-mobile" className="inline-flex items-center gap-2 text-slate-400">
                <Lock size={14} /> Admin login
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <motion.div className="absolute bottom-0 left-0 h-px w-full origin-left bg-emerald-400/70" style={{ scaleX }} />
    </header>
  );
}
