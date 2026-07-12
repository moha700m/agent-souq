import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile } from "@/lib/data/dashboard";
import { getRuntimeMode } from "@/lib/env";
import { optionalUser } from "@/lib/auth";
export const metadata:Metadata={title:"Set up your profile",robots:{index:false,follow:false}};
export default async function OnboardingPage(){const mode=getRuntimeMode();const user=await optionalUser();if(mode==="supabase"&&!user)redirect("/auth/sign-in?next=/onboarding");const profile=await getCurrentProfile();if(mode==="supabase"&&profile.onboardingCompleted)redirect("/dashboard");return <div className="container-shell py-12 sm:py-20"><div className="mx-auto max-w-3xl"><Badge tone="outline" className="mb-5">Step 1 of 1</Badge><h1 className="text-balance text-4xl font-bold tracking-[-.045em] sm:text-5xl">Make the space yours.</h1><p className="mt-4 mb-10 max-w-2xl text-lg leading-8 text-muted-foreground">Choose how you appear across reviews, favorites, and—if you publish—your creator storefront.</p><div className="rounded-2xl border bg-card p-6 sm:p-8"><ProfileForm profile={profile} onboarding readOnly={mode!=="supabase"}/></div></div></div>}
