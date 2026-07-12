"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/env";
export function createClient() { const c = getSupabaseConfig(); if (!c) throw new Error("Supabase is not configured."); return createBrowserClient(c.url, c.publishableKey); }
