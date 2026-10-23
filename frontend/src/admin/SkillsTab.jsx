import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { adminApi, btnCls, fmtErr, inputCls } from "./api";

const empty = { name: "", items: "", order: 0 };

export default function SkillsTab() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const load = () => adminApi.get("/admin/skills").then((r) => setList(r.data)).catch((e) => toast.error(fmtErr(e)));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, items: form.items.split(",").map((x) => x.trim()).filter(Boolean), order: Number(form.order) || 0 };
    try {
      if (editId) await adminApi.put(`/admin/skills/${editId}`, payload);
      else await adminApi.post("/admin/skills", payload);
      toast.success("Saved");
      setForm(null); setEditId(null); load();
    } catch (e2) { toast.error(fmtErr(e2)); }
  }

  async function remove(id) {
    if (!window.confirm("Delete this skill group?")) return;
    await adminApi.delete(`/admin/skills/${id}`);
    load();
  }

  if (form) {
    return (
      <form onSubmit={save} data-testid="skill-form" className="grid gap-3 rounded-2xl border border-white/10 bg-panel p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-50">{editId ? "Edit skill group" : "Add skill group"}</h3>
          <button type="button" onClick={() => { setForm(null); setEditId(null); }} aria-label="Cancel" className="text-slate-500 hover:text-emerald-300"><X size={18} /></button>
        </div>
        <input required placeholder="Group name (e.g. Backend)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="skill-form-name" className={inputCls} />
        <input placeholder="Items, comma separated (Python, Django…)" value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} data-testid="skill-form-items" className={inputCls} />
        <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={inputCls} />
        <button type="submit" data-testid="skill-form-save" className={btnCls}>{editId ? "Save changes" : "Add group"}</button>
      </form>
    );
  }

  return (
    <div data-testid="skills-tab">
      <button onClick={() => { setEditId(null); setForm({ ...empty, order: list.length }); }} data-testid="skill-add-button"
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold text-onacc hover:bg-emerald-400">
        <Plus size={14} /> Add skill group
      </button>
      <div className="grid gap-3">
        {list.map((s) => (
          <div key={s.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-panel p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100">{s.name}</p>
              <p className="truncate font-mono text-[11px] text-slate-500">{(s.items || []).join(", ")}</p>
            </div>
            <button onClick={() => { setEditId(s.id); setForm({ ...s, items: (s.items || []).join(", ") }); }} aria-label="Edit" className="text-slate-400 hover:text-emerald-300"><Pencil size={16} /></button>
            <button onClick={() => remove(s.id)} aria-label="Delete" className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
