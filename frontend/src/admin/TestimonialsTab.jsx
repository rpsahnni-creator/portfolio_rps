import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { adminApi, btnCls, fmtErr, inputCls } from "./api";

const empty = { text: "", name: "", role: "", order: 0 };

export default function TestimonialsTab() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const load = () => adminApi.get("/admin/testimonials").then((r) => setList(r.data)).catch((e) => toast.error(fmtErr(e)));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, order: Number(form.order) || 0 };
    try {
      if (editId) await adminApi.put(`/admin/testimonials/${editId}`, payload);
      else await adminApi.post("/admin/testimonials", payload);
      toast.success("Saved");
      setForm(null); setEditId(null); load();
    } catch (e2) { toast.error(fmtErr(e2)); }
  }

  async function remove(id) {
    if (!window.confirm("Delete this testimonial?")) return;
    await adminApi.delete(`/admin/testimonials/${id}`);
    load();
  }

  if (form) {
    return (
      <form onSubmit={save} data-testid="testimonial-form" className="grid gap-3 rounded-2xl border border-white/10 bg-panel p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-50">{editId ? "Edit testimonial" : "Add testimonial"}</h3>
          <button type="button" onClick={() => { setForm(null); setEditId(null); }} aria-label="Cancel" className="text-slate-500 hover:text-emerald-300"><X size={18} /></button>
        </div>
        <textarea required rows={3} placeholder="Client quote" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} data-testid="testimonial-form-text" className={inputCls} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Client name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="testimonial-form-name" className={inputCls} />
          <input placeholder="Role (e.g. Founder, Startup)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} />
        </div>
        <button type="submit" data-testid="testimonial-form-save" className={btnCls}>{editId ? "Save changes" : "Add testimonial"}</button>
      </form>
    );
  }

  return (
    <div data-testid="testimonials-tab">
      <button onClick={() => { setEditId(null); setForm({ ...empty, order: list.length }); }} data-testid="testimonial-add-button"
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold text-onacc hover:bg-emerald-400">
        <Plus size={14} /> Add testimonial
      </button>
      <div className="grid gap-3">
        {list.map((t) => (
          <div key={t.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-panel p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-200">"{t.text}"</p>
              <p className="font-mono text-[11px] text-slate-500">{t.name} · {t.role}</p>
            </div>
            <button onClick={() => { setEditId(t.id); setForm({ ...t }); }} aria-label="Edit" className="text-slate-400 hover:text-emerald-300"><Pencil size={16} /></button>
            <button onClick={() => remove(t.id)} aria-label="Delete" className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
