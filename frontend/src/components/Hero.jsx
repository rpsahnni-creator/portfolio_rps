import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Download } from "lucide-react";
import { heroCode, me, roles } from "../data";
import { useContent } from "../content";

const ease = [0.22, 1, 0.36, 1];

function MaskedLine({ children, delay, className }) {
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span
        className={`block ${className}`}
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 0.9, ease, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function RoleRotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % roles.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block h-[1.4em] overflow-hidden align-bottom" data-testid="hero-role-typewriter">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          className="inline-block text-amber-400"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          {roles[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CodeCard() {
  return (
    <div className="relative">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-amber-400/90" aria-hidden="true" />
      <div className="glow-emerald relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0D131F]">
        <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] px-5 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 font-mono text-xs text-[#64748b]">dev.config.js</span>
        </div>
        <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-7 text-[#cbd5e1]">
          {heroCode.split(/("[^"]*")/g).map((p, j) =>
            p.startsWith('"') ? (
              <span key={j} className="text-emerald-300">{p}</span>
            ) : (
              <span key={j}>{p}</span>
            )
          )}
        </pre>
      </div>
    </div>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const { projects, skills, resumeUrl } = useContent();
  const techCount = new Set(skills.flatMap((s) => s.items)).size;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yCard = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section ref={ref} id="top" className="relative overflow-hidden">
      <div className="dotgrid absolute inset-0" aria-hidden="true" />
      <motion.div
        aria-hidden="true"
        style={{ y: yGlow }}
        className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-36 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-44">
        <div>
          <motion.p
            data-testid="hero-status-badge"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.35 }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/5 px-4 py-1.5 text-xs font-medium tracking-wide text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            Available for freelance projects
          </motion.p>

          <h1
            data-testid="hero-name"
            className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl"
          >
            <MaskedLine delay={1.2}>{me.first}</MaskedLine>
            <MaskedLine delay={1.32} className="text-emerald-400 text-glow">
              {me.last}
              <span className="text-amber-400">.</span>
            </MaskedLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.55 }}
            className="mt-6 font-display text-xl font-bold text-slate-200 sm:text-2xl"
          >
            <RoleRotator />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.7 }}
            className="mt-4 max-w-xl text-base leading-relaxed text-slate-400"
          >
            Freelance developer from Deoghar, Jharkhand. I build fast backends, modern web apps,
            cross-platform mobile apps and AI automations that take repetitive work off your team.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.85 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <motion.a
              href="#projects"
              data-testid="hero-cta-projects"
              whileTap={{ scale: 0.97 }}
              className="rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-bold text-onacc transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 glow-emerald"
            >
              Explore projects
            </motion.a>
            <motion.a
              href="#contact"
              data-testid="hero-cta-contact"
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-bold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-300"
            >
              Hire me
            </motion.a>
            <motion.a
              href={resumeUrl || "/Ram-Pravesh-Sahni-Resume.pdf"}
              download
              data-testid="hero-resume-button"
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-slate-400 transition-colors duration-200 hover:text-emerald-300"
            >
              <Download size={15} /> Résumé
            </motion.a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.05 }}
            className="mt-8 font-mono text-xs tracking-wider text-slate-500"
          >
            <span className="text-emerald-400">{projects.length}</span> flagship projects
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-emerald-400">{techCount}</span> technologies
            <span className="mx-2 text-slate-700">/</span>
            <span className="text-emerald-400">4</span> disciplines
          </motion.p>
        </div>

        <motion.div
          style={{ y: yCard }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 1.6 }}
          className="hidden lg:block"
        >
          <CodeCard />
        </motion.div>
      </div>
    </section>
  );
}
