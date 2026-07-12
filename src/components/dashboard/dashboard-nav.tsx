"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Clock3, Heart, LayoutDashboard, MessageSquareText, PackageCheck, Settings, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const userLinks=[{href:"/dashboard",label:"Overview",icon:LayoutDashboard,exact:true},{href:"/dashboard/saved",label:"Saved",icon:Heart},{href:"/dashboard/recent",label:"Recently viewed",icon:Clock3},{href:"/dashboard/library",label:"Library",icon:PackageCheck},{href:"/dashboard/reviews",label:"Reviews",icon:MessageSquareText},{href:"/dashboard/profile",label:"Profile",icon:UserRound}];
const creatorLinks=[{href:"/creator",label:"Studio overview",icon:Store,exact:true},{href:"/creator/listings",label:"Listings",icon:Boxes},{href:"/dashboard/profile",label:"Public profile",icon:Settings}];
export function DashboardNav({ kind="user" }: { kind?:"user"|"creator" }){const pathname=usePathname();const links=kind==="creator"?creatorLinks:userLinks;return <nav aria-label={kind==="creator"?"Creator studio":"Account dashboard"} className="flex gap-1 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0">{links.map(({href,label,icon:Icon,exact})=>{const active=exact?pathname===href:pathname.startsWith(href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",active?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4"/>{label}</Link>})}</nav>}
