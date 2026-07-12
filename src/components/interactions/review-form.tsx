"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewAction } from "@/actions/interactions";
import { Button } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/ui/field";
import type { ActionState } from "@/lib/errors";
import type { Review } from "@/types/domain";

const initialState:ActionState={ok:false};
export function ReviewForm({agentId,review}:{agentId:string;review?:Review}) {
  const action=reviewAction.bind(null,agentId); const[state,formAction,pending]=useActionState(action,initialState); const router=useRouter(); const form=useRef<HTMLFormElement>(null);
  useEffect(()=>{if(state.ok){toast.success(state.message);router.refresh();if(!review)form.current?.reset();}else if(state.error?.message)toast.error(state.error.message);},[state,router,review]);
  const errors=state.error?.fields;
  return <form ref={form} action={formAction} className="grid gap-4 rounded-2xl border bg-card p-5"><div><h3 className="font-bold">{review?"Update your review":"Share your experience"}</h3><p className="mt-1 text-sm text-muted-foreground">Help others understand where this agent works best.</p></div><Field label="Rating" name="rating" required error={errors?.rating}><select id="rating" name="rating" defaultValue={review?.rating??5} className={inputClass}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n===1?"":"s"}</option>)}</select></Field><Field label="Review title" name="title" required error={errors?.title}><input id="title" name="title" defaultValue={review?.title} minLength={3} maxLength={100} required className={inputClass} placeholder="What stood out?"/></Field><Field label="Review" name="body" required error={errors?.body} hint="20–2,000 characters."><textarea id="body" name="body" defaultValue={review?.body} minLength={20} maxLength={2000} required className={textareaClass} placeholder="Describe the task, result, and what others should know."/></Field><Button disabled={pending}>{pending?"Saving…":review?"Update review":"Publish review"}<Star/></Button></form>;
}
