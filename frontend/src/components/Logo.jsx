import { useId } from "react";

// Brand mark: geometric "RP" monogram on an emerald gradient tile, with the amber
// dot standing in for ".dev". Drawn with paths (not <text>) so it looks identical
// before web fonts load and at every size, down to the favicon.
export function LogoMark({ size = 40, className = "" }) {
  // Several logos render on one page — each needs its own gradient id.
  const gid = `rpg-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      data-testid="logo-mark"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${gid})`} />
      <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="16.25" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
      <g transform="translate(32 32) scale(0.92) translate(-32 -32)">
        <g fill="none" stroke="#04120d" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 46V18h7.5a7 7 0 0 1 0 14H13" />
          <path d="M20 32l7.5 14" />
          <path d="M34 46V18h7.5a7 7 0 0 1 0 14H34" />
        </g>
        <circle cx="51" cy="44.5" r="4" fill="#fbbf24" />
      </g>
    </svg>
  );
}

// onDark: fixed yellow wordmark for the deep green footer, the same in both themes.
export default function Logo({ size = 40, withWordmark = true, onDark = false }) {
  return (
    <span className="group/logo inline-flex items-center gap-2.5">
      <LogoMark size={size} className="transition-transform duration-300 group-hover/logo:-rotate-6" />
      {withWordmark && (
        <span
          className={`font-display text-lg font-bold tracking-tight ${onDark ? "text-[#facc15]" : "text-slate-50"}`}
        >
          rpsahnni<span className={onDark ? "text-[#fde68a]" : "text-emerald-400"}>.dev</span>
        </span>
      )}
    </span>
  );
}
