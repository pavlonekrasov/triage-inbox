"use client";

import { useMeasure } from "./useMeasure";

const ROLES = [
  { token: "--background", name: "Canvas", job: "App canvas and the thread ground" },
  { token: "--sidebar", name: "List pane", job: "One tonal step below the canvas, so panes separate without a heavy border" },
  { token: "--card", name: "Card", job: "Bubbles, panel sections, popovers" },
  { token: "--foreground", name: "Ink", job: "Text and icons" },
  { token: "--muted-foreground", name: "Muted ink", job: "Meta, list previews, service messages" },
  { token: "--primary", name: "Primary", job: "The ink button: the one action that sends" },
  { token: "--accent", name: "Hover wash", job: "Row hover and selection" },
  { token: "--border", name: "Hairline", job: "Pane dividers, the customer bubble edge" },
  { token: "--ring", name: "Focus ring", job: "Keyboard focus only" },
  { token: "--bubble-out", name: "Sent bubble", job: "A reply a human or auto-send delivered" },
  { token: "--brand", name: "Machine violet", job: "AI-written content no human has approved" },
  { token: "--brand-wash", name: "Draft wash", job: "The draft bubble fill" },
  { token: "--risk-low", name: "Sage", job: "Auto route, low risk" },
  { token: "--risk-mid", name: "Amber fill", job: "Draft glyph fill only, never text" },
  { token: "--risk-mid-ink", name: "Amber ink", job: "Any amber text, the Draft glyph ring" },
  { token: "--risk-high", name: "Terracotta", job: "Human-led route, high risk" },
  { token: "--destructive", name: "Destructive", job: "Failed sends, destructive confirmations" },
  { token: "--field-a", name: "Wallpaper field A", job: "Amber field behind the thread header" },
  { token: "--field-b", name: "Wallpaper field B", job: "Neutral field, upper right" },
  { token: "--field-c", name: "Wallpaper field C", job: "Teal field behind the decision bar" },
] as const;

export function RoleGrid() {
  // Each token's computed value with var() references substituted: what ships, not what was typed.
  // Tailwind's Lightning CSS pass rewrites an authored oklch() as a hex fallback followed by lab(),
  // so plain tokens read back as lab() while relative-colour tokens keep oklch(from ...).
  const [ref, values] = useMeasure((root) =>
    Object.fromEntries(
      Array.from(root.querySelectorAll<HTMLElement>("[data-swatch]"), (el) => {
        const token = el.dataset.swatch ?? "";
        return [token, getComputedStyle(el).getPropertyValue(token).trim()];
      }),
    ),
  );

  return (
    <div ref={ref} className="flex flex-col">
      {ROLES.map((role) => (
        <div key={role.token} className="flex items-center gap-3 border-t border-border py-2 first:border-t-0">
          <span
            aria-hidden
            data-swatch={role.token}
            className="size-8 shrink-0 rounded-input border border-border"
            style={{ backgroundColor: `var(${role.token})` }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-label">{role.name}</span>
            <span className="text-body-s text-muted-foreground">{role.job}</span>
          </div>
          <div className="flex shrink-0 flex-col items-end font-mono text-micro text-muted-foreground">
            <span>{role.token}</span>
            <span data-computed={role.token}>{values?.[role.token] ?? "measuring"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
