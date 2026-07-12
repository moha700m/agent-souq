import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";
import { getRuntimeMode, getSupabaseConfig } from "@/lib/env";
export async function createClient() { const c = getSupabaseConfig(); if (!c) throw new AppError(getRuntimeMode() === "demo" ? "READ_ONLY_DEMO" : "CONFIGURATION_ERROR", getRuntimeMode() === "demo" ? "This action is unavailable in read-only demo mode." : "Supabase is not configured.", 503); const store = await cookies(); return createServerClient(c.url, c.publishableKey, { cookies: { getAll: () => store.getAll(), setAll: values => { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} } } }); }
