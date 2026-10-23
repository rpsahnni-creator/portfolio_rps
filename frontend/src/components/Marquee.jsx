import { marqueeItems } from "../data";

export default function Marquee() {
  const row = [...marqueeItems, ...marqueeItems];
  return (
    <div className="overflow-hidden border-y border-white/5 bg-panel/60 py-5" data-testid="ticker-marquee" aria-hidden="true">
      <div className="flex w-max animate-marquee items-center gap-10 hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-slate-400">{item}</span>
            <span className="font-mono text-sm text-amber-400">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}
