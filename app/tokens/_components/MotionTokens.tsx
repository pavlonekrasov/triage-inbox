"use client";

import { useMeasure } from "./useMeasure";

const TOKENS = [
  { name: "--ease-out", use: "Entrances" },
  { name: "--ease-soft", use: "Unhurried panels" },
  { name: "--ease-in-out", use: "On-screen moves" },
  { name: "--ease-in", use: "Exits" },
  { name: "--dur-hover", use: "Hover washes" },
  { name: "--dur-ui", use: "UI state changes" },
  { name: "--dur-panel", use: "Panels and sheets" },
  { name: "--motion", use: "1 allows transform motion; 0 under prefers-reduced-motion" },
  { name: "--press-scale", use: "Button press; 1 under prefers-reduced-motion" },
  { name: "--glass-tint-alpha", use: "Glass transparency; 1 under prefers-reduced-transparency" },
] as const;

export function MotionTokens() {
  const [ref, values] = useMeasure(() => {
    const root = getComputedStyle(document.documentElement);
    return Object.fromEntries(TOKENS.map((t) => [t.name, root.getPropertyValue(t.name).trim()]));
  });

  return (
    <div ref={ref} className="flex flex-col rounded-card border border-border bg-card px-5 py-2">
      {TOKENS.map((token) => (
        <div key={token.name} className="grid gap-1 border-t border-border py-2.5 first:border-t-0 md:grid-cols-3 md:gap-4">
          <span className="font-mono text-micro">{token.name}</span>
          <span data-token-value={token.name} className="font-mono text-micro text-muted-foreground">
            {values?.[token.name] || "measuring"}
          </span>
          <span className="text-body-s text-muted-foreground">{token.use}</span>
        </div>
      ))}
    </div>
  );
}
