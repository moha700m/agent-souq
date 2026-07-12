import Link from "next/link";
import { ArrowRight, Check, Compass, Search, ShieldCheck, Sparkles, Store } from "lucide-react";
import { AgentCard } from "@/components/agent-card";
import { AgentVisual } from "@/components/agent-visual";
import { CategoryIcon } from "@/components/category-icon";
import { Price } from "@/components/price";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { getCategories, getFeaturedAgents } from "@/lib/data/agents";

export default async function HomePage() {
  const [agents, categories] = await Promise.all([getFeaturedAgents(6), getCategories()]);
  const heroAgents = agents.slice(0, 3);
  return <>
    <section className="grain relative isolate overflow-hidden border-b">
      <div className="hero-grid absolute inset-0 -z-10"/>
      <div className="absolute -start-40 top-10 -z-10 size-[28rem] rounded-full bg-primary/10 blur-3xl"/>
      <div className="container-shell grid min-h-[720px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div>
          <Badge tone="outline" className="mb-6 gap-2 bg-background/80 py-1.5"><Sparkles className="size-3.5 text-primary" aria-hidden="true"/>Curated agents. Clear outcomes.</Badge>
          <h1 className="text-balance max-w-3xl text-5xl font-bold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-7xl">Find the AI teammate for the work ahead.</h1>
          <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-muted-foreground sm:text-xl">Discover focused agents from trusted creators—built for coding, research, growth, operations, and everything between the idea and the outcome.</p>
          <form action="/agents" className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl border bg-card p-2 shadow-xl shadow-primary/5 sm:flex-row">
            <label htmlFor="hero-search" className="sr-only">Search the agent marketplace</label><div className="relative flex-1"><Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><input id="hero-search" name="q" placeholder="What do you need to get done?" className={`${inputClass} border-0 ps-10 shadow-none focus:ring-0`}/></div><button className={buttonVariants({ size: "lg" })}>Explore agents <ArrowRight aria-hidden="true"/></button>
          </form>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Check className="size-4 text-primary"/>Transparent pricing</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-primary"/>Real creator profiles</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-primary"/>Community reviews</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-label="Featured agent previews">
          <div className="absolute inset-10 rounded-[2rem] bg-accent/20 blur-3xl"/>
          {heroAgents.map((agent, index) => <Link key={agent.id} href={`/agents/${agent.slug}`} className={`group relative block overflow-hidden rounded-2xl border bg-card p-2 shadow-2xl transition-transform hover:z-20 hover:-translate-y-1 ${index === 0 ? "z-10 me-12 rotate-[-2deg]" : index === 1 ? "z-0 -mt-20 ms-24 rotate-[2deg]" : "z-10 -mt-16 me-20 rotate-[-1deg]"}`}><AgentVisual src={agent.thumbnailUrl} alt={`${agent.name} preview`} className="aspect-[16/7] rounded-xl" priority={index === 0}/><div className="flex items-center justify-between gap-3 p-3"><div><p className="font-bold">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.category.name}</p></div><Price type={agent.priceType} cents={agent.priceCents} className="text-sm font-bold"/></div></Link>)}
        </div>
      </div>
    </section>

    <section className="container-shell py-20 sm:py-28">
      <SectionHeading eyebrow="Browse the souq" title="Start with the job, not the hype." description="Every category is shaped around practical work, so you can move from a need to a useful agent quickly." action={<Link href="/agents" className={buttonVariants({ variant: "outline" })}>All categories <ArrowRight/></Link>}/>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map(category => <Link key={category.id} href={`/agents?category=${category.slug}`} className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg"><span className="mb-6 grid size-11 place-items-center rounded-xl bg-secondary text-primary transition-transform group-hover:rotate-3"><CategoryIcon name={category.icon} className="size-5"/></span><div className="flex items-end justify-between gap-3"><div><h3 className="font-bold">{category.name}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{category.description}</p></div><span className="font-mono text-xs text-muted-foreground">{String(category.agentCount).padStart(2, "0")}</span></div></Link>)}</div>
    </section>

    <section className="border-y bg-card/45"><div className="container-shell py-20 sm:py-28"><SectionHeading eyebrow="Popular now" title="Agents earning a place in real workflows." description="A focused edit of useful tools, ranked by marketplace activity and community feedback." action={<Link href="/agents?sort=popular" className={buttonVariants({ variant: "ghost" })}>See the full edit <ArrowRight/></Link>}/><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{agents.map(agent => <AgentCard key={agent.id} agent={agent}/>)}</div></div></section>

    <section className="container-shell py-20 sm:py-28"><div className="grid overflow-hidden rounded-[2rem] border bg-primary text-primary-foreground lg:grid-cols-2"><div className="p-8 sm:p-12 lg:p-16"><Badge className="mb-6 bg-white/10 text-white">For creators</Badge><h2 className="text-balance text-4xl font-bold tracking-[-.045em] sm:text-5xl">Turn your best workflow into someone else’s advantage.</h2><p className="mt-5 max-w-xl leading-7 text-primary-foreground/75">Publish a polished listing, control its lifecycle, learn from real usage, and grow your reputation in one focused studio.</p><Link href="/creator" className={`${buttonVariants({ variant: "accent", size: "lg" })} mt-8`}>Open creator studio <ArrowRight/></Link></div><div className="grid gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{[{icon:Store,title:"A storefront that feels yours",text:"Rich listings, previews, capabilities, and creator identity."},{icon:Compass,title:"Signals you can act on",text:"Views, favorites, installs, and reviews—without vanity clutter."},{icon:ShieldCheck,title:"Publish with confidence",text:"Structured validation keeps incomplete listings out of the market."},{icon:Sparkles,title:"Built for what comes next",text:"Moderation, payments, and subscriptions fit the foundation."}].map(({icon:Icon,title,text}) => <div key={title} className="bg-primary p-8"><Icon className="mb-5 size-6 text-accent"/><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-primary-foreground/70">{text}</p></div>)}</div></div></section>
  </>;
}
