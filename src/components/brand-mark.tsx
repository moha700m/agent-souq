import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
export function BrandMark({ className }: { className?: string }) { return <span className={cn("relative grid size-9 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm", className)}><span className="absolute -end-2 -top-2 size-5 rounded-full bg-accent"/><Sparkles className="relative size-4" aria-hidden="true"/></span>; }
