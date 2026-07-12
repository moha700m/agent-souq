import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/forms/auth-forms";
import { Badge } from "@/components/ui/badge";
import { getRuntimeMode } from "@/lib/env";
import { safeRedirectPath } from "@/lib/urls";

export const metadata:Metadata={title:"Sign in",robots:{index:false,follow:false}};
const messages:Record<string,string>={auth_callback_failed:"The sign-in link could not be completed. Try signing in again.",confirmation_link_invalid:"This confirmation link is invalid or expired. Start sign-up again or sign in."};
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;

export default async function SignInPage({searchParams}:{searchParams:Promise<{next?:string|string[];error?:string|string[]}>}) {
  const query=await searchParams; const next=safeRedirectPath(first(query.next)); const message=messages[first(query.error)??""]; const disabled=getRuntimeMode()!=="supabase";
  return <><Badge tone="outline" className="mb-5">Welcome back</Badge><h1 className="text-4xl font-bold tracking-[-.045em]">Sign in to your souq.</h1><p className="mt-3 mb-8 text-muted-foreground">Save agents, manage your library, and publish your own workflows.</p>{message&&<p role="alert" className="mb-5 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm leading-6 text-destructive">{message}</p>}{disabled&&<p className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-sm text-amber-800 dark:text-amber-200">Authentication is available after connecting Supabase. This preview remains read-only.</p>}<SignInForm next={next} disabled={disabled}/><p className="mt-6 text-center text-sm text-muted-foreground">New here? <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">Create an account</Link></p></>;
}
