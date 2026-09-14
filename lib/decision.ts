import { approvalBlock } from "./route";
import type { Ticket, TriageResult } from "./types";

/*
 * What the decision bar offers for one ticket (brief 9.1). The primary button always names what will
 * happen, and it changes with the route. "Approve" means sending the AI's text as written with one
 * action; only drafts routed for approval get it. Every other case needs a person's judgment first:
 * choosing an outcome, taking over, acknowledging, or reading the reply in the composer.
 */

type Draft = TriageResult["drafts"][number];

export type PrimaryKind =
  | "approve" // approve_draft: send the AI's draft as written
  | "send-variant" // two drafts: the person chooses the outcome, then sends it
  | "take-over" // wellbeing: no draft until a person takes over
  | "acknowledge" // safety: a fixed acknowledgment, and a review opens
  | "review-send" // other human-led drafts: read and send them from the composer
  | "follow-up" // already answered
  | "retry" // the send failed
  | "write" // no draft to start from
  | "drafting"; // the AI is still writing: the bar offers Escalate only

/** Offline, a reply that leaves its undo window is "queued" until the desk reconnects. */
export type OutgoingStatus = "undoable" | "queued" | "sending" | "sent" | "failed";

/** A conversation's AI draft that is not ready (brief 12): still generating, or the model gave up. */
export type DraftStatus = "drafting" | "failed";

/** A retried draft arrives after this long in the prototype. */
export const DRAFT_RETRY_MS = 2400;

/** Drafting and draft failure apply to conversations the AI writes a reply for, not to ones it already answered. */
export const canSimulateDraft = (ticket: Ticket) => ticket.triage.route !== "auto_send" && ticket.triage.drafts.length > 0;

const DRAFTING = "The AI is still drafting this reply. Escalate now, or wait for the draft.";

export interface DecisionContext {
  /** The variant a person chose on a two-draft case. */
  chosenDraftId?: string | null;
  takenOver?: boolean;
  /** The state of a reply a person already sent from this desk. */
  outgoing?: OutgoingStatus | null;
  /** The AI draft is still generating, or failed. */
  draft?: DraftStatus | null;
}

export interface Decision {
  primary: { kind: PrimaryKind; label: string; blocked: string | null };
  /** The draft the primary and Edit act on. */
  draft: Draft | null;
  /** Two-outcome cases: the segmented control's options. */
  variants: { id: string; label: string }[];
  /** null when the bar shows no Edit button at all. */
  edit: { label: string; blocked: string | null } | null;
  /** Auto-sent replies can be marked wrong, which feeds the quality review. */
  markWrong: boolean;
}

const FIXED_ACK = "The acknowledgment is fixed wording. The review itself happens with Trust & Safety.";

export function decisionFor(ticket: Ticket, ctx: DecisionContext = {}): Decision {
  const { triage } = ticket;
  const drafts = triage.drafts;
  const base = { draft: null, variants: [], edit: null, markWrong: false } satisfies Omit<Decision, "primary">;

  if (ctx.outgoing === "failed") {
    return { ...base, primary: { kind: "retry", label: "Retry sending", blocked: null }, edit: { label: "Edit reply", blocked: null } };
  }
  if (ctx.outgoing) {
    // A follow-up waits for the reply before it, so the customer never gets them out of order.
    const blocked =
      ctx.outgoing === "sent" ? null
      : ctx.outgoing === "queued" ? "Your reply is queued until you reconnect. Follow up once it's delivered."
      : "Your reply is still sending. Follow up once it's delivered.";
    return { ...base, primary: { kind: "follow-up", label: "Follow up", blocked } };
  }
  if (triage.route === "auto_send") {
    return { ...base, primary: { kind: "follow-up", label: "Follow up", blocked: null }, markWrong: true };
  }

  // Without a draft the case falls to a person (brief 12): while it generates only Escalate is on offer; once it fails, the reply is written by hand.
  if (ctx.draft === "drafting") return { ...base, primary: { kind: "drafting", label: "Drafting reply", blocked: DRAFTING } };
  if (ctx.draft === "failed") return { ...base, primary: { kind: "write", label: "Write a reply", blocked: null } };

  if (triage.hardRules.includes("wellbeing")) {
    return ctx.takenOver
      ? { ...base, primary: { kind: "write", label: "Write a reply", blocked: null } }
      : { ...base, primary: { kind: "take-over", label: "Take over conversation", blocked: null } };
  }

  // No Edit button: the acknowledgment cannot change, so the bar spends no width on a refusal. E still explains.
  if (triage.hardRules.includes("safety_complaint") && drafts[0]) {
    return {
      ...base,
      draft: drafts[0],
      primary: { kind: "acknowledge", label: "Acknowledge & open review", blocked: null },
    };
  }

  if (drafts.length > 1) {
    const chosen = drafts.find((d) => d.id === ctx.chosenDraftId) ?? null;
    const names = drafts.map((d) => d.variant ?? "Reply").join(" or ");
    const choose = `Choose ${names} first. The AI wrote both; the decision is yours.`;
    return {
      ...base,
      draft: chosen,
      variants: drafts.map((d) => ({ id: d.id, label: d.variant ?? "Reply" })),
      primary: chosen
        ? { kind: "send-variant", label: `Send ${(chosen.variant ?? "this").toLowerCase()} reply`, blocked: null }
        : { kind: "send-variant", label: "Choose a reply to send", blocked: choose },
      edit: { label: "Edit draft", blocked: chosen ? null : choose },
    };
  }

  if (!drafts[0]) return { ...base, primary: { kind: "write", label: "Write a reply", blocked: null } };

  if (triage.route === "human_led") {
    return { ...base, draft: drafts[0], primary: { kind: "review-send", label: "Edit & send reply", blocked: null } };
  }

  return {
    ...base,
    draft: drafts[0],
    primary: { kind: "approve", label: "Approve & send", blocked: null },
    edit: { label: "Edit draft", blocked: null },
  };
}

/**
 * Why A (approve) does nothing on this ticket, in words, or null when it approves. A refused
 * shortcut always explains itself (brief 9.2).
 */
export function approveBlocked(ticket: Ticket, ctx: DecisionContext = {}): string | null {
  const decision = decisionFor(ticket, ctx);
  const rule = approvalBlock(ticket.triage)?.reason ?? null;
  switch (decision.primary.kind) {
    case "approve":
      return null;
    case "retry":
      return "This reply wasn't sent. Retry sending, or edit it first.";
    case "follow-up":
      return ctx.outgoing ? "This reply is already sent. Follow up instead." : "This reply was sent automatically. Follow up instead.";
    case "drafting":
      return DRAFTING;
    case "write":
      if (ctx.draft === "failed") return "The AI couldn't draft this reply. Write one yourself instead.";
      return ctx.takenOver
        ? "You're writing this reply yourself, so there's nothing to approve."
        : "There's no draft to approve. Write a reply instead.";
    case "send-variant":
      return `Approve is off for this decision. Choose ${decision.variants.map((v) => v.label).join(" or ")}, then send it.`;
    case "take-over":
    case "acknowledge":
      return rule;
    case "review-send":
      return rule ?? "Approve is off for cases that need your decision. Edit the reply and send it yourself.";
  }
}

/** What E (edit) opens, or why it cannot. */
export function editTarget(ticket: Ticket, ctx: DecisionContext = {}): { draft: Draft } | { blocked: string } {
  const decision = decisionFor(ticket, ctx);
  if (decision.primary.kind === "acknowledge") return { blocked: FIXED_ACK };
  if (decision.edit?.blocked) return { blocked: decision.edit.blocked };
  if (decision.draft && (decision.edit || decision.primary.kind === "review-send")) return { draft: decision.draft };
  switch (decision.primary.kind) {
    case "take-over":
      return { blocked: "There's no draft for a wellbeing case. Take over to write in your own words." };
    case "drafting":
      return { blocked: "The AI is still drafting. There's nothing to edit yet." };
    case "follow-up":
      return { blocked: "This reply is already sent. Follow up instead." };
    default:
      return { blocked: "There's no draft to edit. Write a reply instead." };
  }
}
