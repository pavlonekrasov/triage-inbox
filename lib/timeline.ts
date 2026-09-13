import { DEMO_NOW, deskDayKey, formatDayLabel } from "./clock";
import type { Message, Ticket, TriageResult } from "./types";

export type TimelineStep = TriageResult["steps"][number];
export type TimelineDraft = TriageResult["drafts"][number];

export type TimelineItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "message"; key: string; message: Message }
  | { kind: "steps"; key: string; steps: TimelineStep[] }
  | { kind: "spot-check"; key: string }
  | { kind: "draft"; key: string; draft: TimelineDraft; variantCount: number };

type Entry =
  | { at: string; rank: number; kind: "message"; message: Message }
  | { at: string; rank: number; kind: "step"; step: TimelineStep }
  | { at: string; rank: number; kind: "spot-check" }
  | { at: string; rank: number; kind: "draft"; draft: TimelineDraft; variantCount: number };

/*
 * Ranks break ties between entries with the same timestamp, in reading order: what the customer
 * wrote, what the AI did about it, what was sent, and finally what still waits for a person.
 */
const RANK = { customer: 0, step: 1, outgoing: 2, spotCheck: 3, draft: 4 } as const;

/**
 * One ticket as a messaging timeline (brief 7.4): bubbles, the AI step log as service messages,
 * the unsent draft last, with a day separator wherever the desk's calendar day changes.
 *
 * "sent" steps are left out: the sent bubble's own label records the send, and a service message
 * saying the same thing would repeat it.
 */
export function buildTimeline(ticket: Ticket, now: number = DEMO_NOW): TimelineItem[] {
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

  // Variants swap in place (step 5), so the timeline holds one draft slot.
  const [draft] = triage.drafts;
  if (draft) {
    const lastAt = triage.steps.at(-1)?.at ?? ticket.receivedAt;
    entries.push({ at: lastAt, rank: RANK.draft, kind: "draft", draft, variantCount: triage.drafts.length });
  }

  // Array.prototype.sort is stable, so equal timestamps and ranks keep fixture order.
  entries.sort((a, b) => a.at.localeCompare(b.at) || a.rank - b.rank);

  const items: TimelineItem[] = [];
  let day = "";
  for (const entry of entries) {
    const entryDay = deskDayKey(entry.at);
    if (entryDay !== day) {
      day = entryDay;
      items.push({ kind: "day", key: `day-${entryDay}`, label: formatDayLabel(entry.at, now) });
    }
    if (entry.kind === "step") {
      // Consecutive steps share one group, so the log reads as a single block of service messages.
      const previous = items.at(-1);
      if (previous?.kind === "steps") previous.steps.push(entry.step);
      else items.push({ kind: "steps", key: `steps-${entry.step.at}`, steps: [entry.step] });
    } else if (entry.kind === "message") {
      items.push({ kind: "message", key: entry.message.id, message: entry.message });
    } else if (entry.kind === "spot-check") {
      items.push({ kind: "spot-check", key: `spot-check-${ticket.id}` });
    } else {
      items.push({ kind: "draft", key: entry.draft.id, draft: entry.draft, variantCount: entry.variantCount });
    }
  }
  return items;
}

/** True when any message or draft in the ticket carries an English translation. */
export function hasTranslation(ticket: Ticket) {
  return (
    ticket.messages.some((m) => m.translationEn) || ticket.triage.drafts.some((d) => d.glossEn)
  );
}
