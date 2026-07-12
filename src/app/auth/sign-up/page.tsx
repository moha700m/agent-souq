import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/forms/auth-forms";
import { Badge } from "@/components/ui/badge";
import { getRuntimeMode } from "@/lib/env";
export const metadata:Metadata={title:"Create account",robots:{index:false,follow:false}};
export default function SignUpPage(){const disabled=getRuntimeMode()!=="supabase";return <><Badge tone="outline" className="mb-5">Join Agent Souq</Badge><h1 className="text-4xl font-bold tracking-[-.045em]">Your next workflow starts here.</h1><p className="mt-3 mb-8 text-muted-foreground">Create a free account to build your personal agent library.</p>{disabled&&<p className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-sm text-amber-800 dark:text-amber-200">Account creation needs a connected Supabase project. Explore the product in preview mode for now.</p>}<SignUpForm disabled={disabled}/><p className="mt-6 text-center text-sm text-muted-foreground">Already a member? <Link href="/auth/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link></p></>}
