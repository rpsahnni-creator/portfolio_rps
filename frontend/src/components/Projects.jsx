import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { filters } from "../data";
import { useContent } from "../content";
import { Block, Head } from "./Section";
import ProjectModal from "./ProjectModal";

const ease = [0.22, 1, 0.36, 1];

function CardVisual({ p, tall }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 ${tall ? "h-52 lg:h-full lg:min-h-[260px]" : "h-36"}`}>
      <img
        src={p.img}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,10,15,0.85)] via-transparent to-transparent" aria-hidden="true" />
      <span className="absolute left-3 top-3 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(7,10,15,0.55)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6ee7b7] backdrop-blur">
        {p.cl}
      </span>
      <span className="absolute bottom-1 right-4 font-display text-6xl font-extrabold text-[rgba(255,255,255,0.2)]" aria-hidden="true">
        {p.n}
      </span>
    </div>
  );
}

function CardBody({ p }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl font-bold tracking-tight text-slate-50">{p.t}</h3>
        <ArrowUpRight
          size={20}
          className="mt-1 shrink-0 text-emerald-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
        />
      </div>
      <p className="flex-1 text-sm leading-relaxed text-slate-400">{p.d}</p>
      <p className="font-mono text-xs text-amber-400/90">
        <span className="text-slate-600">&gt; </span>{p.hi}
      </p>
      <div className="flex flex-wrap gap-2">
        {p.k.map((x) => (
          <span
            key={x}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-slate-300 transition-colors duration-200 group-hover:border-emerald-400/30"
          >
            {x}
          </span>
        ))}
      </div>
      <span className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors duration-300 group-hover:text-emerald-400">
        View case study →
      </span>
    </>
  );
}

function ProjectCard({ p, onOpen }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease }}
      whileHover={{ y: -6 }}
      onClick={() => onOpen(p)}
      data-testid={p.id}
      className={`group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-panel p-5 transition-colors duration-300 hover:border-emerald-400/50 sm:p-6 ${p.span}`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/0 blur-3xl transition-colors duration-500 group-hover:bg-emerald-500/15"
        aria-hidden="true"
      />
      {p.featured ? (
        <div className="grid flex-1 items-center gap-6 lg:grid-cols-2">
          <CardVisual p={p} tall />
          <div className="flex h-full flex-col gap-4">
            <CardBody p={p} />
          </div>
        </div>
      ) : (
        <>
          <CardVisual p={p} />
          <CardBody p={p} />
        </>
      )}
    </motion.article>
  );
}

export default function Projects() {
  const [f, setF] = useState("all");
  const [selected, setSelected] = useState(null);
  const { projects } = useContent();
  const list = projects.filter((p) => f === "all" || p.c === f);

  return (
    <Block id="projects">
      <Head
        eyebrow="02 · Selected work"
        title="Projects, end to end."
        text="Everything I have built — from high-throughput backends to AI automations. Click any project for the full case study."
      />
      <div className="mb-10 flex flex-wrap gap-2">
        {filters.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setF(k)}
            data-testid={`project-filter-${k}`}
            className={`rounded-full border px-5 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
              f === k
                ? "border-emerald-400 bg-emerald-500 text-onacc"
                : "border-white/15 text-slate-400 hover:border-emerald-400/50 hover:text-emerald-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <motion.div layout className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <ProjectCard key={p.t} p={p} onOpen={setSelected} />
          ))}
        </AnimatePresence>
      </motion.div>
      <ProjectModal p={selected} onClose={() => setSelected(null)} />
    </Block>
  );
}
