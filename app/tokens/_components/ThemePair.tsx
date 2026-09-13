import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const THEMES = [
  { scope: "light", label: "Day" },
  { scope: "dark", label: "Night shift" },
] as const;

/**
 * Renders the same specimen twice, inside a `.light` and a `.dark` scope. Each scope re-declares the
 * tokens (globals.css), so both columns are real themes regardless of the page's own theme.
 */
export function ThemePair({
  children,
  ground = "background",
}: {
  children: ReactNode;
  ground?: "background" | "sidebar";
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {THEMES.map((theme) => (
        <div
          key={theme.scope}
          data-theme-scope={theme.scope}
          className={cn(
            theme.scope,
            "flex min-w-0 flex-col gap-3 rounded-card border border-border p-5 text-foreground",
            ground === "sidebar" ? "bg-sidebar" : "bg-background",
          )}
        >
          <p className="text-micro text-muted-foreground">{theme.label}</p>
          {children}
        </div>
      ))}
    </div>
  );
}
