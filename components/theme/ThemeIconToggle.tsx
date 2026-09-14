"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/controls/Button";
import { applyTheme, currentTheme, subscribeTheme, type Theme } from "@/lib/theme";

const serverTheme = (): Theme => "day";

/** Icon-only theme switch for dense chrome. The label says which theme a press switches to. */
export function ThemeIconToggle() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
  const label = theme === "day" ? "Switch to Night shift" : "Switch to Day";
  return (
    <Button iconOnly aria-label={label} title={label} onClick={() => applyTheme(theme === "day" ? "night" : "day")}>
      {theme === "day" ? <Moon aria-hidden strokeWidth={1.75} /> : <Sun aria-hidden strokeWidth={1.75} />}
    </Button>
  );
}
