import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Github, X } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

export default function ProjectModal({ p, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {p && (
        <motion.div
          className="fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="project-modal"
        >
          <motion.div
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-panel p-6 sm:p-8"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={p.t}
          >
            <button
              onClick={onClose}
              aria-label="Close case study"
              data-testid="project-modal-close-button"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(7,10,15,0.55)] text-white backdrop-blur transition-colors hover:border-emerald-400/60 hover:text-emerald-300"
            >
              <X size={16} />
            </button>

            <div className="relative mb-6 h-44 overflow-hidden rounded-xl border border-white/10">
              <img src={p.img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,10,15,0.85)] via-transparent to-transparent" aria-hidden="true" />
              <span className="absolute bottom-2 right-4 font-display text-6xl font-extrabold text-[rgba(255,255,255,0.2)]" aria-hidden="true">
                {p.n}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-sm tracking-[0.25em] text-slate-600">{p.n}</span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">{p.cl}</span>
            </div>
            <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-50">{p.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.d}</p>

            <ul className="mt-6 grid gap-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>

            <p className="mt-6 font-mono text-xs leading-relaxed text-amber-400/90">
              <span className="text-slate-600">&gt; </span>{p.outcome}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {p.k.map((x) => (
                <span key={x} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-slate-300">
                  {x}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {p.gh && (
                <a
                  href={p.gh}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="project-modal-github-link"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-slate-100 transition-all hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-300"
                >
                  <Github size={14} /> GitHub <ArrowUpRight size={13} />
                </a>
              )}
              {p.live && (
                <a
                  href={p.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="project-modal-live-link"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-xs font-bold text-slate-100 transition-all hover:-translate-y-0.5 hover:border-emerald-400/60 hover:text-emerald-300"
                >
                  Live demo <ArrowUpRight size={13} />
                </a>
              )}
              <a
                href="#contact"
                onClick={onClose}
                data-testid="project-modal-contact-cta"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold text-onacc transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Start a similar project <ArrowUpRight size={13} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
