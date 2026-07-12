import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { AgentCard } from "@/components/agent-card";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { getAgents, getCategories, parseMarketplace } from "@/lib/data/agents";

export const metadata: Metadata = { title: "AI agent marketplace", description: "Search and filter practical AI agents by category, price, rating, and popularity.", alternates: { canonical: "/agents" } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

function pageHref(raw: Record<string, string | string[] | undefined>, page: number) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(raw)) { const v = first(value); if (v && key !== "page") params.set(key, v); } if (page > 1) params.set("page", String(page)); return `/agents${params.size ? `?${params}` : ""}`; }

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = parseMarketplace({ q: first(raw.q), category: first(raw.category), pricing: first(raw.pricing), sort: first(raw.sort), page: first(raw.page), pageSize: 12 });
  const [result, categories] = await Promise.all([getAgents(query), getCategories()]);
  const activeCount = Number(Boolean(query.q)) + Number(Boolean(query.category)) + Number(Boolean(query.pricing));
  return <div className="container-shell py-12 sm:py-16">
    <div className="mb-10 max-w-3xl"><Badge tone="outline" className="mb-4">The marketplace</Badge><h1 className="text-balance text-4xl font-bold tracking-[-.045em] sm:text-5xl">A better way to find useful AI.</h1><p className="mt-4 text-lg leading-8 text-muted-foreground">Search by outcome, narrow the details, and compare agents without the noise.</p></div>
    <form action="/agents" className="sticky top-20 z-30 mb-8 grid gap-3 rounded-2xl border bg-background/92 p-3 shadow-xl shadow-black/5 backdrop-blur-xl md:grid-cols-[1fr_180px_160px_180px_auto]">
      <div className="relative"><label className="sr-only" htmlFor="market-search">Search agents</label><Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input id="market-search" name="q" defaultValue={query.q} placeholder="Search agents, tasks, tags…" className={`${inputClass} ps-10`}/></div>
      <label><span className="sr-only">Category</span><select name="category" defaultValue={query.category ?? ""} className={inputClass}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
      <label><span className="sr-only">Pricing</span><select name="pricing" defaultValue={query.pricing ?? ""} className={inputClass}><option value="">Any price</option><option value="free">Free</option><option value="one_time">One-time</option><option value="subscription">Subscription</option></select></label>
      <label><span className="sr-only">Sort</span><select name="sort" defaultValue={query.sort} className={inputClass}><option value="popular">Most popular</option><option value="newest">Newest</option><option value="rating">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
      <button className={buttonVariants()}><SlidersHorizontal/>Apply</button>
    </form>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{result.total}</strong> {result.total === 1 ? "agent" : "agents"}{query.q && <> matching “<span className="text-foreground">{query.q}</span>”</>}</p>{activeCount > 0 && <Link href="/agents" className={buttonVariants({ variant: "ghost", size: "sm" })}><X/>Clear {activeCount} {activeCount === 1 ? "filter" : "filters"}</Link>}</div>
    {query.category && <div className="mb-6 flex gap-2 overflow-x-auto pb-1">{categories.map(c => <Link key={c.id} href={`/agents?category=${c.slug}`} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${query.category === c.slug ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}><CategoryIcon name={c.icon} className="size-3.5"/>{c.name}</Link>)}</div>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.items.map(agent => <AgentCard key={agent.id} agent={agent}/>)}{result.items.length === 0 && <EmptyState title="No agents found" description="Try a broader search or remove a filter to see more of the marketplace." href="/agents" action="Reset filters"/>}</div>
    {result.pageCount > 1 && <nav className="mt-10 flex items-center justify-between border-t pt-6" aria-label="Marketplace pages"><Link aria-disabled={result.page === 1} tabIndex={result.page === 1 ? -1 : undefined} href={pageHref(raw, Math.max(1, result.page - 1))} className={`${buttonVariants({ variant: "outline" })} ${result.page === 1 ? "pointer-events-none opacity-45" : ""}`}><ChevronLeft/>Previous</Link><p className="font-mono text-xs text-muted-foreground">PAGE {result.page} / {result.pageCount}</p><Link aria-disabled={result.page === result.pageCount} tabIndex={result.page === result.pageCount ? -1 : undefined} href={pageHref(raw, Math.min(result.pageCount, result.page + 1))} className={`${buttonVariants({ variant: "outline" })} ${result.page === result.pageCount ? "pointer-events-none opacity-45" : ""}`}>Next<ChevronRight/></Link></nav>}
  </div>;
}
