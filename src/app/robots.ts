import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
export default function robots():MetadataRoute.Robots{return{rules:[{userAgent:"*",allow:["/","/agents","/creators/"],disallow:["/api/","/auth/","/dashboard/","/creator/","/onboarding"]}],sitemap:`${getSiteUrl()}/sitemap.xml`,host:getSiteUrl()}}
