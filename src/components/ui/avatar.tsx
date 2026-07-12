"use client";
import { UserRound } from "lucide-react";
import { ResilientImage } from "@/components/ui/resilient-image";
import { cn } from "@/lib/utils";

function safeAvatarUrl(value: string | null) { if (!value) return null; try { const parsed=new URL(value); return parsed.protocol==="https:"?parsed.toString():null; } catch { return null; } }
export function Avatar({ src, name, className }: { src: string | null; name: string; className?: string }) {
  const safe=safeAvatarUrl(src); const fallback=<><UserRound className="size-4" aria-hidden="true"/><span className="sr-only">{name}</span></>;
  return <span className={cn("relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary text-secondary-foreground", className)}>{safe?<ResilientImage key={safe} src={safe} alt="" fallback={fallback} width={64} height={64} loading="lazy" decoding="async" className="h-full w-full object-cover" referrerPolicy="no-referrer"/>:fallback}</span>;
}
