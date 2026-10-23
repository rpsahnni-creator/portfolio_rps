export default function Logo({ size = 40, withWordmark = true }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" data-testid="logo-mark" aria-hidden="true">
        <rect x="2" y="2" width="60" height="60" rx="14" fill="#0D131F" stroke="#10B981" strokeOpacity="0.45" strokeWidth="2" />
        <text x="30" y="41" textAnchor="middle" fontFamily="Syne, sans-serif" fontWeight="800" fontSize="24" fill="#34D399">RP</text>
        <circle cx="48" cy="45" r="4" fill="#F59E0B" />
      </svg>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-slate-100">
          rpsahnni<span className="text-emerald-400">.dev</span>
        </span>
      )}
    </span>
  );
}
