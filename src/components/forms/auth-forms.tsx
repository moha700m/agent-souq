"use client";
import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { forgotAction, signInAction, signUpAction, updatePasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import type { ActionState } from "@/lib/errors";

const initial: ActionState = { ok: false };
const signUpInitial: ActionState<{ next: string }> = { ok: false };
function Notice({ state }: { state: { error?: ActionState["error"]; message?: string } }) { if (!state.error && !state.message) return null; return <div role={state.error ? "alert" : "status"} className={`rounded-xl border p-3 text-sm leading-6 ${state.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"}`}>{state.error?.message ?? state.message}</div>; }
function Submit({ children, pending, disabled = false }: { children: React.ReactNode; pending: boolean; disabled?: boolean }) { return <Button size="lg" className="mt-1 w-full" disabled={pending || disabled}>{pending ? "Please wait…" : children}<ArrowRight/></Button>; }

export function SignInForm({ next, disabled = false }: { next?: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState(signInAction, initial); const errors=state.error?.fields;
  return <form action={action} className="grid gap-4">{next&&<input type="hidden" name="next" value={next}/>}<Field label="Email" name="email" error={errors?.email} required><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} disabled={disabled}/></Field><Field label="Password" name="password" error={errors?.password} required><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} className={inputClass} disabled={disabled}/></Field><div className="-mt-1 flex justify-end"><Link href="/auth/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link></div><Notice state={state}/><Submit pending={pending} disabled={disabled}>Sign in</Submit></form>;
}

export function SignUpForm({ disabled = false }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(signUpAction, signUpInitial); const router=useRouter();
  useEffect(()=>{if(state.ok&&state.data?.next)router.push(state.data.next);},[state,router]); const errors=state.error?.fields;
  return <form action={action} className="grid gap-4"><Field label="Full name" name="fullName" error={errors?.fullName} required><input id="fullName" name="fullName" autoComplete="name" required minLength={2} maxLength={80} className={inputClass} disabled={disabled}/></Field><Field label="Email" name="email" error={errors?.email} required><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} disabled={disabled}/></Field><Field label="Password" name="password" error={errors?.password} hint="10+ characters with upper, lower, and a number." required><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={inputClass} disabled={disabled}/></Field><Field label="Confirm password" name="confirmPassword" error={errors?.confirmPassword} required><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={inputClass} disabled={disabled}/></Field><Notice state={state}/><Submit pending={pending} disabled={disabled}>Create account</Submit></form>;
}

export function ForgotForm({ disabled = false }: { disabled?: boolean }) { const [state, action, pending]=useActionState(forgotAction,initial);const errors=state.error?.fields;return <form action={action} className="grid gap-4"><Field label="Email" name="email" error={errors?.email} required><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} disabled={disabled}/></Field><Notice state={state}/><Submit pending={pending} disabled={disabled}><Mail/>Send reset link</Submit></form>; }

export function UpdatePasswordForm({ disabled = false }: { disabled?: boolean }) { const [state, action, pending]=useActionState(updatePasswordAction,initial);useEffect(()=>{if(state.ok)toast.success(state.message);},[state]);const errors=state.error?.fields;return <form action={action} className="grid gap-4"><Field label="New password" name="password" error={errors?.password} hint="10+ characters with upper, lower, and a number." required><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={inputClass} disabled={disabled}/></Field><Field label="Confirm password" name="confirmPassword" error={errors?.confirmPassword} required><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={inputClass} disabled={disabled}/></Field><Notice state={state}/><Submit pending={pending} disabled={disabled}><KeyRound/>Update password</Submit></form>; }
