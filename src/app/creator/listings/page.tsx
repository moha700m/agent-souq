import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ActivateCreator } from "@/components/creator/activate-creator";
import { ListingRow } from "@/components/creator/listing-row";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { buttonVariants } from "@/components/ui/button";
import { getCreatorData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Agent listings",robots:{index:false,follow:false}};
export default async function ListingsPage(){const data=await getCreatorData();if(!["creator","admin"].includes(data.profile.role))return <><DashboardHeader title="Your listings" description="Activate creator access before building a listing."/><ActivateCreator disabled={data.readOnly}/></>;return <><DashboardHeader title="Your listings" description="Draft privately, validate before publishing, and archive listings that have reached the end of their life." readOnly={data.readOnly} action={<Link href="/creator/listings/new" className={buttonVariants()}><Plus/>New listing</Link>}/><div className="grid gap-4">{data.listings.map(agent=><ListingRow key={agent.id} agent={agent} readOnly={data.readOnly}/>)}{data.listings.length===0&&<div className="rounded-2xl border border-dashed p-12 text-center"><p className="font-semibold">No listings yet</p><p className="mt-2 text-sm text-muted-foreground">Start with a draft. Nothing goes live until you explicitly publish it.</p></div>}</div></>}
