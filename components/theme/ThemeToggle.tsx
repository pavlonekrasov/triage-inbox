"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { applyTheme, currentTheme, subscribeTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const serverTheme = (): Theme => "day";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
  const next: Theme = theme === "day" ? "night" : "day";
  const Icon = theme === "day" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-label text-foreground",
        "transition-[background-color,scale] duration-(--dur-hover) ease-out hover:bg-accent active:scale-(--press-scale)",
        className,
      )}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      {theme === "day" ? "Switch to Night shift" : "Switch to Day"}
    </button>
  );
}
