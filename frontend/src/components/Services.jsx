import { ArrowRight } from "lucide-react";
import { services } from "../data";
import { Block, Head, Reveal } from "./Section";

export default function Services() {
  return (
    <Block id="services">
      <Head
        eyebrow="05 · Services"
        title="How I can help."
        text="Pick one service or hire me for the full build — idea to production."
      />
      <div className="divide-y divide-white/5 border-y border-white/5">
        {services.map(({ id, n, t, d }, i) => (
          <Reveal key={id} delay={i * 0.05}>
            <a
              href="#contact"
              data-testid={id}
              className="group grid items-center gap-3 py-7 transition-colors duration-300 md:grid-cols-[72px_1fr_auto]"
            >
              <span className="font-mono text-sm text-amber-400/80">{n}</span>
              <span>
                <h3 className="font-display text-xl font-bold text-slate-100 transition-colors duration-300 group-hover:text-emerald-300 sm:text-2xl">
                  {t}
                </h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{d}</p>
              </span>
              <span className="hidden h-11 w-11 place-items-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 group-hover:border-emerald-400 group-hover:bg-emerald-400 group-hover:text-onacc md:grid">
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </Block>
  );
}
