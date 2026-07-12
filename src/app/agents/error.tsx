"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function AgentsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="container-shell grid min-h-[50vh] place-items-center py-20 text-center"><div><AlertTriangle className="mx-auto mb-5 size-10 text-destructive"/><h1 className="text-2xl font-bold">The marketplace could not load</h1><p className="mt-2 text-muted-foreground">Check the filters or try the request again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></div>; }
