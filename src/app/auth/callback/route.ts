import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/urls";

function redirectWithNoStore(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return redirectWithNoStore(new URL(next, requestUrl.origin));
    } catch {}
  }

  const destination = new URL("/auth/sign-in", requestUrl.origin);
  destination.searchParams.set("error", "auth_callback_failed");
  destination.searchParams.set("next", next);
  return redirectWithNoStore(destination);
}
