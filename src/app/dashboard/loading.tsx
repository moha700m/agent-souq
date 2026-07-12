import { Skeleton } from "@/components/ui/skeleton";
export default function DashboardLoading(){return <div aria-busy="true"><Skeleton className="h-10 w-1/2"/><Skeleton className="mt-4 h-5 w-2/3"/><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4},(_,i)=><Skeleton key={i} className="h-36 rounded-2xl"/>)}</div><Skeleton className="mt-10 h-80 rounded-2xl"/></div>}
