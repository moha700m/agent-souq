import type { Metadata } from "next";
import { Collection } from "@/components/dashboard/collection";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getDashboardData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Agent library",robots:{index:false,follow:false}};
export default async function LibraryPage(){const data=await getDashboardData();return <><DashboardHeader title="Your library" description="Agents you installed or purchased, ready when you need them." readOnly={data.readOnly}/><Collection agents={data.installations} emptyTitle="Your library is empty" emptyDescription="Add a free agent to start building your working toolkit."/></>}
