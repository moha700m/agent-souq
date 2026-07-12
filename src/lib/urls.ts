const controls = /[\u0000-\u001F\u007F]/;
export function safeRedirectPath(v: unknown, fallback = "/dashboard") { if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//") || v.includes("\\") || controls.test(v)) return fallback; try { const u = new URL(v, "https://agent-souq.local"); return u.origin === "https://agent-souq.local" ? `${u.pathname}${u.search}${u.hash}` : fallback; } catch { return fallback; } }
export function slugify(v: string) { return v.normalize("NFKD").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
