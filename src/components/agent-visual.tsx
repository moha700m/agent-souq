"use client";
import { Bot, ImageOff } from "lucide-react";
import { ResilientImage } from "@/components/ui/resilient-image";
import { cn } from "@/lib/utils";

function safeImageUrl(value: string | null | undefined) { if (!value) return null; try { const parsed = new URL(value); return parsed.protocol === "https:" ? parsed.toString() : null; } catch { return null; } }
function VisualFallback({alt,failed}:{alt:string;failed:boolean}){return <div className="grid h-full min-h-40 place-items-center"><div className="relative grid size-20 place-items-center rounded-3xl border border-white/30 bg-background/70 shadow-xl backdrop-blur"><Bot className="size-9 text-primary" aria-hidden="true"/>{failed&&<ImageOff className="absolute -bottom-1 -end-1 size-5 rounded-full bg-background p-1 text-muted-foreground" aria-hidden="true"/>}</div><span className="sr-only">{alt}</span></div>}

export function AgentVisual({ src, alt, className, priority = false }: { src: string | null | undefined; alt: string; className?: string; priority?: boolean }) {
  const safe=safeImageUrl(src); const fallback=<VisualFallback alt={alt} failed={Boolean(safe)}/>;
  return <div className={cn("relative overflow-hidden bg-[linear-gradient(145deg,color-mix(in_srgb,var(--secondary)_90%,white),color-mix(in_srgb,var(--primary)_24%,var(--background)))]", className)}>{safe?<ResilientImage key={safe} src={safe} alt={alt} fallback={fallback} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" loading={priority?"eager":"lazy"} fetchPriority={priority?"high":"auto"} decoding="async" referrerPolicy="no-referrer"/>:fallback}<div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5"/></div>;
}
