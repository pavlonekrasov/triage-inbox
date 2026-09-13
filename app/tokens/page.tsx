import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ContrastTable } from "./_components/ContrastTable";
import { GlassSpecimen } from "./_components/GlassSpecimen";
import { MotionTokens } from "./_components/MotionTokens";
import { RoleGrid } from "./_components/RoleGrid";
import { RouteGlyphSpecimen } from "./_components/RouteGlyphSpecimen";
import { Section } from "./_components/Section";
import { SurfaceSpecimen } from "./_components/SurfaceSpecimen";
import { ThemePair } from "./_components/ThemePair";
import { TypeScale } from "./_components/TypeScale";
import { contrastPairs } from "./_data";

export const metadata: Metadata = { title: "Tokens" };

export default function TokensPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-micro text-muted-foreground">Care Desk · concept · delivery step 1</p>
          <h1 className="text-heading">Tokens</h1>
          <p className="max-w-prose text-body-s text-muted-foreground">
            Every colour role in Day and Night shift. Contrast is measured in this browser: each pair is
            painted on a canvas, which blends alpha the way CSS does, then scored with the WCAG 2 formula.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Contrast" note="Text needs 4.5:1. Glyphs and the focus ring need 3:1. Ratios are truncated, never rounded up.">
        <ThemePair>
          <ContrastTable pairs={contrastPairs} />
        </ThemePair>
      </Section>

      <Section title="Colour roles" note="Values are read back from computed styles in each theme scope. Tokens are authored in OKLCH; the build ships each one as a hex fallback followed by lab(), the same colour in another space.">
        <ThemePair>
          <RoleGrid />
        </ThemePair>
      </Section>

      <Section title="Route glyphs" note="Shape and label first, colour second. The third column is greyscale.">
        <ThemePair ground="sidebar">
          <RouteGlyphSpecimen />
        </ThemePair>
      </Section>

      <Section
        title="Glass over the thread wallpaper"
        note="The four surfaces allowed to be glass, over static fields in the Weightless hues. Bubbles, panels and popovers stay opaque."
      >
        <ThemePair>
          <GlassSpecimen />
        </ThemePair>
      </Section>

      <Section title="Surfaces and bubbles" note="Three tonal layers. Customer, draft and sent bubbles on the wallpaper.">
        <ThemePair>
          <SurfaceSpecimen />
        </ThemePair>
      </Section>

      <Section title="Type scale" note="Geist 400, 500 and 600 at fixed rem sizes. Metrics are read from computed styles.">
        <TypeScale />
      </Section>

      <Section title="Motion vocabulary" note="Read from :root. Nothing invents its own curve.">
        <MotionTokens />
      </Section>
    </main>
  );
}
