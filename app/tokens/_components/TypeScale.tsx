"use client";

import { useMeasure } from "./useMeasure";

const ROLES = [
  { name: "micro", className: "text-micro", use: "Service messages, meta, kbd hints", sample: "Classified: Billing › Refund dispute" },
  { name: "label", className: "text-label", use: "List names, section titles, badges", sample: "Jordan Kim" },
  { name: "body-s", className: "text-body-s", use: "List previews, sidebar values", sample: "Charged after cancelling, wants a refund" },
  { name: "body", className: "text-body", use: "Bubbles, summary, drafts", sample: "Jordan cancelled on 12 Sep and was charged $39.99 on 13 Sep. Wants a refund." },
  { name: "title", className: "text-title", use: "Thread header name, sheet titles", sample: "Jordan Kim" },
  { name: "heading", className: "text-heading", use: "Empty states, quality sheet", sample: "Nothing needs you right now" },
] as const;

type Metrics = { size: string; lineHeight: string; weight: string; tracking: string; family: string };

export function TypeScale() {
  const [ref, metrics] = useMeasure((root) =>
    Object.fromEntries(
      Array.from(root.querySelectorAll<HTMLElement>("[data-type-role]"), (el): [string, Metrics] => {
        const s = getComputedStyle(el);
        return [
          el.dataset.typeRole ?? "",
          {
            size: s.fontSize,
            lineHeight: s.lineHeight,
            weight: s.fontWeight,
            tracking: s.letterSpacing,
            family: s.fontFamily.split(",")[0]?.replaceAll('"', "") ?? "",
          },
        ];
      }),
    ),
  );

  return (
    <div ref={ref} className="flex flex-col rounded-card border border-border bg-card px-5 py-2">
      {ROLES.map((role) => {
        const m = metrics?.[role.name];
        return (
          <div key={role.name} className="grid gap-1 border-t border-border py-3 first:border-t-0 md:grid-cols-4 md:items-baseline md:gap-4">
            <div className="flex flex-col">
              <span className="font-mono text-micro">{role.name}</span>
              <span className="text-micro text-muted-foreground">{role.use}</span>
            </div>
            <p data-type-role={role.name} className={`${role.className} md:col-span-2`}>
              {role.sample}
            </p>
            <span className="font-mono text-micro text-muted-foreground tabular-nums md:text-right">
              {m ? `${m.size} / ${m.lineHeight} · ${m.weight} · ${m.tracking} · ${m.family}` : "measuring"}
            </span>
          </div>
        );
      })}
      <div className="grid gap-1 border-t border-border py-3 md:grid-cols-4 md:items-baseline md:gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-micro">numerals</span>
          <span className="text-micro text-muted-foreground">Timestamps, amounts, counts, SLA timers</span>
        </div>
        <p className="text-body tabular-nums md:col-span-2">18:40 · $39.99 · 1m 40s · 142 auto-resolved</p>
        <span className="font-mono text-micro text-muted-foreground md:text-right">tabular-nums</span>
      </div>
      <div className="grid gap-1 border-t border-border py-3 md:grid-cols-4 md:items-baseline md:gap-4">
        <div className="flex flex-col">
          <span className="font-mono text-micro">mono</span>
          <span className="text-micro text-muted-foreground">Order IDs and transaction references only</span>
        </div>
        <p className="font-mono text-body-s md:col-span-2">ORD-2291-4471 · txn_3NkQ2vLkd8</p>
        <span className="font-mono text-micro text-muted-foreground md:text-right">Geist Mono</span>
      </div>
    </div>
  );
}
