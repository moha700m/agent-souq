import { Skeleton } from "@/components/ui/skeleton";
export default function AgentLoading(){return <div className="container-shell grid gap-10 py-12 lg:grid-cols-[1fr_350px]" aria-busy="true"><div><Skeleton className="aspect-video rounded-3xl"/><Skeleton className="mt-8 h-12 w-2/3"/><Skeleton className="mt-4 h-7 w-full"/></div><Skeleton className="h-[430px] rounded-2xl"/></div>}
