import type { Metadata } from "next";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileForm } from "@/components/forms/profile-form";
import { getDashboardData } from "@/lib/data/dashboard";
export const metadata:Metadata={title:"Profile settings",robots:{index:false,follow:false}};
export default async function ProfilePage(){const data=await getDashboardData();return <><DashboardHeader title="Profile settings" description="Control the identity shown across Agent Souq." readOnly={data.readOnly}/><div className="rounded-2xl border bg-card p-6 sm:p-8"><ProfileForm profile={data.profile} readOnly={data.readOnly}/></div></>}
