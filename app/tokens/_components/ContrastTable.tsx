"use client";

import { Check, X } from "lucide-react";
import { contrastRatio, createCompositor, resolveColor } from "@/lib/contrast";
import { cn } from "@/lib/utils";
import type { ContrastPair } from "../_data";
import { useMeasure } from "./useMeasure";

type Verdict = "Pass" | "Fail" | "Info" | "Unmeasured";

function verdictFor(pair: ContrastPair, ratio: number | null | undefined): Verdict {
  if (ratio == null) return "Unmeasured";
  if (pair.min === null) return "Info";
  return ratio >= pair.min ? "Pass" : "Fail";
}

/** Truncates, never rounds up, so a displayed 4.50 always means at least 4.50. */
const display = (ratio: number) => (Math.floor(ratio * 100) / 100).toFixed(2);

export function ContrastTable({ pairs }: { pairs: ContrastPair[] }) {
  const [ref, ratios] = useMeasure((root) => {
    const probe = root.querySelector<HTMLElement>("[data-probe]");
    if (!probe) return [];
    const paint = createCompositor();
    return pairs.map((pair) => {
      const bg = pair.bg.map((token) => resolveColor(probe, token));
      const fg = resolveColor(probe, pair.fg);
      if (fg === null || bg.some((c) => c === null)) return null;
      const layers = bg as string[];
      const ground = paint(layers);
      const ink = paint([...layers, fg]);
      return ground && ink ? contrastRatio(ink, ground) : null;
    });
  });

  const verdicts = pairs.map((pair, i) => verdictFor(pair, ratios?.[i]));
  const graded = verdicts.filter((v) => v === "Pass" || v === "Fail").length;
  const passed = verdicts.filter((v) => v === "Pass").length;

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <span data-probe hidden />
      <p className="text-label" data-contrast-summary={`${passed}/${graded}`}>
        {ratios ? `${passed} of ${graded} graded pairs pass` : "Measuring"}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-md border-collapse text-body-s">
          <thead>
            <tr className="text-micro text-muted-foreground">
              <th scope="col" className="py-1.5 pr-3 text-left font-medium">Pair</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">Ratio</th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">Needs</th>
              <th scope="col" className="py-1.5 text-left font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, i) => {
              const ratio = ratios?.[i];
              const verdict = verdicts[i];
              return (
                <tr
                  key={pair.label}
                  data-verdict={verdict}
                  data-ratio={ratio == null ? undefined : display(ratio)}
                  className="border-t border-border"
                >
                  <td className="py-1.5 pr-3">
                    <span className="flex items-center gap-2.5">
                      <Sample pair={pair} />
                      {pair.label}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{ratio == null ? "…" : display(ratio)}</td>
                  <td className="py-1.5 pr-3 text-right text-muted-foreground tabular-nums">
                    {pair.min === null ? "n/a" : `${pair.min}:1`}
                  </td>
                  <td className="py-1.5">
                    <span className={cn("inline-flex items-center gap-1", verdict === "Fail" && "font-semibold")}>
                      {verdict === "Pass" && <Check aria-hidden className="size-4" strokeWidth={1.75} />}
                      {verdict === "Fail" && <X aria-hidden className="size-4" strokeWidth={2.25} />}
                      {verdict}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The pair painted with the real tokens: "Aa" for text pairs, a ring for glyph pairs. */
function Sample({ pair }: { pair: ContrastPair }) {
  const mark =
    pair.min === 3 ? (
      <span className="size-3 rounded-full inset-ring-2" style={{ color: `var(${pair.fg})` }} />
    ) : (
      <span className="text-label" style={{ color: `var(${pair.fg})` }}>
        Aa
      </span>
    );
  const painted = pair.bg.reduceRight(
    (child, token) => (
      <span className="flex size-full items-center justify-center" style={{ backgroundColor: `var(${token})` }}>
        {child}
      </span>
    ),
    mark,
  );
  return (
    <span aria-hidden className="h-6 w-9 shrink-0 overflow-hidden rounded-md border border-border">
      {painted}
    </span>
  );
}
