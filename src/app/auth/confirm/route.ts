import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/urls";

const otpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

function redirectWithNoStore(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const candidateType = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const fallback = candidateType === "recovery" ? "/auth/update-password" : "/onboarding";
  const next = safeRedirectPath(requestUrl.searchParams.get("next"), fallback);

  if (tokenHash && candidateType && otpTypes.has(candidateType)) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type: candidateType, token_hash: tokenHash });
      if (!error) return redirectWithNoStore(new URL(next, requestUrl.origin));
    } catch {}
  }

  const destination = new URL("/auth/sign-in", requestUrl.origin);
  destination.searchParams.set("error", "confirmation_link_invalid");
  destination.searchParams.set("next", next);
  return redirectWithNoStore(destination);
}
