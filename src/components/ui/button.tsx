import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background,color,border-color,transform,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px", { variants: { variant: { default: "bg-primary text-primary-foreground shadow-sm hover:brightness-110", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/75", outline: "border bg-background/60 hover:bg-muted", ghost: "hover:bg-muted hover:text-foreground", destructive: "bg-destructive text-destructive-foreground hover:brightness-110", accent: "bg-accent text-accent-foreground hover:brightness-105" }, size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", lg: "h-12 rounded-xl px-6 text-base", icon: "size-10 p-0" } }, defaultVariants: { variant: "default", size: "default" } });

export function Button({ className, variant, size, asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
