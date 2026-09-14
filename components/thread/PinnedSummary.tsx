"use client";

import { Check, ChevronDown, FileText, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/controls/Button";
import { CATEGORY } from "@/components/inbox/CategoryGlyph";
import { RouteGlyph, type RouteGlyphKind } from "@/components/inbox/RouteGlyph";
import { glyphKind } from "@/components/inbox/TicketRow";
import { SOURCE_REGISTRY } from "@/data/sources";
import { formatShortDate } from "@/lib/clock";
import { CONFIDENCE, HARD_RULE_LABEL, routeExplanation, summaryFlags } from "@/lib/summary";
import type { Confidence, Source, Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

const HEADLINE: Record<RouteGlyphKind, string> = {
  you: "Needs your decision",
  wellbeing: "Needs you: wellbeing",
  draft: "Draft waiting for approval",
  auto: "Sent automatically",
};

/**
 * The AI's case file at two reading depths (brief 8.1). Collapsed, it is the three-second read: route,
 * category, confidence in words, the summary, and any evidence problem. "Why this route" opens the
 * thirty-second read: each reason with its evidence and source, the confidence explained, the hard
 * rules hit, the matrix row, and the raw score for audit. Opaque: content is never glass (6.5).
 *
 * Mount with key={ticket.id}: each conversation opens at the three-second read.
 */
export function PinnedSummary({ ticket }: { ticket: Ticket }) {
  const { triage } = ticket;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const kind = glyphKind(triage);
  const flags = summaryFlags(triage);
  const category = CATEGORY[triage.category.primary].label;

  return (
    <section
      aria-label="AI summary"
      data-pinned-summary
      data-open={open}
      className="group/summary pointer-events-auto w-full max-w-168 rounded-card border border-border bg-card"
    >
      <div className="px-4 pt-3 pb-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-label">
            <span aria-hidden className="inline-flex">
              <RouteGlyph route={kind} showLabel={false} />
            </span>
            <span>{HEADLINE[kind]}</span>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span className="text-muted-foreground">
              {category}
              {triage.category.secondary && ` › ${triage.category.secondary}`}
            </span>
          </p>
          <ConfidenceMeter confidence={triage.confidence} />
        </div>

        <p className="mt-1.5 text-body">{triage.summary}</p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <ul className="flex min-w-0 flex-1 flex-col gap-0.5" aria-label="Evidence problems">
            {flags.map((flag) => (
              <li key={flag.text} data-flag={flag.kind} className="flex items-start gap-1.5 text-body-s text-risk-high">
                <TriangleAlert aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.75} />
                {flag.text}
              </li>
            ))}
          </ul>
          <Button
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className="-mr-2 ml-auto px-2 text-muted-foreground"
          >
            Why this route
            <ChevronDown
              aria-hidden
              strokeWidth={1.75}
              className="transition-[rotate] duration-[calc(220ms*var(--motion))] ease-(--ease-soft) group-data-[open=true]/summary:rotate-180"
            />
          </Button>
        </div>
      </div>

      {/* grid-template-rows 0fr → 1fr: the named exception to transform-only motion, so the panel
          opens to its measured height with no max-height guess (brief 10). */}
      <div
        id={panelId}
        inert={!open}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-(--dur-ui) ease-(--ease-soft) group-data-[open=true]/summary:grid-rows-[1fr] motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          <WhyThisRoute ticket={ticket} />
        </div>
      </div>
    </section>
  );
}

function WhyThisRoute({ ticket }: { ticket: Ticket }) {
  const { triage } = ticket;
  const retrieved = new Map(triage.sources.map((s) => [s.id, s]));

  return (
    <div className="border-t border-border px-4 pt-3 pb-3.5">
      <ul aria-label="Reasons" className="flex flex-col gap-2.5">
        {triage.reasons.map((reason) => {
          const source = reason.sourceId ? retrieved.get(reason.sourceId) : undefined;
          return (
            <li key={reason.label} data-caution={reason.caution ?? false} className="flex gap-2.5">
              {reason.caution ? (
                <TriangleAlert aria-hidden className="mt-px size-4 shrink-0 text-risk-high" strokeWidth={1.75} />
              ) : (
                <Check aria-hidden className="mt-px size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              )}
              <div className="min-w-0">
                <p className="text-label">
                  <span className="sr-only">{reason.caution ? "Caution: " : "Supports: "}</span>
                  {reason.label}
                </p>
                <p className="text-body-s break-words text-muted-foreground">{reason.evidence}</p>
                {source && <SourceCitation source={source} />}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-3 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-border pt-3 text-body-s">
        <dt className="text-muted-foreground">Confidence</dt>
        <dd>
          <span className="font-medium">{CONFIDENCE[triage.confidence].label}:</span> {triage.confidenceNote}.{" "}
          <span className="text-micro whitespace-nowrap text-muted-foreground tabular-nums">
            model score {triage.confidenceScore.toFixed(2)}
          </span>
        </dd>

        <dt className="text-muted-foreground">Hard rules</dt>
        <dd>
          {triage.hardRules.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Hard rules hit">
              {triage.hardRules.map((rule) => (
                <li key={rule} className="rounded-full bg-muted px-2 py-px text-micro">
                  {HARD_RULE_LABEL[rule]}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">None hit</span>
          )}
        </dd>

        <dt className="text-muted-foreground">Route</dt>
        <dd>{routeExplanation(triage, { autoSendPaused: ticket.routedWhileAutoSendPaused })}</dd>
      </dl>
    </div>
  );
}

/**
 * The policy or article a reason rests on, with its version and date. A superseded version is struck
 * through and names the newer one (brief 7.5). It becomes a link to the context panel row in step 6.
 */
function SourceCitation({ source }: { source: Source }) {
  const newer = source.supersededBy ? SOURCE_REGISTRY.get(source.supersededBy) : undefined;

  if (newer) {
    return (
      <p data-source={source.id} className="mt-1 flex flex-wrap items-center gap-x-1.5 text-micro">
        <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-risk-high" strokeWidth={1.75} />
        <span className="text-muted-foreground line-through">
          {source.title} {source.version}
        </span>
        <span className="text-risk-high">
          Newer version exists ({newer.version}, {formatShortDate(newer.updatedAt)})
        </span>
      </p>
    );
  }

  return (
    <p data-source={source.id} className="mt-1 flex items-center gap-1.5 text-micro text-muted-foreground">
      <FileText aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 truncate">
        {source.title} {source.version} · updated {formatShortDate(source.updatedAt)}
      </span>
    </p>
  );
}

/**
 * Confidence in words with a three-step meter (8.2). Filled steps are solid ink, empty steps an ink
 * outline, so the level reads in greyscale and never by colour. No percentage in the scan path.
 */
export function ConfidenceMeter({ confidence }: { confidence: Confidence }) {
  const { label, filled } = CONFIDENCE[confidence];
  return (
    <p className="flex shrink-0 items-center gap-2 text-label" data-confidence={confidence}>
      <span>
        <span className="sr-only">Confidence: </span>
        {label}
      </span>
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              "h-3 w-1.5 rounded-xs",
              step <= filled ? "bg-foreground" : "inset-ring inset-ring-muted-foreground",
            )}
          />
        ))}
      </span>
    </p>
  );
}
