import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type PillOptions = {
  variant?: "primary" | "ghost" | "outline";
  /** sm = 32px, for dense chrome on a fine pointer; md = 40px, for the decision bar. */
  size?: "sm" | "md";
  /** Square button holding only an icon. It must carry an aria-label that names the action. */
  iconOnly?: boolean;
};

/**
 * The desk's button classes, shared with triggers rendered by headless primitives. Hover is a
 * background wash over 150 ms (fine pointers only, via the hover variant); press scales to
 * --press-scale over 100 ms, which reduced motion pins to 1.
 */
export function pillButtonClass({ variant = "ghost", size = "sm", iconOnly = false }: PillOptions = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-label whitespace-nowrap outline-none select-none",
    "[transition:background-color_var(--dur-hover)_ease,scale_100ms_var(--ease-out)] active:scale-(--press-scale)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:text-muted-foreground",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" && (iconOnly ? "size-8" : "h-8 px-3"),
    size === "md" && (iconOnly ? "size-10" : "h-10 px-4"),
    variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "ghost" && "text-foreground hover:bg-accent data-popup-open:bg-accent",
    variant === "outline" && "border border-border bg-card text-foreground hover:bg-accent",
  );
}

export function PillButton({
  variant,
  size,
  iconOnly,
  type = "button",
  className,
  ...props
}: ComponentProps<"button"> & PillOptions) {
  return <button type={type} className={cn(pillButtonClass({ variant, size, iconOnly }), className)} {...props} />;
}
