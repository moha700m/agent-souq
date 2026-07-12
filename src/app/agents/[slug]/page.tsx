import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Bot, CheckCircle2, ChevronRight, ExternalLink, Eye, Heart, PackageCheck } from "lucide-react";
import { AgentActions } from "@/components/interactions/agent-actions";
import { ReviewForm } from "@/components/interactions/review-form";
import { AgentCard } from "@/components/agent-card";
import { AgentVisual } from "@/components/agent-visual";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "@/components/price";
import { Rating } from "@/components/rating";
import { SectionHeading } from "@/components/section-heading";
import { getAgentBySlug, interactionState, recordView, relatedAgents } from "@/lib/data/agents";
import { getRuntimeMode } from "@/lib/env";

type Props = { params: Promise<{ slug: string }> };
function safeExternalUrl(value:string|null){if(!value)return null;try{const parsed=new URL(value);return parsed.protocol==="https:"?parsed.toString():null;}catch{return null;}}
export async function generateMetadata({ params }: Props): Promise<Metadata> { const agent = await getAgentBySlug((await params).slug); if (!agent) return { title: "Agent not found" }; return { title: agent.name, description: agent.tagline, alternates: { canonical: `/agents/${agent.slug}` }, openGraph: { title: agent.name, description: agent.tagline, type: "website", images: agent.thumbnailUrl ? [{ url: agent.thumbnailUrl, alt: `${agent.name} preview` }] : undefined } }; }

export default async function AgentDetailPage({ params }: Props) {
  const { slug } = await params; const agent = await getAgentBySlug(slug); if (!agent) notFound();
  const [related, state] = await Promise.all([relatedAgents(agent), interactionState(agent.id), recordView(agent.id)]);
  const demoUrl = safeExternalUrl(agent.demoUrl);
  const gallery = agent.thumbnailUrl ? agent.galleryUrls : agent.galleryUrls.slice(1);
  const ownReview = state.ownReviewId ? agent.reviews.find(r => r.id === state.ownReviewId) : undefined;
  const jsonLd = JSON.stringify({ "@context":"https://schema.org", "@type":"SoftwareApplication", name:agent.name, description:agent.tagline, applicationCategory:"AIApplication", offers:{ "@type":"Offer", price:(agent.priceCents/100).toFixed(2), priceCurrency:agent.currency }, aggregateRating:agent.reviewCount?{ "@type":"AggregateRating", ratingValue:agent.averageRating, reviewCount:agent.reviewCount }:undefined, author:{ "@type":"Person", name:agent.creator.fullName } }).replace(/</g,"\\u003c");
  return <div className="container-shell py-8 sm:py-12"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>
    <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-1 text-sm text-muted-foreground"><Link href="/agents" className="hover:text-foreground">Marketplace</Link><ChevronRight className="size-3"/><Link href={`/agents?category=${agent.category.slug}`} className="hover:text-foreground">{agent.category.name}</Link><ChevronRight className="size-3"/><span className="truncate text-foreground" aria-current="page">{agent.name}</span></nav>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_350px]">
      <div className="min-w-0"><AgentVisual src={agent.thumbnailUrl ?? agent.galleryUrls[0]} alt={`${agent.name} cover`} priority className="aspect-[16/9] rounded-[1.5rem] border"/>
        {gallery.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{gallery.map((url,index)=><AgentVisual key={url} src={url} alt={`${agent.name} screenshot ${index+1}`} className="aspect-[16/10] rounded-xl border"/>)}</div>}
        <div className="mt-10"><div className="flex flex-wrap items-center gap-2"><Badge>{agent.category.name}</Badge>{agent.tags.slice(0,4).map(tag=><Badge key={tag} tone="outline">#{tag}</Badge>)}</div><h1 className="mt-5 text-balance text-4xl font-bold tracking-[-.045em] sm:text-5xl">{agent.name}</h1><p className="mt-4 text-xl leading-8 text-muted-foreground">{agent.tagline}</p></div>
        <section className="mt-12 border-t pt-10"><h2 className="text-2xl font-bold tracking-tight">What it does</h2><p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{agent.description}</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{agent.capabilities.map(item=><div key={item} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary"/><span className="capitalize">{item}</span></div>)}</div></section>
        <section className="mt-12 border-t pt-10"><div className="rounded-2xl border bg-card p-6 sm:p-8"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-secondary"><Bot className="size-5 text-primary"/></span><div><h2 className="text-xl font-bold">How to get the best result</h2><p className="text-sm text-muted-foreground">Creator guidance · version {agent.version}</p></div></div><p className="whitespace-pre-line leading-7 text-muted-foreground">{agent.instructions}</p></div></section>
        {demoUrl&&<section className="mt-12 border-t pt-10"><div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold">Try the creator demo</h2><p className="mt-1 text-sm text-muted-foreground">Opens an external HTTPS site in a new tab.</p></div><a href={demoUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({variant:"outline"})}>Try external demo<ExternalLink/></a></div></section>}
        <section id="reviews" className="mt-12 scroll-mt-24 border-t pt-10"><SectionHeading title={`Reviews (${agent.reviewCount})`} description="Feedback from people who added this agent to their library."/>
          <div className="grid gap-4">{agent.reviews.length ? agent.reviews.map(review=><article key={review.id} className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><Avatar src={review.reviewer.avatarUrl} name={review.reviewer.fullName}/><div><p className="font-semibold">{review.reviewer.fullName}</p><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(review.createdAt))}</p></div></div><Rating value={review.rating} compact/></div><h3 className="mt-5 font-bold">{review.title}</h3><p className="mt-2 leading-7 text-muted-foreground">{review.body}</p></article>) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No written reviews yet. Be the first after adding this agent.</div>}</div>
          {(state.canReview || ownReview) && <div className="mt-6"><ReviewForm agentId={agent.id} review={ownReview}/></div>}
        </section>
      </div>
      <aside className="lg:relative"><div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5"><div className="flex items-center justify-between gap-4"><Price type={agent.priceType} cents={agent.priceCents} className="text-3xl font-bold tracking-tight"/><Rating value={agent.averageRating} count={agent.reviewCount}/></div><p className="mt-2 text-xs text-muted-foreground">{agent.priceType === "subscription" ? "Billed monthly. Cancel any time." : agent.priceType === "one_time" ? "One-time access price." : "No payment required."}</p><div className="my-6 border-t"/><AgentActions agentId={agent.id} priceType={agent.priceType} initial={state} readOnly={getRuntimeMode()==="demo"}/><div className="my-6 border-t"/><Link href={`/creators/${agent.creator.username}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted"><Avatar src={agent.creator.avatarUrl} name={agent.creator.fullName} className="size-11"/><div className="min-w-0"><p className="flex items-center gap-1 font-semibold">{agent.creator.fullName}{agent.creator.isVerified&&<BadgeCheck className="size-4 text-primary"/>}</p><p className="truncate text-xs text-muted-foreground">@{agent.creator.username}</p></div></Link><dl className="mt-6 grid grid-cols-3 gap-2 border-t pt-5 text-center"><div><dt className="sr-only">Views</dt><dd className="font-mono text-sm font-semibold">{agent.viewCount.toLocaleString()}</dd><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Eye className="size-3"/>views</span></div><div><dt className="sr-only">Favorites</dt><dd className="font-mono text-sm font-semibold">{agent.favoriteCount.toLocaleString()}</dd><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Heart className="size-3"/>saves</span></div><div><dt className="sr-only">Installs</dt><dd className="font-mono text-sm font-semibold">{agent.installCount.toLocaleString()}</dd><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><PackageCheck className="size-3"/>adds</span></div></dl></div></aside>
    </div>
    {related.length > 0 && <section className="mt-20 border-t pt-16"><SectionHeading eyebrow="Keep exploring" title="Related agents"/><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map(item=><AgentCard key={item.id} agent={item}/>)}</div></section>}
  </div>;
}
