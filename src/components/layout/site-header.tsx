import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { getRuntimeMode } from "@/lib/env";
import { optionalUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const [user, mode] = await Promise.all([optionalUser(), Promise.resolve(getRuntimeMode())]);
  return <header className="sticky top-0 z-50 border-b bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
    <div className="container-shell flex h-16 items-center gap-4">
      <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg font-bold tracking-tight" aria-label="Agent Souq home"><BrandMark/><span>Agent Souq</span></Link>
      {mode === "demo" && <Badge tone="amber" className="hidden sm:inline-flex">Live preview</Badge>}
      <nav className="ms-3 hidden items-center gap-1 md:flex" aria-label="Main navigation">
        <Link href="/agents" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}><Search aria-hidden="true"/>Explore</Link>
        <Link href="/creator" className={buttonVariants({ variant: "ghost", size: "sm" })}>For creators</Link>
      </nav>
      <div className="ms-auto hidden items-center gap-2 md:flex">
        <ThemeToggle/>
        {user ? <><Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>Dashboard</Link><form action={signOutAction}><Button type="submit" size="sm">Sign out</Button></form></> : <><Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link><Link href="/auth/sign-up" className={buttonVariants({ size: "sm" })}>Join the souq</Link></>}
      </div>
      <details className="group relative ms-auto md:hidden">
        <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border bg-background [&::-webkit-details-marker]:hidden" aria-label="Open navigation"><Menu className="size-5" aria-hidden="true"/></summary>
        <div className="absolute end-0 top-12 w-64 rounded-xl border bg-popover p-2 text-popover-foreground shadow-2xl">
          <nav className="grid" aria-label="Mobile navigation"><Link href="/agents" className={buttonVariants({ variant: "ghost" })}>Explore agents</Link><Link href="/creator" className={buttonVariants({ variant: "ghost" })}>For creators</Link><Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>Dashboard</Link></nav>
          <div className="my-2 border-t"/>
          <div className="flex items-center justify-between gap-2"><ThemeToggle/>{user ? <form action={signOutAction}><Button type="submit" size="sm">Sign out</Button></form> : <Link href="/auth/sign-in" className={buttonVariants({ size: "sm" })}>Sign in</Link>}</div>
        </div>
      </details>
    </div>
  </header>;
}
