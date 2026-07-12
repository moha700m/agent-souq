import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getCurrentProfile } from "@/lib/data/dashboard";
import { getRuntimeMode } from "@/lib/env";
import { optionalUser } from "@/lib/auth";

export default async function CreatorLayout({children}:{children:React.ReactNode}) {
  const mode=getRuntimeMode(); const user=await optionalUser();
  if(mode==="supabase"&&!user) redirect("/auth/sign-in?next=/creator");
  const profile=await getCurrentProfile();
  if(mode==="supabase"&&!profile.onboardingCompleted) redirect("/onboarding");
  return <div className="container-shell grid grid-cols-[minmax(0,1fr)] gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14"><aside className="min-w-0"><div className="mb-5 flex items-center gap-3 px-2"><Avatar src={profile.avatarUrl} name={profile.fullName} className="size-10"/><div className="min-w-0"><p className="truncate text-sm font-semibold">Creator studio</p><p className="truncate text-xs text-muted-foreground">@{profile.username}</p></div></div><DashboardNav kind="creator"/></aside><div className="min-w-0">{children}</div></div>;
}
