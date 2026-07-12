"use client";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Heart, LoaderCircle, LockKeyhole, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { installAgentAction, toggleFavoriteAction } from "@/actions/interactions";
import { Button } from "@/components/ui/button";
import type { InteractionState, PriceType } from "@/types/domain";

function useActionError() { const path = usePathname(); const router = useRouter(); return (error: { code: string; message: string }) => { if (error.code === "UNAUTHENTICATED") { router.push(`/auth/sign-in?next=${encodeURIComponent(path)}`); return; } toast.error(error.message); }; }

export function AgentActions({ agentId, priceType, initial, readOnly = false }: { agentId: string; priceType: PriceType; initial: InteractionState; readOnly?: boolean }) {
  const [favorite, setFavorite] = useState(initial.isFavorite); const [installed, setInstalled] = useState(initial.isInstalled); const [pending, startTransition] = useTransition(); const handleError = useActionError();
  function favoriteClick() { if (readOnly) return toast.info("Favorites are disabled in the read-only preview."); startTransition(async () => { const result = await toggleFavoriteAction(agentId); if (result.ok && result.data) { setFavorite(result.data.isFavorite); toast.success(result.message); } else if (result.error) handleError(result.error); }); }
  function installClick() { if (readOnly) return toast.info("Installs are disabled in the read-only preview."); startTransition(async () => { const result = await installAgentAction(agentId); if (result.ok) { setInstalled(true); toast.success(result.message); } else if (result.error) handleError(result.error); }); }
  const paid = priceType !== "free";
  return <div className="grid gap-3"><Button size="lg" onClick={paid || installed ? undefined : installClick} disabled={pending || paid || installed} className="w-full">{pending ? <LoaderCircle className="animate-spin"/> : installed ? <Check/> : paid ? <LockKeyhole/> : <ShoppingBag/>}{installed ? "In your library" : paid ? "Payments coming soon" : "Add to library"}</Button><Button size="lg" variant="outline" onClick={favoriteClick} disabled={pending} aria-pressed={favorite} className="w-full"><Heart className={favorite ? "fill-current" : ""}/>{favorite ? "Saved" : "Save for later"}</Button>{paid && <p className="text-center text-xs leading-5 text-muted-foreground">Paid checkout is intentionally marked unavailable until payment processing is configured.</p>}</div>;
}
