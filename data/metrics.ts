/*
 * Desk-wide quality numbers (brief 13). Each metric carries 14 days, oldest first, and the last point
 * is today, so the footer line, the sheet's values and its sparklines cannot disagree.
 */

export type MetricKind = "ratio" | "seconds" | "minutes";

export interface Metric {
  id: "auto" | "reopen" | "first-response" | "resolution" | "csat" | "refund" | "cancellation";
  label: string;
  kind: MetricKind;
  /** 14 days, oldest first; the last point is today. */
  series: readonly number[];
  /** A second reading of today, shown after the value. */
  aside?: string;
  /** What moves it, in one line. */
  moves: string;
}

export const QUALITY_DAYS = 14;

const AUTO: Metric = {
  id: "auto",
  label: "Auto-resolution rate",
  kind: "ratio",
  series: [0.61, 0.62, 0.6, 0.63, 0.64, 0.63, 0.65, 0.66, 0.64, 0.66, 0.67, 0.66, 0.67, 0.68],
  moves: "Rises as more low-risk, Sure cases pass the hard rules; the paused auto-send for policy v4 holds it down.",
};

const REOPEN: Metric = {
  id: "reopen",
  label: "Reopened or escalated after auto",
  kind: "ratio",
  series: [0.026, 0.025, 0.027, 0.024, 0.024, 0.025, 0.023, 0.022, 0.024, 0.022, 0.021, 0.022, 0.02, 0.021],
  moves: "Rises when automatic replies miss the question. Every reopened case and every Mark as wrong counts.",
};

const FIRST_RESPONSE: Metric = {
  id: "first-response",
  label: "First response time",
  kind: "seconds",
  series: [132, 128, 141, 125, 119, 122, 116, 111, 118, 108, 104, 106, 98, 100],
  aside: "median · 90th percentile 5m 12s",
  moves: "Moves with the depth of Needs you and how long drafts wait for approval.",
};

const RESOLUTION: Metric = {
  id: "resolution",
  label: "Time to resolution",
  kind: "minutes",
  series: [34, 33, 36, 31, 30, 31, 29, 28, 30, 27, 27, 26, 25, 26],
  aside: "median",
  moves: "Moves with escalations and replies waiting on another team.",
};

const CSAT: Metric = {
  id: "csat",
  label: "Customer satisfaction",
  kind: "ratio",
  series: [0.88, 0.88, 0.87, 0.88, 0.89, 0.89, 0.9, 0.9, 0.89, 0.9, 0.91, 0.9, 0.91, 0.91],
  aside: "satisfied, last 7 days",
  moves: "Follows reopened cases and refund decisions, about a week behind them.",
};

const REFUND: Metric = {
  id: "refund",
  label: "Refund rate",
  kind: "ratio",
  series: [0.036, 0.035, 0.037, 0.036, 0.035, 0.034, 0.035, 0.034, 0.033, 0.034, 0.034, 0.033, 0.034, 0.034],
  moves: "Moves with billing disputes decided in Needs you.",
};

const CANCELLATION: Metric = {
  id: "cancellation",
  label: "Cancellation rate",
  kind: "ratio",
  series: [0.055, 0.054, 0.056, 0.055, 0.053, 0.054, 0.053, 0.052, 0.053, 0.052, 0.052, 0.051, 0.052, 0.052],
  moves: "Moves with product and pricing more than with support.",
};

/** Auto-resolution and its counter-metric are one pair, so neither is read alone (brief 13). */
export const PAIRED: readonly [Metric, Metric] = [AUTO, REOPEN];
export const SPEED_AND_SATISFACTION: readonly Metric[] = [FIRST_RESPONSE, RESOLUTION, CSAT];
/** Collapsed in the sheet and labelled as downstream signals, not targets. */
export const DOWNSTREAM: readonly Metric[] = [REFUND, CANCELLATION];

const today = (metric: Metric) => metric.series[metric.series.length - 1];

/** Today's desk-wide numbers, read from the series above. */
export const TODAY = {
  autoResolutionRate: today(AUTO),
  firstResponseMedianSeconds: today(FIRST_RESPONSE),
  reopenRate: today(REOPEN),
  autoResolvedCount: 142,
  spotCheckSampleCount: 7,
  /** Replies marked wrong earlier today, before this desk session. */
  markedWrongCount: 3,
} as const;

/** 0.68 → "68%", 0.021 → "2.1%". */
export const formatPercent = (ratio: number) => `${Number((ratio * 100).toFixed(1))}%`;

/** 100 → "1m 40s". */
export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

export function formatMetric(kind: MetricKind, value: number) {
  if (kind === "ratio") return formatPercent(value);
  if (kind === "seconds") return formatDuration(value);
  return `${value}m`;
}

/** The change across the 14 days in words: "up 7 points", "down 32s", "no change". */
export function formatChange(metric: Metric) {
  const delta = today(metric) - metric.series[0];
  if (Math.abs(delta) < 1e-9) return "no change";
  const direction = delta > 0 ? "up" : "down";
  const size = Math.abs(delta);
  if (metric.kind === "ratio") return `${direction} ${Number((size * 100).toFixed(1))} points`;
  if (metric.kind === "seconds") return `${direction} ${size < 60 ? `${size}s` : formatDuration(size)}`;
  return `${direction} ${size}m`;
}
