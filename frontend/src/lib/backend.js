// Empty string = same-origin deploy (nginx proxies /api). Falls back to "" when the
// variable is missing at build time instead of producing "undefined/api/...".
export const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
export const API = `${BACKEND_URL}/api`;
export const absUrl = (u) => (u && u.startsWith("/api/") ? `${BACKEND_URL}${u}` : u);
