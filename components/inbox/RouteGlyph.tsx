import { CircleCheck, Hand, HeartHandshake, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

export type RouteGlyphKind = "auto" | "draft" | "you" | "wellbeing";

const LABEL: Record<RouteGlyphKind, string> = {
  auto: "Auto",
  draft: "Draft",
  you: "You",
  wellbeing: "Wellbeing",
};

const INK: Record<RouteGlyphKind, string> = {
  auto: "text-risk-low",
  draft: "text-risk-mid-ink",
  you: "text-risk-high",
  wellbeing: "text-risk-high",
};

/**
 * Route is shape-coded so it survives colour blindness and greyscale print (6.6): a circle for Auto,
 * a rounded square for Draft, a hand for You. Colour is the second channel, never the only one.
 *
 * The amber fill measures 2.33:1 on the list pane, below the 3:1 a glyph needs, so the Draft square
 * takes its edge from a 1px amber-ink ring (5.65:1) and its pen from ink (on-risk-mid).
 */
export function RouteGlyph({
  route,
  showLabel = true,
  size = "list",
  className,
}: {
  route: RouteGlyphKind;
  /** "md" shows the label from 768 px and keeps it for screen readers only on a phone. */
  showLabel?: boolean | "md";
  /** "list" = 16px (lists, header pill); "bar" = 18px (decision bar). */
  size?: "list" | "bar";
  className?: string;
}) {
  const box = size === "list" ? "size-4" : "size-4.5";
  const Icon = route === "auto" ? CircleCheck : route === "you" ? Hand : HeartHandshake;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-micro", INK[route], className)}>
      {route === "draft" ? (
        <span
          aria-hidden
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-glyph bg-risk-mid text-on-risk-mid inset-ring inset-ring-risk-mid-ink",
            box,
          )}
        >
          <PenLine className="size-3" strokeWidth={2} />
        </span>
      ) : (
        <Icon aria-hidden className={cn("shrink-0", box)} strokeWidth={1.75} />
      )}
      <span className={showLabel === "md" ? "max-md:sr-only" : showLabel ? undefined : "sr-only"}>{LABEL[route]}</span>
    </span>
  );
}
