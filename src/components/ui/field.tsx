import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AssociableProps = { id?: string; children?: ReactNode; "aria-describedby"?: string; "aria-invalid"?: boolean };
function associateControl(node: ReactNode, name: string, descriptionId: string | undefined, invalid: boolean): ReactNode {
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<AssociableProps>;
  if (element.props.id === name) return cloneElement(element, { ...(descriptionId ? { "aria-describedby": descriptionId } : {}), ...(invalid ? { "aria-invalid": true } : {}) });
  if (element.props.children === undefined) return element;
  return cloneElement(element, { children: Children.map(element.props.children, child => associateControl(child, name, descriptionId, invalid)) });
}

export function Field({ label, name, hint, error, required, children, className }: { label: string; name: string; hint?: string; error?: string[]; required?: boolean; children: ReactNode; className?: string }) {
  const message = error?.[0] ?? hint; const descriptionId = message ? `${name}-description` : undefined; const invalid = Boolean(error?.[0]);
  return <div className={cn("grid gap-2", className)}><label htmlFor={name} className="text-sm font-semibold">{label}{required && <span className="ms-1 text-destructive" aria-hidden="true">*</span>}</label>{associateControl(children, name, descriptionId, invalid)}{message && <p id={descriptionId} role={invalid ? "alert" : undefined} className={cn("text-xs leading-5", invalid ? "text-destructive" : "text-muted-foreground")}>{message}</p>}</div>;
}
export const inputClass = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/70 hover:border-foreground/25 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
export const textareaClass = `${inputClass} min-h-28 resize-y py-3`;
