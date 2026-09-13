import { TICKETS_BY_ID } from "@/data/tickets";
import { LANES } from "./lanes";
import { laneFor } from "./route";
import type { Lane } from "./types";

export type ListState = "live" | "loading" | "empty";

export interface DeskInit {
  lane: Lane;
  ticketId: string | null;
  listState: ListState;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * `?lane=drafts&ticket=t07&list=loading` opens a specific view, which is how screenshots and shared
 * links land on a state. Unknown values fall back to the default queue.
 */
export function parseDeskParams(params: SearchParams): DeskInit {
  const ticket = TICKETS_BY_ID.get(first(params.ticket) ?? "");
  const laneParam = first(params.lane);
  const lane = LANES.find((l) => l.id === laneParam)?.id ?? (ticket ? laneFor(ticket.triage.route) : "needs_you");
  const list = first(params.list);
  return {
    lane,
    ticketId: ticket?.id ?? null,
    listState: list === "loading" || list === "empty" ? list : "live",
  };
}
