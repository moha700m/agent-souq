import type { PriceType } from "@/types/domain";
export function formatPrice(type: PriceType, cents: number) { if (type === "free") return "Free"; const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100); return type === "subscription" ? `${price}/mo` : price; }
export function Price({ type, cents, className }: { type: PriceType; cents: number; className?: string }) { return <span className={className}>{formatPrice(type, cents)}</span>; }
