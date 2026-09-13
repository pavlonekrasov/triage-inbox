import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A shortcut hint inside a button, shown from 1280 px only (brief 9.2). Hidden from assistive
 * technology: the button's aria-keyshortcuts carries the same information.
 */
export function KeyHint({ children, onPrimary = false }: { children: ReactNode; onPrimary?: boolean }) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "hidden h-5 min-w-5 items-center justify-center rounded-md border px-1 font-sans text-micro xl:inline-flex",
        onPrimary ? "border-primary-foreground/30 text-primary-foreground" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </kbd>
  );
}
