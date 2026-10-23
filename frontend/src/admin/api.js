import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const adminApi = axios.create({ baseURL: API, withCredentials: true });

adminApi.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("admin_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const absUrl = (u) => (u && u.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${u}` : u);

export const fmtErr = (e) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || "").filter(Boolean).join(" ");
  return "Something went wrong";
};

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-400";

export const btnCls =
  "rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-onacc transition-all hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-60";
