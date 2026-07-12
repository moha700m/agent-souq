import type { MetadataRoute } from "next";
import { getFeaturedAgents } from "@/lib/data/agents";
import { getSiteUrl } from "@/lib/env";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=getSiteUrl();const agents=await getFeaturedAgents(12);return[{url:base,changeFrequency:"weekly",priority:1},{url:`${base}/agents`,changeFrequency:"daily",priority:.9},...agents.map(agent=>({url:`${base}/agents/${agent.slug}`,lastModified:agent.updatedAt,changeFrequency:"weekly" as const,priority:.75}))]}
