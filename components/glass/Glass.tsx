import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * The only file that writes backdrop-filter (review gate 3). Glass is the control layer that floats
 * above content, and exactly four surfaces may use it (6.5). Content is never glass.
 */
export type GlassSurface = "thread-header" | "decision-bar" | "lane-track" | "bulk-bar";

type GlassProps = ComponentProps<"div"> & {
  surface: GlassSurface;
  /** "strong" (0.88 tint) for glass that carries primary text; "light" follows --glass-tint-alpha. */
  tint?: "strong" | "light";
};

/*
 * The blur is bounded by border-radius, never clip-path or a mask: Chromium composites a clip-path as
 * a synthesized mask layer that can drop under compositing churn and paint the blur as a hard
 * rectangle. The -webkit- property is set before the standard one.
 * Reduced transparency needs no branch here: the token layer pins the tint opaque and the blur to none.
 */
const material = (tint: "strong" | "light"): CSSProperties => ({
  WebkitBackdropFilter: "var(--glass-blur)",
  backdropFilter: "var(--glass-blur)",
  backgroundColor: tint === "strong" ? "var(--glass-tint-strong)" : "var(--glass-tint)",
  backgroundImage: "var(--glass-sheen)",
  border: "1px solid var(--glass-edge)",
  boxShadow: "var(--glass-bevel), var(--glass-ring), var(--shadow-glass)",
});

export function Glass({ surface, tint = "strong", className, style, ...props }: GlassProps) {
  return (
    <div
      data-glass={surface}
      className={cn("rounded-full", className)}
      style={{ ...material(tint), ...style }}
      {...props}
    />
  );
}
