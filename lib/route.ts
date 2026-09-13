import type { Confidence, HardRule, Lane, Risk, Route, TriageResult } from "./types";

export interface RoutingSignals {
  risk: Risk;
  confidence: Confidence;
  hardRules: readonly HardRule[];
}

/**
 * The routing matrix (brief 8.3), checked in order:
 *
 *   any hard rule hit                   → human_led
 *   risk high                           → human_led
 *   risk medium                         → approve_draft
 *   risk low and confidence sure        → auto_send
 *   risk low and confidence likely|unsure → approve_draft
 *
 * Confidence never promotes a case past a hard rule.
 * A paused auto-send turns auto_send into approve_draft: it can only add review, never remove it.
 */
export function routeFor(
  { risk, confidence, hardRules }: RoutingSignals,
  { autoSendPaused = false }: { autoSendPaused?: boolean } = {},
): Route {
  if (hardRules.length > 0) return "human_led";
  if (risk === "high") return "human_led";
  if (risk === "medium") return "approve_draft";
  if (confidence !== "sure") return "approve_draft";
  return autoSendPaused ? "approve_draft" : "auto_send";
}

export function laneFor(route: Route): Lane {
  if (route === "human_led") return "needs_you";
  if (route === "approve_draft") return "drafts";
  return "auto_resolved";
}

/** Hard rules that take Approve, bulk selection and auto-send away from a ticket by every path (review gate 9). */
export const NO_APPROVAL_RULES = [
  "wellbeing",
  "safety_complaint",
  "privacy_legal",
  "source_conflict",
  "instruction_in_message",
] as const satisfies readonly HardRule[];

type NoApprovalRule = (typeof NO_APPROVAL_RULES)[number];

const BLOCK_REASON: Record<NoApprovalRule, string> = {
  wellbeing: "Approve is off for wellbeing cases. Take over instead.",
  safety_complaint: "Approve is off for safety complaints. Acknowledge and open a review instead.",
  privacy_legal: "Approve is off for privacy requests. The privacy team confirms each step.",
  source_conflict: "Approve is off while sources disagree. Decide which record is right first.",
  instruction_in_message: "Approve is off for messages that contain instructions to the AI.",
};

export function approvalBlock(triage: Pick<TriageResult, "hardRules">): { rule: NoApprovalRule; reason: string } | null {
  const rule = NO_APPROVAL_RULES.find((r) => triage.hardRules.includes(r));
  return rule ? { rule, reason: BLOCK_REASON[rule] } : null;
}

type BulkFields = Pick<TriageResult, "route" | "hardRules" | "drafts" | "risk" | "confidence">;

/** A draft a person may tick for bulk approval. Click, X and ⇧X all go through this check. */
export function canBulkSelect(triage: BulkFields): boolean {
  return (
    triage.route === "approve_draft" &&
    triage.hardRules.length === 0 &&
    approvalBlock(triage) === null &&
    triage.drafts.length > 0
  );
}

/** What ⇧X selects: low-risk, Sure drafts, and nothing else. */
export function isSureLowRiskDraft(triage: BulkFields): boolean {
  return canBulkSelect(triage) && triage.risk === "low" && triage.confidence === "sure";
}
