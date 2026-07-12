import type { User } from "@supabase/supabase-js";
import { getRuntimeMode } from "@/lib/env";
import { AppError, assertDb } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  user?: User;
}

export async function optionalUser(): Promise<CurrentUser | null> {
  if (getRuntimeMode() !== "supabase") return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  if (getRuntimeMode() === "demo") {
    throw new AppError(
      "READ_ONLY_DEMO",
      "Accounts and saved data are disabled in read-only demo mode.",
      503,
    );
  }
  const user = await optionalUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  return user;
}

export async function ensureProfile(user: CurrentUser): Promise<void> {
  const supabase = await createClient();
  const existing = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  assertDb(existing.error, "Profile could not be loaded.");
  if (existing.data) return;

  const base =
    (user.email?.split("@")[0] ?? "member")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .slice(0, 20) || "member";
  const username = `${base}_${user.id.replaceAll("-", "").slice(0, 7)}`.slice(0, 30);
  const recovered = await supabase.from("profiles").insert({
    id: user.id,
    username,
    full_name: "Agent Souq member",
  });
  assertDb(recovered.error, "Profile could not be created.");
}

export async function requireCreator(): Promise<CurrentUser> {
  const user = await requireUser();
  await ensureProfile(user);
  const supabase = await createClient();
  const result = await supabase.rpc("get_my_profile");
  assertDb(result.error, "Creator profile could not be loaded.");
  const profile = Array.isArray(result.data) ? result.data[0] : result.data;
  if (
    !profile ||
    !["creator", "admin"].includes(String(profile.role)) ||
    profile.onboarding_completed !== true
  ) {
    throw new AppError(
      "FORBIDDEN",
      "Complete onboarding and activate creator access first.",
      403,
    );
  }
  return user;
}
