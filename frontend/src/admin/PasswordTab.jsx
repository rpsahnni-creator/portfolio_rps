import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { adminApi, btnCls, fmtErr, inputCls } from "./api";

export default function PasswordTab() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (next.length < 8) return toast.error("Naya password kam se kam 8 characters ka ho");
    if (next !== confirm) return toast.error("Naye passwords match nahi ho rahe");
    setBusy(true);
    try {
      await adminApi.post("/auth/change-password", { current_password: cur, new_password: next });
      toast.success("Password badal gaya — ab se naya password use hoga");
      setCur(""); setNext(""); setConfirm("");
    } catch (e2) {
      toast.error(fmtErr(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} data-testid="password-form" className="grid max-w-md gap-3 rounded-2xl border border-white/10 bg-panel p-6">
      <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-slate-50">
        <KeyRound size={18} className="text-emerald-400" /> Change password
      </h3>
      <input type="password" required autoComplete="current-password" placeholder="Current password"
        value={cur} onChange={(e) => setCur(e.target.value)} data-testid="password-current-input" className={inputCls} />
      <input type="password" required autoComplete="new-password" placeholder="New password (min 8 characters)"
        value={next} onChange={(e) => setNext(e.target.value)} data-testid="password-new-input" className={inputCls} />
      <input type="password" required autoComplete="new-password" placeholder="Confirm new password"
        value={confirm} onChange={(e) => setConfirm(e.target.value)} data-testid="password-confirm-input" className={inputCls} />
      <button type="submit" disabled={busy} data-testid="password-save-button" className={btnCls}>
        {busy ? "Saving…" : "Change password"}
      </button>
      <p className="font-mono text-[11px] leading-relaxed text-slate-500">
        Naya password turant active ho jata hai aur restart ke baad bhi wahi rehta hai.
      </p>
    </form>
  );
}
