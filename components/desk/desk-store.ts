"use client";

import { createContext, use, type Dispatch } from "react";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import type { DeskInit, ListState } from "@/lib/desk-params";
import { laneTickets } from "@/lib/lanes";
import { approvalBlock, canBulkSelect, isSureLowRiskDraft } from "@/lib/route";
import type { Lane, Ticket } from "@/lib/types";

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
  notice: { id: number; text: string } | null;
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
  | { type: "clearNotice"; id: number };

/** The rows a lane shows in a given list state. */
export function rowsFor(listState: ListState, lane: Lane): Ticket[] {
  if (listState === "loading") return [];
  if (listState === "empty" && lane === "needs_you") return [];
  return laneTickets(TICKETS, lane);
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

function notify(state: DeskState, text: string): DeskState {
  const seq = state.seq + 1;
  return { ...state, seq, notice: { id: seq, text } };
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

export function deskReducer(state: DeskState, action: DeskAction): DeskState {
  switch (action.type) {
    case "selectLane": {
      if (action.lane === state.lane) return state;
      const rows = rowsFor(state.listState, action.lane);
      const openId =
        state.listState === "loading" || rows.some((t) => t.id === state.openId) ? state.openId : (rows[0]?.id ?? null);
      // A notice is about the lane it was raised in, so it does not follow the specialist elsewhere.
      return { ...state, lane: action.lane, openId, cursorId: openId, editMode: false, checked: [], notice: null };
    }

    case "activate":
      if (state.editMode) return toggleCheck(state, action.id);
      return { ...state, openId: action.id, cursorId: action.id };

    case "move": {
      const rows = rowsFor(state.listState, state.lane);
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
      const ids = rowsFor(state.listState, "drafts")
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
      const rows = rowsFor(action.listState, state.lane);
      const openId =
        action.listState === "loading" || rows.some((t) => t.id === state.openId)
          ? state.openId
          : (rows[0]?.id ?? null);
      return { ...state, listState: action.listState, openId, cursorId: openId, editMode: false, checked: [] };
    }

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
