"use server";
import { revalidatePath } from "next/cache";
import { ensureProfile, requireUser } from "@/lib/auth";
import { assertDb, failedAction, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";
export async function updateProfileAction(_:ActionState,f:FormData):Promise<ActionState>{try{const u=await requireUser();await ensureProfile(u);const p=profileSchema.parse({username:f.get("username"),fullName:f.get("fullName"),bio:f.get("bio"),avatarUrl:f.get("avatarUrl"),websiteUrl:f.get("websiteUrl"),onboardingCompleted:f.get("onboardingCompleted")==="true"});const s=await createClient();const{error}=await s.from("profiles").update({username:p.username,full_name:p.fullName,bio:p.bio??null,avatar_url:p.avatarUrl??null,website_url:p.websiteUrl??null,...(p.onboardingCompleted?{onboarding_completed:true}:{})}).eq("id",u.id);assertDb(error,"That username may already be in use.");revalidatePath("/dashboard");revalidatePath("/onboarding");return{ok:true,message:"Profile saved."};}catch(e){return failedAction(e)}}
export async function becomeCreatorAction():Promise<ActionState>{try{const s=await createClient();const{error}=await s.rpc("become_creator");assertDb(error,"Creator access could not be enabled.");revalidatePath("/creator");return{ok:true,message:"Creator studio is ready."};}catch(e){return failedAction(e)}}
