"use client";

import { createContext, use, type Dispatch } from "react";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import { formatClockTime } from "@/lib/clock";
import type { DeskInit, ListState } from "@/lib/desk-params";
import { dismissBlock, laneTickets, type DismissKind } from "@/lib/lanes";
import { approvalBlock, canBulkSelect, isSureLowRiskDraft, laneFor } from "@/lib/route";
import type { Lane, Ticket } from "@/lib/types";

const SNOOZE_MS = 60 * 60_000;

export type Dismissals = Readonly<Record<string, { kind: DismissKind; until?: string }>>;

export interface Notice {
  id: number;
  text: string;
  /** Feedback appears next to its trigger: list actions under the lane track, thread actions under the header. */
  where: "list" | "thread";
  action?: { label: string; dispatch: DeskAction };
}

export interface DeskState {
  lane: Lane;
  /** The conversation shown in the thread pane. */
  openId: string | null;
  /** The row that owns keyboard position. Equals openId except in selection mode. */
  cursorId: string | null;
  /** Telegram-style edit mode: rows show checkboxes and a click toggles instead of opening. */
  editMode: boolean;
  checked: readonly string[];
  listState: ListState;
  /** Snoozed or spam tickets, out of every lane until restored. */
  dismissed: Dismissals;
  /** Show English under messages and drafts written in another language. */
  showTranslation: boolean;
  notice: Notice | null;
  focusRequest: { id: string; nonce: number } | null;
  seq: number;
}

export type DeskAction =
  | { type: "selectLane"; lane: Lane }
  | { type: "activate"; id: string }
  | { type: "move"; to: 1 | -1 | "first" | "last"; focus: boolean }
  | { type: "toggleCheck"; id?: string }
  | { type: "selectSureDrafts" }
  | { type: "enterSelection" }
  | { type: "exitSelection" }
  | { type: "setListState"; listState: ListState }
  | { type: "dismiss"; id: string; kind: DismissKind; now: number }
  | { type: "restore"; id: string }
  | { type: "toggleTranslation" }
  | { type: "notify"; text: string; where: Notice["where"] }
  | { type: "clearNotice"; id: number };

const NO_DISMISSALS: Dismissals = {};

/** The rows a lane shows in a given list state. */
export function rowsFor(listState: ListState, lane: Lane, dismissed: Dismissals = NO_DISMISSALS): Ticket[] {
  if (listState === "loading") return [];
  if (listState === "empty" && lane === "needs_you") return [];
  return laneTickets(TICKETS, lane).filter((t) => !dismissed[t.id]);
}

export function createDeskState({ lane, ticketId, listState }: DeskInit): DeskState {
  const rows = rowsFor(listState, lane);
  const openId =
    listState === "loading" ? ticketId : rows.some((t) => t.id === ticketId) ? ticketId : (rows[0]?.id ?? null);
  return {
    lane,
    openId,
    cursorId: openId,
    editMode: false,
    checked: [],
    listState,
    dismissed: NO_DISMISSALS,
    showTranslation: true,
    notice: null,
    focusRequest: null,
    seq: 0,
  };
}

const SELECTION_ELSEWHERE: Record<Lane, string> = {
  needs_you: "Bulk selection works in Drafts. Cases in Needs you are decided one at a time.",
  drafts: "",
  auto_resolved: "Auto-resolved replies are already sent, so there is nothing to select.",
};

function notify(state: DeskState, text: string, where: Notice["where"] = "list", action?: Notice["action"]): DeskState {
  const seq = state.seq + 1;
  return { ...state, seq, notice: { id: seq, text, where, action } };
}

function toggleCheck(state: DeskState, id: string | null): DeskState {
  if (state.lane !== "drafts") return notify(state, SELECTION_ELSEWHERE[state.lane]);
  const ticket = id ? TICKETS_BY_ID.get(id) : undefined;
  if (!ticket) return state;
  if (!canBulkSelect(ticket.triage)) {
    return notify(state, approvalBlock(ticket.triage)?.reason ?? "Only drafts waiting for approval can be selected.");
  }
  const checked = state.checked.includes(ticket.id)
    ? state.checked.filter((c) => c !== ticket.id)
    : [...state.checked, ticket.id];
  return { ...state, editMode: true, checked, cursorId: ticket.id };
}

function dismiss(state: DeskState, { id, kind, now }: { id: string; kind: DismissKind; now: number }): DeskState {
  const ticket = TICKETS_BY_ID.get(id);
  if (!ticket) return state;
  const blocked = dismissBlock(ticket, kind);
  if (blocked) return notify(state, blocked, "thread");

  // The next conversation opens in its place, as after sending: the row below, else the row above.
  const rows = rowsFor(state.listState, state.lane, state.dismissed);
  const index = rows.findIndex((t) => t.id === id);
  const neighbour = index < 0 ? undefined : (rows[index + 1] ?? rows[index - 1]);
  const openId = state.openId === id ? (neighbour?.id ?? null) : state.openId;
  const until = kind === "snoozed" ? new Date(now + SNOOZE_MS).toISOString() : undefined;

  const next: DeskState = {
    ...state,
    dismissed: { ...state.dismissed, [id]: { kind, until } },
    openId,
    cursorId: openId,
    checked: state.checked.filter((c) => c !== id),
  };
  const name = ticket.customer.name;
  return kind === "snoozed"
    ? notify(next, `Snoozed ${name} until ${formatClockTime(until!)}.`, "list", {
        label: "Undo snooze",
        dispatch: { type: "restore", id },
      })
    : notify(next, `Marked ${name} as spam.`, "list", { label: "Undo spam", dispatch: { type: "restore", id } });
}

export function deskReducer(state: DeskState, action: DeskAction): DeskState {
  switch (action.type) {
    case "selectLane": {
      if (action.lane === state.lane) return state;
      const rows = rowsFor(state.listState, action.lane, state.dismissed);
      const openId =
        state.listState === "loading" || rows.some((t) => t.id === state.openId) ? state.openId : (rows[0]?.id ?? null);
      // A notice is about the lane it was raised in, so it does not follow the specialist elsewhere.
      return { ...state, lane: action.lane, openId, cursorId: openId, editMode: false, checked: [], notice: null };
    }

    case "activate":
      if (state.editMode) return toggleCheck(state, action.id);
      return { ...state, openId: action.id, cursorId: action.id };

    case "move": {
      const rows = rowsFor(state.listState, state.lane, state.dismissed);
      if (rows.length === 0) return state;
      const last = rows.length - 1;
      const index = rows.findIndex((t) => t.id === state.cursorId);
      let target: number;
      if (action.to === "first") target = 0;
      else if (action.to === "last") target = last;
      else if (index < 0) target = action.to > 0 ? 0 : last;
      else target = Math.min(last, Math.max(0, index + action.to));
      const id = rows[target].id;
      const moved = state.editMode ? { ...state, cursorId: id } : { ...state, openId: id, cursorId: id };
      if (!action.focus) return moved;
      const seq = state.seq + 1;
      return { ...moved, seq, focusRequest: { id, nonce: seq } };
    }

    case "toggleCheck":
      return toggleCheck(state, action.id ?? state.cursorId);

    case "selectSureDrafts": {
      if (state.lane !== "drafts") return notify(state, SELECTION_ELSEWHERE[state.lane]);
      const ids = rowsFor(state.listState, "drafts", state.dismissed)
        .filter((t) => isSureLowRiskDraft(t.triage))
        .map((t) => t.id);
      if (ids.length === 0) return notify(state, "No low-risk Sure drafts are waiting.");
      return { ...state, editMode: true, checked: ids };
    }

    case "enterSelection":
      if (state.lane !== "drafts") return notify(state, SELECTION_ELSEWHERE[state.lane]);
      return { ...state, editMode: true };

    case "exitSelection":
      if (!state.editMode) return state;
      return { ...state, editMode: false, checked: [], cursorId: state.openId };

    case "setListState": {
      const rows = rowsFor(action.listState, state.lane, state.dismissed);
      const openId =
        action.listState === "loading" || rows.some((t) => t.id === state.openId)
          ? state.openId
          : (rows[0]?.id ?? null);
      return { ...state, listState: action.listState, openId, cursorId: openId, editMode: false, checked: [] };
    }

    case "dismiss":
      return dismiss(state, action);

    case "restore": {
      const ticket = TICKETS_BY_ID.get(action.id);
      if (!ticket || !state.dismissed[action.id]) return state;
      const dismissed = Object.fromEntries(Object.entries(state.dismissed).filter(([id]) => id !== action.id));
      // Undo puts the specialist back exactly where they were: the ticket's lane, with it open.
      return {
        ...state,
        dismissed,
        lane: laneFor(ticket.triage.route),
        openId: action.id,
        cursorId: action.id,
        editMode: false,
        checked: [],
        notice: null,
      };
    }

    case "toggleTranslation":
      return { ...state, showTranslation: !state.showTranslation };

    case "notify":
      return notify(state, action.text, action.where);

    case "clearNotice":
      return state.notice?.id === action.id ? { ...state, notice: null } : state;
  }
}

export const DeskContext = createContext<{ state: DeskState; dispatch: Dispatch<DeskAction> } | null>(null);

export function useDesk() {
  const desk = use(DeskContext);
  if (!desk) throw new Error("useDesk must be used inside <Desk>");
  return desk;
}
