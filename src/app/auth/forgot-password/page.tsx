import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotForm } from "@/components/forms/auth-forms";
import { getRuntimeMode } from "@/lib/env";
export const metadata:Metadata={title:"Reset password",robots:{index:false,follow:false}};
export default function ForgotPasswordPage(){return <><Link href="/auth/sign-in" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft/>Back to sign in</Link><h1 className="text-4xl font-bold tracking-[-.045em]">Reset your password.</h1><p className="mt-3 mb-8 text-muted-foreground">Enter your email and we’ll send a secure recovery link if an account exists.</p><ForgotForm disabled={getRuntimeMode()!=="supabase"}/></>}
