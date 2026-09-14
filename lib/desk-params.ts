import { COLLEAGUE } from "@/data/team";
import { TICKETS_BY_ID } from "@/data/tickets";
import { canSimulateDraft, type DraftStatus } from "./decision";
import { LANES } from "./lanes";
import { laneFor } from "./route";
import type { Lane } from "./types";

export type ListState = "live" | "loading" | "empty";

export interface DeskInit {
  lane: Lane;
  ticketId: string | null;
  listState: ListState;
  /** The opened conversation's AI draft is still generating, or failed (brief 12). */
  draft?: DraftStatus;
  /** A colleague has the opened conversation open too. */
  viewer?: boolean;
  /** The desk starts offline, so sends queue. */
  offline?: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * `?lane=drafts&ticket=t07&list=loading` opens a specific view, which is how screenshots and shared
 * links land on a state. `draft=drafting|failed`, `viewer=ana` and `net=offline` add a state from the
 * catalogue (brief 12). Unknown values fall back to the default queue.
 */
export function parseDeskParams(params: SearchParams): DeskInit {
  const ticket = TICKETS_BY_ID.get(first(params.ticket) ?? "");
  const laneParam = first(params.lane);
  const lane = LANES.find((l) => l.id === laneParam)?.id ?? (ticket ? laneFor(ticket.triage.route) : "needs_you");
  const list = first(params.list);
  const draft = first(params.draft);
  return {
    lane,
    ticketId: ticket?.id ?? null,
    listState: list === "loading" || list === "empty" ? list : "live",
    draft: ticket && canSimulateDraft(ticket) && (draft === "drafting" || draft === "failed") ? draft : undefined,
    viewer: ticket !== undefined && first(params.viewer) === COLLEAGUE.handle,
    offline: first(params.net) === "offline",
  };
}
