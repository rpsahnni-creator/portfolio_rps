import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { flow, useCases } from "../data";
import { Block, Head, Reveal } from "./Section";

export default function AiWorkflows() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((n) => (n + 1) % flow.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <Block id="ai" className="max-w-none bg-panel/40">
      <div className="mx-auto max-w-6xl">
        <Head
          eyebrow="04 · AI & automation"
          title="Workflows that run while you sleep."
          text="I connect your apps, data and AI models into n8n pipelines that run on their own, 24 hours a day."
        />

        <Reveal data-testid="ai-workflow-container" className="mb-16">
          <div className="flex flex-wrap items-stretch gap-2">
            {flow.map(([t, s], j) => (
              <div key={t} className="flex items-center gap-2">
                <button
                  onClick={() => setActive(j)}
                  data-testid={j === 0 ? "ai-workflow-trigger-btn" : `ai-workflow-step-${j + 1}`}
                  className={`rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                    active === j
                      ? "glow-emerald border-emerald-400 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25"
                  }`}
                >
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    step {j + 1}
                  </span>
                  <span className="block font-display text-sm font-bold">{t}</span>
                  <span className={`block text-xs ${active === j ? "text-emerald-200/70" : "text-slate-500"}`}>{s}</span>
                </button>
                {j < flow.length - 1 && <ChevronRight size={18} className="shrink-0 text-amber-400" />}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          {useCases.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08} data-testid={`ai-usecase-${i + 1}`}>
              <div className="h-full border-l-2 border-amber-400/80 py-1 pl-5 transition-colors duration-300 hover:border-emerald-400">
                <h3 className="mb-1.5 font-display text-lg font-bold text-slate-100">{t}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Block>
  );
}
