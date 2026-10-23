import { useState } from "react";
import { toast } from "sonner";
import { FileText, Upload } from "lucide-react";
import { API, adminApi, fmtErr } from "./api";

export default function ResumeTab() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Sirf PDF file upload karein");
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await adminApi.post("/admin/resume", fd);
      setDone(true);
      toast.success("Resume uploaded — site ke Résumé buttons ab ye file denge");
    } catch (e2) { toast.error(fmtErr(e2)); }
    finally { setBusy(false); }
  }

  return (
    <div data-testid="resume-tab" className="max-w-lg rounded-2xl border border-white/10 bg-panel p-6">
      <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-slate-50">
        <FileText size={18} className="text-emerald-400" /> Resume PDF
      </h3>
      <p className="mb-5 text-sm text-slate-400">
        Naya resume PDF upload karein — Hero aur About ke Résumé buttons turant yahi file download karayenge.
      </p>
      <input type="file" accept="application/pdf" onChange={upload} disabled={busy} data-testid="resume-upload-input"
        className="text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-onacc" />
      {done && (
        <a href={`${API}/resume`} target="_blank" rel="noopener noreferrer" data-testid="resume-view-link"
          className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-emerald-300 hover:underline">
          <Upload size={13} /> View uploaded resume
        </a>
      )}
    </div>
  );
}
