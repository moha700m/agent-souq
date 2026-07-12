"use client";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
export function RouteErrorState({reset,title="Something went off course",description="The page could not be loaded safely. Try again, or return to the marketplace."}:{reset:()=>void;title?:string;description?:string}){return <div className="container-shell grid min-h-[55vh] place-items-center py-20 text-center"><div className="max-w-lg"><span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle/></span><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mt-3 leading-7 text-muted-foreground">{description}</p><div className="mt-7 flex justify-center gap-3"><Button onClick={reset}><RotateCcw/>Try again</Button><Link href="/agents" className={buttonVariants({variant:"outline"})}>Marketplace</Link></div></div></div>}
