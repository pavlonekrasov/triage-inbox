import { DEMO_NOW, deskDayKey, formatDayLabel } from "./clock";
import type { OutgoingStatus } from "./decision";
import type { Message, Ticket, TriageResult } from "./types";

export type TimelineStep = TriageResult["steps"][number];
export type TimelineDraft = TriageResult["drafts"][number];

/** A reply sent from this desk, from its undo window to delivered or failed. */
export interface TimelineReply {
  /** Unique per reply on the ticket. */
  id: string;
  body: string;
  language: string;
  /** The AI draft it came from. The reply takes that draft's key, so the bubble changes in place. */
  draftId: string | null;
  edited: boolean;
  at: string;
  status: OutgoingStatus;
}

/** What the specialist has done to a ticket at the desk, laid over the fixture. */
export interface TimelineOverlay {
  /** Replies sent from this desk, oldest first: the reply, then any follow-ups. */
  replies?: readonly TimelineReply[];
  /** On a two-variant case, the variant a person chose. Until then both drafts show. */
  chosenDraftId?: string | null;
  /** The draft open in the composer is not shown a second time in the thread. */
  editingDraftId?: string | null;
  /** Service messages recording the specialist's actions. */
  events?: readonly { at: string; text: string }[];
}

export type TimelineItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "message"; key: string; message: Message }
  | { kind: "steps"; key: string; steps: TimelineStep[] }
  | { kind: "spot-check"; key: string }
  | { kind: "draft"; key: string; draft: TimelineDraft; variantCount: number }
  | { kind: "reply"; key: string; reply: TimelineReply }
  | { kind: "event"; key: string; at: string; text: string };

type Entry =
  | { at: string; rank: number; kind: "message"; message: Message }
  | { at: string; rank: number; kind: "step"; step: TimelineStep }
  | { at: string; rank: number; kind: "spot-check" }
  | { at: string; rank: number; kind: "draft"; draft: TimelineDraft; variantCount: number }
  | { at: string; rank: number; kind: "reply"; reply: TimelineReply }
  | { at: string; rank: number; kind: "event"; text: string; index: number };

/*
 * Ranks break ties between entries with the same timestamp, in reading order: what the customer
 * wrote, what the AI did about it, what was sent, what still waits for a person, and last what the
 * specialist did about that.
 */
const RANK = { customer: 0, step: 1, outgoing: 2, spotCheck: 3, draft: 4, event: 5 } as const;

/**
 * One ticket as a messaging timeline (brief 7.4): bubbles, the AI step log as service messages,
 * the reply slot last, with a day separator wherever the desk's calendar day changes.
 *
 * "sent" steps are left out: the sent bubble's own label records the send, and a service message
 * saying the same thing would repeat it.
 */
export function buildTimeline(ticket: Ticket, now: number = DEMO_NOW, overlay: TimelineOverlay = {}): TimelineItem[] {
  const { triage } = ticket;
  const entries: Entry[] = [];

  for (const message of ticket.messages) {
    entries.push({
      at: message.at,
      rank: message.author === "customer" ? RANK.customer : RANK.outgoing,
      kind: "message",
      message,
    });
    if (message.author === "auto" && ticket.spotCheck && message === ticket.messages.at(-1)) {
      entries.push({ at: message.at, rank: RANK.spotCheck, kind: "spot-check" });
    }
  }

  for (const step of triage.steps) {
    if (step.kind !== "sent") entries.push({ at: step.at, rank: RANK.step, kind: "step", step });
  }

  const replies = overlay.replies ?? [];
  if (replies.length > 0) {
    for (const reply of replies) entries.push({ at: reply.at, rank: RANK.draft, kind: "reply", reply });
  } else {
    // A two-outcome case shows both drafts until a person chooses; the choice then stands alone.
    const chosen = triage.drafts.find((d) => d.id === overlay.chosenDraftId);
    const shown = chosen ? [chosen] : triage.drafts.length > 1 ? triage.drafts : triage.drafts.slice(0, 1);
    const lastAt = triage.steps.at(-1)?.at ?? ticket.receivedAt;
    for (const draft of shown) {
      if (draft.id === overlay.editingDraftId) continue;
      entries.push({ at: lastAt, rank: RANK.draft, kind: "draft", draft, variantCount: triage.drafts.length });
    }
  }

  (overlay.events ?? []).forEach((event, index) => {
    entries.push({ at: event.at, rank: RANK.event, kind: "event", text: event.text, index });
  });

  // Array.prototype.sort is stable, so equal timestamps and ranks keep insertion order.
  entries.sort((a, b) => a.at.localeCompare(b.at) || a.rank - b.rank);

  const items: TimelineItem[] = [];
  let day = "";
  for (const entry of entries) {
    const entryDay = deskDayKey(entry.at);
    if (entryDay !== day) {
      day = entryDay;
      items.push({ kind: "day", key: `day-${entryDay}`, label: formatDayLabel(entry.at, now) });
    }
    switch (entry.kind) {
      case "step": {
        // Consecutive steps share one group, so the log reads as a single block of service messages.
        const previous = items.at(-1);
        if (previous?.kind === "steps") previous.steps.push(entry.step);
        else items.push({ kind: "steps", key: `steps-${entry.step.at}`, steps: [entry.step] });
        break;
      }
      case "message":
        items.push({ kind: "message", key: entry.message.id, message: entry.message });
        break;
      case "spot-check":
        items.push({ kind: "spot-check", key: `spot-check-${ticket.id}` });
        break;
      case "draft":
        items.push({ kind: "draft", key: entry.draft.id, draft: entry.draft, variantCount: entry.variantCount });
        break;
      case "reply":
        items.push({ kind: "reply", key: entry.reply.draftId ?? `reply-${entry.reply.id}`, reply: entry.reply });
        break;
      case "event":
        items.push({ kind: "event", key: `event-${entry.index}`, at: entry.at, text: entry.text });
        break;
    }
  }
  return items;
}

/** True when any message or draft in the ticket carries an English translation. */
export function hasTranslation(ticket: Ticket) {
  return ticket.messages.some((m) => m.translationEn) || ticket.triage.drafts.some((d) => d.glossEn);
}
