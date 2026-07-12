import { z } from "zod";
const schema = z.object({ url: z.string().url().optional(), key: z.string().min(20).optional(), site: z.string().url().optional(), demo: z.enum(["true", "false"]).optional() });
function values() { const r = schema.safeParse({ url: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined, site: process.env.NEXT_PUBLIC_SITE_URL || undefined, demo: process.env.NEXT_PUBLIC_DEMO_MODE || undefined }); return r.success ? r.data : {}; }
export type RuntimeMode = "demo" | "supabase" | "misconfigured";
export function getRuntimeMode(): RuntimeMode {
  const v = values(); if (v.demo === "true") return "demo";
  let validUrl = false; if (v.url) { const u = new URL(v.url); validUrl = u.protocol === "https:" || (process.env.NODE_ENV !== "production" && u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname)); }
  if (validUrl && v.key) return "supabase";
  if (v.demo === "false" || v.url || v.key || process.env.NODE_ENV === "production") return "misconfigured";
  return "demo";
}
export function getSupabaseConfig() { const v = values(); return getRuntimeMode() === "supabase" ? { url: v.url!, publishableKey: v.key! } : null; }
export function getSiteUrl() { return values().site ?? "http://localhost:3000"; }
