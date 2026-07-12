"use client";
import { RouteErrorState } from "@/components/route-error-state";
export default function DashboardError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <RouteErrorState reset={reset} title="Your workspace could not load" description="Your data was not changed. Try loading the dashboard again."/>}
