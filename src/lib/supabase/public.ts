import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getRuntimeMode, getSupabaseConfig } from "@/lib/env";
import { AppError } from "@/lib/errors";

function makePublicClient(url: string, publishableKey: string) {
  return createSupabaseClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

let publicClient: ReturnType<typeof makePublicClient> | null = null;

/**
 * An anonymous, cookie-free client for cacheable storefront reads.
 * It can never inherit a creator session and therefore cannot trigger the owner
 * branch of an RLS policy or leak a draft into a shared response cache.
 */
export function createPublicClient() {
  if (publicClient) return publicClient;
  const config = getSupabaseConfig();
  if (!config) {
    throw new AppError(
      getRuntimeMode() === "demo" ? "READ_ONLY_DEMO" : "CONFIGURATION_ERROR",
      getRuntimeMode() === "demo"
        ? "Marketplace persistence is disabled in demo mode."
        : "Supabase is not configured.",
      503,
    );
  }
  publicClient = makePublicClient(config.url, config.publishableKey);
  return publicClient;
}
