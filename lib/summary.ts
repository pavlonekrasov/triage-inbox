import { SOURCE_REGISTRY } from "@/data/sources";
import { formatShortDate } from "./clock";
import type { Confidence, ContextSection, HardRule, TriageResult } from "./types";

/* What the pinned summary says about a ticket (brief 8.1), kept out of the component so it is tested. */

export const CONFIDENCE: Record<Confidence, { label: string; filled: 1 | 2 | 3 }> = {
  sure: { label: "Sure", filled: 3 },
  likely: { label: "Likely", filled: 2 },
  unsure: { label: "Unsure", filled: 1 },
};

export const HARD_RULE_LABEL: Record<HardRule, string> = {
  money_decision: "Money decision",
  safety_complaint: "Safety complaint",
  privacy_legal: "Privacy request",
  wellbeing: "Wellbeing",
  source_conflict: "Sources disagree",
  stale_source: "Outdated source",
  instruction_in_message: "Instruction in message",
  reopened: "Reopened",
};

type RouteFields = Pick<TriageResult, "route" | "risk" | "confidence" | "hardRules">;

/** The routing matrix row that decided this ticket, as one sentence (brief 8.3). */
export function routeExplanation(triage: RouteFields, { autoSendPaused = false } = {}): string {
  if (triage.hardRules.length > 0) {
    return "A hard rule sends the case to a person, whatever the confidence.";
  }
  if (triage.risk === "high") return "High risk sends the case to a person.";
  if (triage.risk === "medium") return "Medium risk: a person approves the reply before it is sent.";
  if (triage.confidence !== "sure") {
    return `Low risk, but ${CONFIDENCE[triage.confidence].label} rather than Sure: a person approves the reply first.`;
  }
  return autoSendPaused
    ? "Low risk and Sure, but auto-send is paused for the policy v4 rollout, so the reply waits for approval."
    : "Low risk and Sure, so the reply was sent automatically.";
}

export type SummaryFlag = {
  kind: "source_conflict" | "stale_source";
  text: string;
  /** Where the evidence sits in the context panel: the section, and the row to bring into view. */
  section: ContextSection;
  target: string;
};

/**
 * Evidence problems that change how far the AI's work can be trusted. They show on the collapsed
 * card, not only under "Why this route", because they decide whether the draft can be used at all
 * (review gate 15).
 */
export function summaryFlags(triage: Pick<TriageResult, "hardRules" | "sources">): SummaryFlag[] {
  const flags: SummaryFlag[] = [];
  if (triage.hardRules.includes("source_conflict")) flags.push({ kind: "source_conflict", text: "Sources disagree", section: "billing", target: "billing-conflict" });

  const stale = triage.sources.filter((s) => s.supersededBy);
  for (const source of stale) {
    const newer = source.supersededBy ? SOURCE_REGISTRY.get(source.supersededBy) : undefined;
    flags.push({
      kind: "stale_source",
      section: "sources",
      target: `source:${source.id}`,
      text: newer
        ? `${source.title} ${source.version} is outdated: ${newer.version} published ${formatShortDate(newer.updatedAt)}`
        : `${source.title} ${source.version} is outdated`,
    });
  }
  if (stale.length === 0 && triage.hardRules.includes("stale_source")) {
    flags.push({ kind: "stale_source", text: "A source used is outdated", section: "sources", target: "sources" });
  }
  return flags;
}
