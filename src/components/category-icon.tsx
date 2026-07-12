import { BriefcaseBusiness, Code2, ListChecks, Megaphone, MessagesSquare, Telescope, Workflow, Shapes } from "lucide-react";
const icons = { Code2, Briefcase: BriefcaseBusiness, Megaphone, Telescope, MessagesSquare, Workflow, ListChecks } as const;
export function CategoryIcon({ name, className }: { name: string; className?: string }) { const Icon = icons[name as keyof typeof icons] ?? Shapes; return <Icon className={className} aria-hidden="true"/>; }
