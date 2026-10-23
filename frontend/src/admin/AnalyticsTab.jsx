import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Eye, Inbox, Users } from "lucide-react";
import { adminApi, fmtErr } from "./api";

export default function AnalyticsTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/analytics").then((r) => setData(r.data)).catch((e) => { toast.error(fmtErr(e)); setData({ days: [], topReferrers: [] }); });
  }, []);

  if (!data) return <p className="font-mono text-xs text-slate-500">loading…</p>;

  const maxViews = Math.max(1, ...data.days.map((d) => d.views));
  const cards = [
    ["Total page views", data.totalViews, Eye, "stat-total-views"],
    ["Unique visitors", data.uniqueSessions, Users, "stat-unique-visitors"],
    ["Total enquiries", data.totalEnquiries, Inbox, "stat-total-enquiries"],
  ];

  return (
    <div data-testid="analytics-tab" className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, val, Icon, tid]) => (
          <div key={tid} data-testid={tid} className="rounded-2xl border border-white/10 bg-panel p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">
              <Icon size={14} className="text-emerald-400" /> {label}
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold text-slate-50">{val ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <p className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">
          <BarChart3 size={14} className="text-emerald-400" /> Last 7 days
        </p>
        <div className="flex h-36 items-end gap-3" data-testid="analytics-chart">
          {data.days.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-[10px] text-slate-500">{d.views}</span>
              <div className="w-full rounded-t-md bg-emerald-500/80 transition-all" style={{ height: `${Math.max(4, (d.views / maxViews) * 100)}%` }} />
              <span className="font-mono text-[10px] text-slate-600">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">Top referrers</p>
        {data.topReferrers.length === 0 && <p className="font-mono text-xs text-slate-600">Abhi koi data nahi.</p>}
        <div className="grid gap-2">
          {data.topReferrers.map((r) => (
            <div key={r.source} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
              <span className="text-slate-300">{r.source}</span>
              <span className="font-mono text-xs text-emerald-400">{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
