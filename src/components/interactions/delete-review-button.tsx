"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteReviewAction } from "@/actions/interactions";
import { Button } from "@/components/ui/button";
export function DeleteReviewButton({id,disabled=false}:{id:string;disabled?:boolean}){const[pending,startTransition]=useTransition();const router=useRouter();function remove(){if(!window.confirm("Delete this review? This cannot be undone."))return;startTransition(async()=>{const result=await deleteReviewAction(id);if(result.ok){toast.success(result.message);router.refresh()}else toast.error(result.error?.message??"Review could not be deleted.")})}return <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={disabled||pending} className="text-destructive"><Trash2/>{pending?"Deleting…":"Delete"}</Button>}
