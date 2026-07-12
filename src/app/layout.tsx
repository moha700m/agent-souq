import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Agent Souq — Find your next AI teammate", template: "%s — Agent Souq" },
  description: "Discover practical, reviewed AI agents for coding, business, research, marketing, automation, and more.",
  applicationName: "Agent Souq",
  keywords: ["AI agents", "agent marketplace", "automation", "productivity", "AI tools"],
  authors: [{ name: "Agent Souq" }],
  creator: "Agent Souq",
  openGraph: { type: "website", siteName: "Agent Souq", title: "Agent Souq — Find your next AI teammate", description: "A curated marketplace for practical AI agents.", url: "/" },
  twitter: { card: "summary_large_image", title: "Agent Souq", description: "Find your next AI teammate." },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { colorScheme: "light dark", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f7f2" }, { media: "(prefers-color-scheme: dark)", color: "#0d110e" }] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <a href="#main-content" className="fixed start-3 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0">Skip to content</a>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="bottom-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
