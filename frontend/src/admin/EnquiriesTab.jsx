import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Send, X } from "lucide-react";
import { adminApi, fmtErr, inputCls } from "./api";

export default function EnquiriesTab() {
  const [list, setList] = useState(null);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => adminApi.get("/admin/enquiries").then((r) => setList(r.data)).catch((e) => { toast.error(fmtErr(e)); setList([]); });
  useEffect(() => { load(); }, []);

  async function sendReply(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.post(`/admin/enquiries/${replyFor}/reply`, { message: replyText });
      toast.success("Reply bhej diya gaya");
      setReplyFor(null);
      setReplyText("");
      load();
    } catch (e2) { toast.error(fmtErr(e2)); }
    finally { setBusy(false); }
  }

  if (list === null) return <p className="font-mono text-xs text-slate-500">loading…</p>;
  if (list.length === 0) return <p className="font-mono text-xs text-slate-500" data-testid="enquiries-empty">Abhi tak koi enquiry nahi aayi.</p>;

  return (
    <div className="grid gap-3" data-testid="enquiries-tab">
      {list.map((q) => (
        <div key={q.id} className="rounded-xl border border-white/10 bg-panel p-5" data-testid={`enquiry-${q.id.slice(0, 6)}`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-100">
              {q.name} <span className="ml-2 font-mono text-[11px] font-normal text-emerald-400">{q.email}</span>
              {q.replied_at && <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">REPLIED</span>}
            </p>
            <div className="flex items-center gap-3">
              <p className="font-mono text-[11px] text-slate-500">{new Date(q.created_at).toLocaleString()}</p>
              <button onClick={() => { setReplyFor(replyFor === q.id ? null : q.id); setReplyText(""); }}
                data-testid={`enquiry-reply-${q.id.slice(0, 6)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] text-slate-300 transition-colors hover:border-emerald-400/50 hover:text-emerald-300">
                {replyFor === q.id ? <X size={12} /> : <Mail size={12} />} {replyFor === q.id ? "Close" : "Reply"}
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{q.message}</p>
          {replyFor === q.id && (
            <form onSubmit={sendReply} className="mt-4 grid gap-2.5 border-t border-white/5 pt-4" data-testid="enquiry-reply-form">
              <textarea required rows={4} placeholder={`Reply to ${q.name}… (email unke inbox me jayega)`}
                value={replyText} onChange={(e) => setReplyText(e.target.value)}
                data-testid="enquiry-reply-text" className={inputCls} />
              <button type="submit" disabled={busy} data-testid="enquiry-reply-send"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-onacc transition-all hover:bg-emerald-400 disabled:opacity-60">
                <Send size={13} /> {busy ? "Sending…" : "Send reply"}
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
