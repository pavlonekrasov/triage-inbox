"use client";

import type { ReactNode } from "react";
import { isMacPlatform } from "@/lib/platform";
import { cn } from "@/lib/utils";

const CAP = "h-5 min-w-5 items-center justify-center rounded-md border px-1 font-sans text-micro";

/**
 * A shortcut hint inside a button, shown from 1280 px only (brief 9.2). In the thread it also needs a
 * thread column of at least 640 px: with the context panel open at 1280 px the thread is 578 px, and
 * the hints would push ticket 2's decision bar past its column. Hidden from assistive technology: the
 * button's aria-keyshortcuts carries the same information.
 */
export function KeyHint({
  children,
  onPrimary = false,
  scope = "thread",
}: {
  children: ReactNode;
  onPrimary?: boolean;
  /** "thread" for controls in the thread column; "page" for controls elsewhere, such as the bulk bar. */
  scope?: "thread" | "page";
}) {
  return (
    <kbd
      aria-hidden
      className={cn(
        CAP,
        "hidden",
        scope === "thread" ? "xl:@min-[40rem]/thread:inline-flex" : "xl:inline-flex",
        onPrimary ? "border-primary-foreground/30 text-primary-foreground" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </kbd>
  );
}

/** Key caps that are the content itself, in the shortcut sheet and the palette. "Mod" is ⌘ on a Mac, Ctrl elsewhere. */
export function Keys({ caps, className }: { caps: readonly string[]; className?: string }) {
  const mac = isMacPlatform();
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1", className)}>
      {caps.map((cap) => (
        <kbd key={cap} className={cn(CAP, "inline-flex border-border text-muted-foreground")}>
          {cap === "Mod" ? (mac ? "⌘" : "Ctrl") : cap}
        </kbd>
      ))}
    </span>
  );
}
