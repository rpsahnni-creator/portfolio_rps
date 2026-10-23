import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { absUrl, adminApi, btnCls, fmtErr, inputCls } from "./api";

const empty = { title: "", cat: "backend", desc: "", hi: "", tech: "", features: "", outcome: "", gh: "", live: "", img: "", featured: false, order: 0 };
const CATS = [["backend", "Backend"], ["web", "Web"], ["mobile", "Mobile"], ["ai", "AI & Automation"]];

export default function ProjectsTab() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);

  const load = () => adminApi.get("/admin/projects").then((r) => setList(r.data)).catch((e) => toast.error(fmtErr(e)));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  async function uploadImg(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await adminApi.post("/admin/files", fd);
      setForm((f) => ({ ...f, img: data.url }));
      toast.success("Image uploaded");
    } catch (e2) { toast.error(fmtErr(e2)); }
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      tech: form.tech.split(",").map((x) => x.trim()).filter(Boolean),
      features: form.features.split("\n").map((x) => x.trim()).filter(Boolean),
      order: Number(form.order) || 0,
    };
    try {
      if (editId) await adminApi.put(`/admin/projects/${editId}`, payload);
      else await adminApi.post("/admin/projects", payload);
      toast.success(editId ? "Project updated" : "Project added");
      setForm(null); setEditId(null); load();
    } catch (e2) { toast.error(fmtErr(e2)); }
  }

  async function remove(id) {
    if (!window.confirm("Delete this project?")) return;
    await adminApi.delete(`/admin/projects/${id}`);
    toast.success("Project deleted");
    load();
  }

  function startEdit(p) {
    setEditId(p.id);
    setForm({ ...p, tech: (p.tech || []).join(", "), features: (p.features || []).join("\n") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (form) {
    return (
      <form onSubmit={save} data-testid="project-form" className="grid gap-3 rounded-2xl border border-white/10 bg-panel p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-50">{editId ? "Edit project" : "Add project"}</h3>
          <button type="button" onClick={() => { setForm(null); setEditId(null); }} aria-label="Cancel" className="text-slate-500 hover:text-emerald-300"><X size={18} /></button>
        </div>
        <input required placeholder="Project title" value={form.title} onChange={set("title")} data-testid="project-form-title" className={inputCls} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={form.cat} onChange={set("cat")} data-testid="project-form-cat" className={inputCls}>
            {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="number" placeholder="Order (0,1,2…)" value={form.order} onChange={set("order")} className={inputCls} />
        </div>
        <textarea required rows={3} placeholder="Short description" value={form.desc} onChange={set("desc")} data-testid="project-form-desc" className={inputCls} />
        <input placeholder="Highlight (e.g. RBAC · PDF invoices)" value={form.hi} onChange={set("hi")} className={inputCls} />
        <input placeholder="Tech stack, comma separated (Django, PostgreSQL)" value={form.tech} onChange={set("tech")} data-testid="project-form-tech" className={inputCls} />
        <textarea rows={3} placeholder={"Features — one per line"} value={form.features} onChange={set("features")} className={inputCls} />
        <input placeholder="Outcome line" value={form.outcome} onChange={set("outcome")} className={inputCls} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="GitHub link" value={form.gh} onChange={set("gh")} data-testid="project-form-gh" className={inputCls} />
          <input placeholder="Live demo link (optional)" value={form.live} onChange={set("live")} className={inputCls} />
        </div>
        <div className="grid gap-2">
          <input placeholder="Image URL (or upload below)" value={form.img} onChange={set("img")} data-testid="project-form-img" className={inputCls} />
          <input type="file" accept="image/*" onChange={uploadImg} data-testid="project-form-img-upload"
            className="text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-onacc" />
          {form.img && <img src={absUrl(form.img)} alt="preview" className="h-28 w-48 rounded-lg border border-white/10 object-cover" />}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} data-testid="project-form-featured" />
          Featured (full-width spotlight card)
        </label>
        <button type="submit" data-testid="project-form-save" className={btnCls}>{editId ? "Save changes" : "Add project"}</button>
      </form>
    );
  }

  return (
    <div data-testid="projects-tab">
      <button onClick={() => { setEditId(null); setForm({ ...empty, order: list.length }); }} data-testid="project-add-button"
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-bold text-onacc hover:bg-emerald-400">
        <Plus size={14} /> Add project
      </button>
      <div className="grid gap-3">
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-panel p-4" data-testid={`admin-project-${p.id.slice(0, 6)}`}>
            {p.img && <img src={absUrl(p.img)} alt="" className="h-12 w-16 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-100">{p.title} {p.featured && <span className="ml-1 font-mono text-[10px] text-amber-400">FEATURED</span>}</p>
              <p className="font-mono text-[11px] text-slate-500">{p.cat} · {(p.tech || []).join(", ")}</p>
            </div>
            <button onClick={() => startEdit(p)} aria-label="Edit" data-testid={`admin-project-edit-${p.id.slice(0, 6)}`} className="text-slate-400 hover:text-emerald-300"><Pencil size={16} /></button>
            <button onClick={() => remove(p.id)} aria-label="Delete" data-testid={`admin-project-delete-${p.id.slice(0, 6)}`} className="text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
