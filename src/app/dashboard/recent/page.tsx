import type { Metadata } from "next";
import { Collection } from "@/components/dashboard/collection";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getDashboardData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Recently viewed",robots:{index:false,follow:false}};
export default async function RecentPage(){const data=await getDashboardData();return <><DashboardHeader title="Recently viewed" description="Pick up where you left off. Views are stored only for signed-in members." readOnly={data.readOnly}/><Collection agents={data.recent} emptyTitle="Nothing viewed yet" emptyDescription="Explore an agent detail page and it will appear here for quick access."/></>}
