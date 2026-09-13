import { RouteGlyph, type RouteGlyphKind } from "@/components/inbox/RouteGlyph";

const ROUTES: { route: RouteGlyphKind; meaning: string }[] = [
  { route: "auto", meaning: "Auto-send: low risk, Sure, no hard rule" },
  { route: "draft", meaning: "Approve draft: medium risk, or low risk with doubt" },
  { route: "you", meaning: "Human-led: high risk or a hard rule" },
  { route: "wellbeing", meaning: "Wellbeing: human-led, pinned to the top" },
];

/** Shows each glyph in colour and in greyscale side by side, so shape coding is checkable at a glance. */
export function RouteGlyphSpecimen() {
  return (
    <div className="flex flex-col">
      {ROUTES.map(({ route, meaning }) => (
        <div key={route} className="flex items-center gap-4 border-t border-border py-2.5 first:border-t-0">
          <RouteGlyph route={route} className="w-24" />
          <RouteGlyph route={route} showLabel={false} size="bar" />
          <span className="grayscale">
            <RouteGlyph route={route} showLabel={false} />
          </span>
          <span className="min-w-0 flex-1 text-body-s text-muted-foreground">{meaning}</span>
        </div>
      ))}
      <p className="pt-2 text-micro text-muted-foreground">Columns: list size with label, decision bar size, greyscale.</p>
    </div>
  );
}
