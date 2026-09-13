import { laneFor } from "./route";
import type { Lane, Ticket } from "./types";

export const LANES: readonly { id: Lane; label: string; shortLabel: string }[] = [
  { id: "needs_you", label: "Needs you", shortLabel: "Needs you" },
  { id: "drafts", label: "Drafts", shortLabel: "Drafts" },
  { id: "auto_resolved", label: "Auto-resolved", shortLabel: "Auto" },
];

export const lastActivityAt = (ticket: Ticket) => ticket.messages.at(-1)?.at ?? ticket.receivedAt;

/** Auto-sent tickets are already answered; they sit in Auto-resolved as done rows. */
export const isResolved = (ticket: Ticket) => ticket.triage.route === "auto_send";

/** Wellbeing first, then safety: both pinned to the top of Needs you regardless of time (brief 7.3). */
function pinRank(ticket: Ticket) {
  if (ticket.triage.hardRules.includes("wellbeing")) return 0;
  if (ticket.triage.hardRules.includes("safety_complaint")) return 1;
  return 2;
}

export const isPinned = (ticket: Ticket) => pinRank(ticket) < 2;

/**
 * Open lanes sort by first-response deadline, soonest first, so the case closest to breaching is
 * never below the fold. Auto-resolved is history, so it reads newest first like a chat list.
 */
export function laneTickets(tickets: readonly Ticket[], lane: Lane): Ticket[] {
  const inLane = tickets.filter((t) => laneFor(t.triage.route) === lane);
  if (lane === "auto_resolved") {
    return inLane.sort((a, b) => lastActivityAt(b).localeCompare(lastActivityAt(a)));
  }
  return inLane.sort((a, b) => pinRank(a) - pinRank(b) || a.slaDueAt.localeCompare(b.slaDueAt));
}
