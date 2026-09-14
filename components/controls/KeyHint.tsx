import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A shortcut hint inside a button, shown from 1280 px only (brief 9.2), and only while the thread
 * column is at least 640 px: with the context panel open at 1280 px the thread is 578 px, and the hints
 * would push ticket 2's decision bar past its column. Hidden from assistive technology: the button's
 * aria-keyshortcuts carries the same information.
 */
export function KeyHint({ children, onPrimary = false }: { children: ReactNode; onPrimary?: boolean }) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "hidden h-5 min-w-5 items-center justify-center rounded-md border px-1 font-sans text-micro xl:@min-[40rem]/thread:inline-flex",
        onPrimary ? "border-primary-foreground/30 text-primary-foreground" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </kbd>
  );
}
