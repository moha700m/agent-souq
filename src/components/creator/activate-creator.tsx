"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { toast } from "sonner";
import { becomeCreatorAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
export function ActivateCreator({disabled=false}:{disabled?:boolean}){const[pending,startTransition]=useTransition();const router=useRouter();function activate(){startTransition(async()=>{const result=await becomeCreatorAction();if(result.ok){toast.success(result.message);router.refresh()}else toast.error(result.error?.message??"Creator access could not be enabled.")})}return <div className="overflow-hidden rounded-[2rem] border bg-card"><div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end"><div><span className="mb-6 grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Store/></span><h2 className="text-balance text-3xl font-bold tracking-[-.04em]">Bring your best agent workflow to the souq.</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Creator access is free. Activate the studio, build a draft, preview it, then publish once every detail is ready.</p></div><Button size="lg" onClick={activate} disabled={disabled||pending}>{pending?"Opening studio…":"Activate creator access"}<ArrowRight/></Button></div></div>}
