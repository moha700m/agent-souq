import { AgentCard } from "@/components/agent-card";
import { EmptyState } from "@/components/empty-state";
import type { Agent } from "@/types/domain";
export function Collection({agents,emptyTitle,emptyDescription,emptyHref="/agents",emptyAction="Explore agents"}:{agents:Agent[];emptyTitle:string;emptyDescription:string;emptyHref?:string;emptyAction?:string}){return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{agents.map(agent=><AgentCard key={agent.id} agent={agent}/>)}{agents.length===0&&<EmptyState title={emptyTitle} description={emptyDescription} href={emptyHref} action={emptyAction}/>}</div>}
