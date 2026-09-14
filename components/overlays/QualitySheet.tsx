"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ChevronRight, X } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "@/components/controls/Button";
import { useDesk } from "@/components/desk/desk-store";
import {
  DOWNSTREAM,
  formatChange,
  formatMetric,
  PAIRED,
  QUALITY_DAYS,
  SPEED_AND_SATISFACTION,
  TODAY,
  type Metric,
} from "@/data/metrics";
import { DEMO_NOW, formatShortDate } from "@/lib/clock";
import { cn } from "@/lib/utils";
import { BACKDROP, POPUP } from "./overlay-classes";

const DAY_MS = 86_400_000;
const LAST = QUALITY_DAYS - 1;

/** "1 Sep" for the first day of the series, "Today" for the last, in the desk's own date format. */
const dayLabel = (index: number) =>
  index === LAST ? "Today" : formatShortDate(new Date(DEMO_NOW - (LAST - index) * DAY_MS).toISOString());

/**
 * The quality view (brief 13): one sheet, opened from the list footer. Rows, not hero numbers: each
 * metric shows today's value, a 14-day sparkline and one line on what moves it. Auto-resolution shares
 * one block with its counter-metric, so neither is read alone. Charts are drawn in ink only; no risk
 * colour appears here (brief 13), and every value is also in the table view.
 */
export function QualitySheet() {
  const { state, dispatch } = useDesk();
  const open = state.overlay === "quality";
  const [view, setView] = useState<"rows" | "table">("rows");
  const [downstreamOpen, setDownstreamOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const close = () => dispatch({ type: "setOverlay", overlay: null });
  // Mark as wrong (step 5) feeds the counter-metric's row.
  const markedWrong = TODAY.markedWrongCount + Object.keys(state.markedWrong).length;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={BACKDROP} />
        <Dialog.Popup
          initialFocus={body}
          data-quality-sheet
          className={cn(
            POPUP,
            "fixed top-1/2 left-1/2 flex max-h-[min(48rem,calc(100dvh-2rem))] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col",
          )}
        >
          {/* On a phone the view switch wraps to its own full-width row under the title. */}
          <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border py-2 pr-2 pl-5 max-sm:pb-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-title">Quality today</Dialog.Title>
              <Dialog.Description className="text-micro text-muted-foreground">
                The whole desk · last 14 days, from {dayLabel(0)} to today
              </Dialog.Description>
            </div>
            <Button
              variant="outline"
              aria-pressed={view === "table"}
              onClick={() => setView((v) => (v === "table" ? "rows" : "table"))}
              className="max-sm:order-last max-sm:mr-3 max-sm:w-full"
            >
              {view === "table" ? "Show sparklines" : "Show as a table"}
            </Button>
            <Button iconOnly aria-label="Close the quality view" title="Close (Esc)" onClick={close}>
              <X aria-hidden strokeWidth={1.75} />
            </Button>
          </header>

          {/* Focus opens on the rows, not on a control: the sheet is for reading, and the keys then scroll it. */}
          <div ref={body} tabIndex={-1} className="overflow-y-auto overscroll-contain px-5 pt-4 pb-5 outline-none">
            {view === "table" ? (
              <MetricTable />
            ) : (
              <div className="flex flex-col gap-5">
                <section aria-labelledby="quality-pair">
                  <h3 id="quality-pair" className="text-label">
                    Automation and its cost
                  </h3>
                  <p className="mb-2 text-body-s text-muted-foreground">
                    Read together: a higher auto-resolution rate only counts while reopens stay low.
                  </p>
                  <div data-quality-pair className="rounded-card border border-border">
                    <MetricRow metric={PAIRED[0]} />
                    <MetricRow
                      metric={PAIRED[1]}
                      detail={`${markedWrong} ${markedWrong === 1 ? "reply" : "replies"} marked wrong today`}
                      divided
                    />
                  </div>
                </section>

                <section aria-labelledby="quality-speed">
                  <h3 id="quality-speed" className="mb-2 text-label">
                    Speed and satisfaction
                  </h3>
                  <div className="rounded-card border border-border">
                    {SPEED_AND_SATISFACTION.map((metric, i) => (
                      <MetricRow key={metric.id} metric={metric} divided={i > 0} />
                    ))}
                  </div>
                </section>

                <section>
                  <Button
                    aria-expanded={downstreamOpen}
                    aria-controls="quality-downstream"
                    onClick={() => setDownstreamOpen((o) => !o)}
                    className="-ml-3 gap-1.5"
                  >
                    <ChevronRight aria-hidden strokeWidth={1.75} className={cn(downstreamOpen && "rotate-90")} />
                    {downstreamOpen ? "Hide" : "Show"} downstream signals, not targets
                  </Button>
                  {downstreamOpen && (
                    <div id="quality-downstream" className="mt-2 rounded-card border border-border">
                      {DOWNSTREAM.map((metric, i) => (
                        <MetricRow key={metric.id} metric={metric} divided={i > 0} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MetricRow({ metric, detail, divided = false }: { metric: Metric; detail?: string; divided?: boolean }) {
  const reading = [metric.aside, `${formatChange(metric)} in 14 days`, detail].filter(Boolean).join(" · ");
  return (
    <div
      data-metric={metric.id}
      className={cn(
        "grid items-center gap-x-5 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]",
        divided && "border-t border-border",
      )}
    >
      <div className="min-w-0">
        <p className="text-label">{metric.label}</p>
        {/* Proportional figures: a standalone value, not a column of numbers. */}
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-heading">{formatMetric(metric.kind, metric.series[LAST])}</span>
          <span className="text-micro text-muted-foreground">{reading}</span>
        </p>
        <p className="mt-0.5 text-body-s text-muted-foreground">{metric.moves}</p>
      </div>
      <Sparkline metric={metric} />
    </div>
  );
}

const WIDTH = 168;
/** 44 px: the chart is focusable, so it is also a touch target (brief 7.2). */
const HEIGHT = 44;
/** Room for the 8 px end dot and its 2 px surface ring at the plot's edges. */
const INSET = 6;

/**
 * One series in ink: a 2 px line in muted ink, and today as an 8 px dot in full ink with a 2 px ring of
 * the sheet's surface. No axes and no legend; the row names the series. The hover layer is a crosshair
 * that snaps to the nearest day, and the same readout follows the arrow keys when the chart has focus.
 */
function Sparkline({ metric }: { metric: Metric }) {
  const [active, setActive] = useState<number | null>(null);
  const { series } = metric;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const x = (i: number) => INSET + (i * (WIDTH - 2 * INSET)) / LAST;
  const y = (v: number) => (hi === lo ? HEIGHT / 2 : INSET + ((hi - v) * (HEIGHT - 2 * INSET)) / (hi - lo));
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const dot = active ?? LAST;
  const value = (i: number) => formatMetric(metric.kind, series[i]);

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * WIDTH;
    setActive(Math.min(LAST, Math.max(0, Math.round(((px - INSET) / (WIDTH - 2 * INSET)) * LAST))));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const to =
      event.key === "ArrowLeft" ? (active ?? LAST) - 1
      : event.key === "ArrowRight" ? (active ?? LAST) + 1
      : event.key === "Home" ? 0
      : event.key === "End" ? LAST
      : null;
    if (to === null) return;
    event.preventDefault();
    setActive(Math.min(LAST, Math.max(0, to)));
  };

  return (
    <div className="relative w-42 shrink-0">
      <svg
        role="img"
        tabIndex={0}
        aria-label={`${metric.label} over 14 days: ${value(0)} on ${dayLabel(0)}, ${value(LAST)} today. Arrow keys read each day.`}
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block touch-pan-y overflow-visible rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(LAST)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        {active !== null && <line x1={x(active)} x2={x(active)} y1={0} y2={HEIGHT} strokeWidth={1} className="stroke-border" />}
        <polyline
          points={points}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-muted-foreground"
        />
        <circle cx={x(dot)} cy={y(series[dot])} r={4} strokeWidth={2} className="fill-foreground stroke-popover" />
      </svg>
      <span className="sr-only" aria-live="polite">
        {active !== null && `${dayLabel(active)}: ${value(active)}`}
      </span>
      {active !== null && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 rounded-input border border-border bg-popover px-2 py-1 text-center whitespace-nowrap"
          style={{ left: x(active) }}
        >
          <span className="block text-label">{value(active)}</span>
          <span className="block text-micro text-muted-foreground">{dayLabel(active)}</span>
        </span>
      )}
    </div>
  );
}

/** The table view: every value the sparklines draw, newest day first. */
function MetricTable() {
  const metrics = [...PAIRED, ...SPEED_AND_SATISFACTION, ...DOWNSTREAM];
  const days = Array.from({ length: QUALITY_DAYS }, (_, k) => LAST - k);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-s tabular-nums">
        <caption className="sr-only">Desk quality for the last 14 days, newest first</caption>
        <thead>
          <tr className="border-b border-border text-micro text-muted-foreground">
            <th scope="col" className="py-2 pr-4 text-left font-medium">
              Day
            </th>
            {metrics.map((metric) => (
              <th key={metric.id} scope="col" className="min-w-24 py-2 pr-4 text-right align-bottom font-medium last:pr-0">
                {metric.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-1.5 pr-4 text-left font-normal whitespace-nowrap text-muted-foreground">
                {dayLabel(day)}
              </th>
              {metrics.map((metric) => (
                <td key={metric.id} className="py-1.5 pr-4 text-right whitespace-nowrap last:pr-0">
                  {formatMetric(metric.kind, metric.series[day])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
