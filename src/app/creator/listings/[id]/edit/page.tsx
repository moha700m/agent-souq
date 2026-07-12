import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditAgentForm } from "@/components/forms/agent-form";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { getCategories } from "@/lib/data/agents";
import { getCreatorData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Edit agent listing",robots:{index:false,follow:false}};
export default async function EditListingPage({params}:{params:Promise<{id:string}>}) { const{id}=await params;const[data,categories]=await Promise.all([getCreatorData(),getCategories()]);const agent=data.listings.find(item=>item.id===id);if(!agent)notFound();const terminal=agent.status==="archived";return <><Link href="/creator/listings" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft/>Back to listings</Link><DashboardHeader title={`Edit ${agent.name}`} description={terminal?"Archived listings are permanently read-only.":agent.status==="published"?"Changes to a live listing must continue to meet every publication requirement.":"Changes remain private until you publish this draft."} readOnly={data.readOnly}/>{terminal&&<Badge tone="neutral" className="mb-6">archived · read only</Badge>}<EditAgentForm agent={agent} categories={categories} readOnly={data.readOnly||terminal}/></>; }
