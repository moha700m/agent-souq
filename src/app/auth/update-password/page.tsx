import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/forms/auth-forms";
import { getRuntimeMode } from "@/lib/env";
export const metadata:Metadata={title:"Choose a new password",robots:{index:false,follow:false}};
export default function UpdatePasswordPage(){return <><h1 className="text-4xl font-bold tracking-[-.045em]">Choose a new password.</h1><p className="mt-3 mb-8 text-muted-foreground">Use a strong, unique password you do not use elsewhere.</p><UpdatePasswordForm disabled={getRuntimeMode()!=="supabase"}/></>}
