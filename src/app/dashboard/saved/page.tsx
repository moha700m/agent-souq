import type { Metadata } from "next";
import { Collection } from "@/components/dashboard/collection";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getDashboardData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Saved agents",robots:{index:false,follow:false}};
export default async function SavedPage(){const data=await getDashboardData();return <><DashboardHeader title="Saved agents" description="Your shortlist for later comparison and consideration." readOnly={data.readOnly}/><Collection agents={data.favorites} emptyTitle="No saved agents yet" emptyDescription="Use the heart button on any listing to build a shortlist here."/></>}
