"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { applyTheme, currentTheme, subscribeTheme } from "@/lib/theme";

const subscribeHydration = () => () => {};

/** A real browsing context gives each case its own phone breakpoint, reducer and overlay portals. */
export function LiveDesk({ ticket, threadOnly = false, label }: { ticket: string; threadOnly?: boolean; label: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => {
      const doc = frame.current?.contentDocument;
      doc?.documentElement.classList.toggle("dark", currentTheme() === "night");
    };
    return subscribeTheme(sync);
  }, []);
  return <iframe
    ref={frame}
    title={label}
    data-case={ticket}
    data-loaded={ready}
    src={`/slides/thread?ticket=${ticket}${threadOnly ? "" : "&presentation=case"}`}
    className={threadOnly ? "h-full w-full border-0 bg-background" : "h-[calc(100%/0.85)] w-[calc(100%/0.85)] origin-top-left scale-[0.85] border-0 bg-background"}
    onLoad={() => {
      frame.current?.contentDocument?.documentElement.classList.toggle("dark", currentTheme() === "night");
      setReady(true);
    }}
  />;
}

export function SlideShell({ number, title, description, children }: {
  number: string; title: string; description: string; children: React.ReactNode;
}) {
  // Set the requested export theme before mounting the child desks. Their head scripts read the same storage.
  const ready = useSyncExternalStore(subscribeHydration, () => true, () => false);
  useEffect(() => {
    const theme = new URLSearchParams(location.search).get("theme");
    if (theme === "day" || theme === "night") applyTheme(theme);
  }, []);
  return <div data-slide data-ready={ready} className="relative flex h-[900px] w-[1440px] flex-col bg-background px-16 pt-8 pb-6 text-foreground">
    <header className="mb-5 flex shrink-0 items-start justify-between gap-8">
      <div>
        <p className="mb-2 text-micro text-muted-foreground">Care Desk · concept</p>
        <h1 className="text-heading">{title}</h1>
        <p className="mt-1 text-body text-muted-foreground">{description}</p>
      </div>
      <div data-slide-controls><ThemeToggle /></div>
    </header>
    {ready && children}
    <footer className="mt-auto flex shrink-0 items-center justify-between pt-3 text-micro text-muted-foreground">
      <span>AI prepares the case. People make the judgment.</span>
      <span className="tabular-nums">{number} / 05</span>
    </footer>
  </div>;
}
