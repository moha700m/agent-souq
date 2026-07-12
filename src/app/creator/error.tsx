"use client";
import { RouteErrorState } from "@/components/route-error-state";
export default function CreatorError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <RouteErrorState reset={reset} title="The creator studio could not load" description="Your listings are unchanged. Try opening the studio again."/>}
