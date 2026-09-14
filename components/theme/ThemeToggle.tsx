"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/controls/Button";
import { applyTheme, currentTheme, subscribeTheme, type Theme } from "@/lib/theme";

const serverTheme = (): Theme => "day";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
  const next: Theme = theme === "day" ? "night" : "day";
  const Icon = theme === "day" ? Moon : Sun;

  return (
    <Button variant="outline" className={className} onClick={() => applyTheme(next)}>
      <Icon aria-hidden strokeWidth={1.75} />
      {theme === "day" ? "Switch to Night shift" : "Switch to Day"}
    </Button>
  );
}
