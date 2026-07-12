import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActivateCreator } from "@/components/creator/activate-creator";
import { NewAgentForm } from "@/components/forms/agent-form";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getCategories } from "@/lib/data/agents";
import { getCreatorData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Create an agent",robots:{index:false,follow:false}};
export default async function NewListingPage(){const[data,categories]=await Promise.all([getCreatorData(),getCategories()]);if(!["creator","admin"].includes(data.profile.role))return <><DashboardHeader title="Creator access required"/><ActivateCreator disabled={data.readOnly}/></>;return <><Link href="/creator/listings" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft/>Back to listings</Link><DashboardHeader title="Create a new agent" description="Save a partial draft at any time. Publishing requires the complete checklist." readOnly={data.readOnly}/><NewAgentForm categories={categories} readOnly={data.readOnly}/></>}
