"use client";

import { createContext, use, type Dispatch } from "react";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import { formatClockTime } from "@/lib/clock";
import { approveBlocked, decisionFor, editTarget, type DecisionContext, type OutgoingStatus } from "@/lib/decision";
import type { DeskInit, ListState } from "@/lib/desk-params";
import { teamLabel } from "@/lib/escalation";
import { dismissBlock, LANES, laneTickets, type DismissKind } from "@/lib/lanes";
import { composerSendBlock } from "@/lib/rewrite";
import { approvalBlock, canBulkSelect, isSureLowRiskDraft, laneFor } from "@/lib/route";
import { UNDO_WINDOW_MS, type SendFailure } from "@/lib/send";
import type { TimelineOverlay } from "@/lib/timeline";
import type { EscalationTeam, Lane, Ticket } from "@/lib/types";

const SNOOZE_MS = 60 * 60_000;
const iso = (ms: number) => new Date(ms).toISOString();

function omit<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));
}

export type Dismissals = Readonly<Record<string, { kind: DismissKind; until?: string }>>;

export interface Notice {
  id: number;
  text: string;
  /**
   * Feedback appears next to its trigger: list actions under the lane track, header actions under
   * the header, decisions above the decision bar.
   */
  where: "list" | "thread" | "bar";
  action?: { label: string; dispatch: DeskAction };
}

/** Telegram's edit mode: one composer at a time, bound to the ticket it was opened on. */
export interface Composer {
  ticketId: string;
  mode: "edit" | "take-over" | "follow-up" | "write";
  /** The AI draft being edited; null when the person writes from nothing. */
  draftId: string | null;
  /** The text the composer opened with, which tells an edited reply from an unchanged one. */
  original: string;
  text: string;
  language: string;
  /** An AI chip rewrote the text at least once. */
  rewritten: boolean;
}

/** A reply sent from this desk. Approve is optimistic: it waits out the undo window, then commits. */
export interface Outgoing {
  ticketId: string;
  body: string;
  language: string;
  draftId: string | null;
  edited: boolean;
  /** Demo-clock time of the send, shown on the bubble. */
  at: string;
  status: OutgoingStatus;
  /** Date.now() deadline of the undo window: the window is real time, not demo time. */
  undoUntil: number;
  /** Changes on every attempt, so a late result from an earlier attempt is ignored. */
  attempt: number;
  /** Service messages the send adds, such as the review a safety acknowledgment opens. */
  events: string[];
  /** The composer the reply was sent from, which Undo reopens so no edit is lost. */
  composer: Composer | null;
  /** The delivered reply this one follows up. Undo puts it back, so a follow-up never erases it. */
  previous: Outgoing | null;
}

export interface Escalation {
  team: EscalationTeam;
  reasons: string[];
  note: string;
  at: string;
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

  outbox: Readonly<Record<string, Outgoing>>;
  escalations: Readonly<Record<string, Escalation>>;
  /** Two-outcome cases: the draft a person chose. */
  variantChoice: Readonly<Record<string, string>>;
  /** Wellbeing cases a person took over, with the time. */
  takenOver: Readonly<Record<string, string>>;
  /** Auto-sent replies marked wrong, with the time. They feed the quality review. */
  markedWrong: Readonly<Record<string, string>>;
  /** Unsent replies being written, one per conversation, kept when the specialist moves elsewhere. */
  composers: Readonly<Record<string, Composer>>;
  /** The Escalate popover on the open conversation. */
  escalateOpen: boolean;
  /** Prototype control: how often the fake send API fails. */
  sendFailure: SendFailure;
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
  | { type: "reveal"; id: string }
  | { type: "toggleTranslation" }
  | { type: "notify"; text: string; where: Notice["where"] }
  | { type: "clearNotice"; id: number }
  | { type: "decide"; now: number; wall: number }
  | { type: "approve"; now: number; wall: number }
  | { type: "chooseVariant"; draftId: string }
  | { type: "openComposer" }
  | { type: "composerInput"; id: string; text: string }
  | { type: "composerRewrite"; id: string; text: string; language: string }
  | { type: "closeComposer"; id: string }
  | { type: "sendComposer"; id: string; now: number; wall: number }
  | { type: "undoSend"; id?: string }
  | { type: "commitSend"; id: string; attempt: number }
  | { type: "sendSettled"; id: string; attempt: number; ok: boolean }
  | { type: "retrySend"; id: string }
  | { type: "setEscalateOpen"; open: boolean }
  | { type: "escalate"; team: EscalationTeam; reasons: string[]; note: string; now: number }
  | { type: "undoEscalation"; id: string }
  | { type: "toggleMarkWrong"; now: number }
  | { type: "setSendFailure"; sendFailure: SendFailure };

/** Tickets out of every lane right now: snoozed, marked spam, escalated, or answered from an open lane. */
export function hiddenIds(state: Pick<DeskState, "dismissed" | "escalations" | "outbox">): ReadonlySet<string> {
  const hidden = new Set([...Object.keys(state.dismissed), ...Object.keys(state.escalations)]);
  for (const outgoing of Object.values(state.outbox)) {
    const ticket = TICKETS_BY_ID.get(outgoing.ticketId);
    // A follow-up on an answered ticket leaves it in Auto-resolved. A failed send puts the ticket back,
    // unless it was a follow-up: the reply before it was delivered, so the case is still answered.
    const answered = outgoing.status !== "failed" || outgoing.previous !== null;
    if (ticket && answered && laneFor(ticket.triage.route) !== "auto_resolved") {
      hidden.add(outgoing.ticketId);
    }
  }
  return hidden;
}

const NONE: ReadonlySet<string> = new Set();

/** The rows a lane shows in a given list state. */
export function rowsFor(listState: ListState, lane: Lane, hidden: ReadonlySet<string> = NONE): Ticket[] {
  if (listState === "loading") return [];
  if (listState === "empty" && lane === "needs_you") return [];
  return laneTickets(TICKETS, lane).filter((t) => !hidden.has(t.id));
}

export function contextFor(state: DeskState, id: string): DecisionContext {
  return {
    chosenDraftId: state.variantChoice[id] ?? null,
    takenOver: id in state.takenOver,
    outgoing: state.outbox[id]?.status ?? null,
  };
}

export function latestUndoable(outbox: DeskState["outbox"]): Outgoing | null {
  let latest: Outgoing | null = null;
  for (const o of Object.values(outbox)) {
    if (o.status === "undoable" && (!latest || o.undoUntil > latest.undoUntil)) latest = o;
  }
  return latest;
}

/** The desk's own actions on a ticket, for the thread to lay over the fixture. */
export function threadOverlay(state: DeskState, ticket: Ticket): TimelineOverlay {
  const events: { at: string; text: string }[] = [];
  const takenOver = state.takenOver[ticket.id];
  if (takenOver) events.push({ at: takenOver, text: "You took over the conversation" });
  const wrong = state.markedWrong[ticket.id];
  if (wrong) events.push({ at: wrong, text: "Marked as wrong by you, for today's quality review" });
  // The latest reply is the head of the outbox entry; the replies it follows up hang off it, newest first.
  const chain: Outgoing[] = [];
  for (let o: Outgoing | null = state.outbox[ticket.id] ?? null; o; o = o.previous) chain.unshift(o);
  for (const o of chain) for (const text of o.events) events.push({ at: o.at, text });
  const escalation = state.escalations[ticket.id];
  if (escalation) events.push({ at: escalation.at, text: `Escalated to ${teamLabel(escalation.team)} by you` });
  const composer = state.composers[ticket.id];

  return {
    replies: chain.map((o) => ({
      id: String(o.attempt),
      body: o.body,
      language: o.language,
      draftId: o.draftId,
      edited: o.edited,
      at: o.at,
      status: o.status,
    })),
    chosenDraftId: state.variantChoice[ticket.id] ?? null,
    editingDraftId: composer?.mode === "edit" ? composer.draftId : null,
    events,
  };
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
    dismissed: {},
    showTranslation: true,
    notice: null,
    focusRequest: null,
    seq: 0,
    outbox: {},
    escalations: {},
    variantChoice: {},
    takenOver: {},
    markedWrong: {},
    composers: {},
    escalateOpen: false,
    sendFailure: "off",
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

const openTicket = (state: DeskState) => (state.openId ? TICKETS_BY_ID.get(state.openId) : undefined);
const clearBarNotice = (state: DeskState) => (state.notice?.where === "bar" ? null : state.notice);

/** Opens a ticket in its own lane with focus on its row: how Undo puts the specialist back. */
function reveal(state: DeskState, id: string): DeskState {
  const ticket = TICKETS_BY_ID.get(id);
  if (!ticket) return state;
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    lane: laneFor(ticket.triage.route),
    openId: id,
    cursorId: id,
    editMode: false,
    checked: [],
    notice: null,
    focusRequest: { id, nonce: seq },
  };
}

/**
 * The ticket leaves the lane and the next conversation opens in its place, as in a mail client: the
 * row below, else the row above, with keyboard focus on it. `stay` keeps the ticket open when no row
 * is left, so the specialist sees the outcome of the last case in a lane.
 */
function openNext(before: DeskState, id: string, next: DeskState, { stay }: { stay: boolean }): DeskState {
  if (before.openId !== id) return next;
  const rows = rowsFor(before.listState, before.lane, hiddenIds(before));
  const index = rows.findIndex((t) => t.id === id);
  const neighbour = index < 0 ? undefined : (rows[index + 1] ?? rows[index - 1]);
  const openId = neighbour?.id ?? (stay ? id : null);
  const seq = next.seq + 1;
  return {
    ...next,
    seq,
    openId,
    cursorId: openId,
    checked: next.checked.filter((c) => c !== id),
    focusRequest: neighbour ? { id: neighbour.id, nonce: seq } : next.focusRequest,
  };
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

  const until = kind === "snoozed" ? iso(now + SNOOZE_MS) : undefined;
  const next = openNext(state, id, { ...state, dismissed: { ...state.dismissed, [id]: { kind, until } } }, { stay: false });
  const name = ticket.customer.name;
  return kind === "snoozed"
    ? notify(next, `Snoozed ${name} until ${formatClockTime(until!)}.`, "list", {
        label: "Undo snooze",
        dispatch: { type: "restore", id },
      })
    : notify(next, `Marked ${name} as spam.`, "list", { label: "Undo spam", dispatch: { type: "restore", id } });
}

type ReplyPayload = Pick<Outgoing, "body" | "language" | "draftId" | "edited"> & {
  events?: string[];
  composer?: Composer | null;
};

function send(state: DeskState, ticket: Ticket, reply: ReplyPayload, now: number, wall: number): DeskState {
  const existing = state.outbox[ticket.id];
  if (existing?.status === "undoable" || existing?.status === "sending") {
    return notify(state, "Your reply is still sending. Follow up once it's delivered.", "bar");
  }
  // A delivered reply stays under the follow-up. A failed attempt is replaced, keeping what was delivered before it.
  const previous = existing?.status === "sent" ? existing : (existing?.previous ?? null);
  const seq = state.seq + 1;
  const outgoing: Outgoing = {
    ticketId: ticket.id,
    body: reply.body,
    language: reply.language,
    draftId: reply.draftId,
    edited: reply.edited,
    at: iso(now),
    status: "undoable",
    undoUntil: wall + UNDO_WINDOW_MS,
    attempt: seq,
    events: reply.events ?? [],
    composer: reply.composer ?? null,
    previous,
  };
  const next: DeskState = {
    ...state,
    seq,
    outbox: { ...state.outbox, [ticket.id]: outgoing },
    composers: omit(state.composers, ticket.id),
    escalateOpen: false,
    notice: clearBarNotice(state),
  };
  // Only the first reply takes the case out of its lane; a follow-up leaves an answered case where it is.
  const leaves = laneFor(ticket.triage.route) !== "auto_resolved" && previous === null;
  return leaves ? openNext(state, ticket.id, next, { stay: true }) : next;
}

function compose(
  state: DeskState,
  ticket: Ticket,
  mode: Composer["mode"],
  source: { id: string | null; body: string; language: string } | null,
): DeskState {
  return {
    ...state,
    escalateOpen: false,
    notice: clearBarNotice(state),
    composers: {
      ...state.composers,
      [ticket.id]: {
        ticketId: ticket.id,
        mode,
        draftId: source?.id ?? null,
        original: source?.body ?? "",
        text: source?.body ?? "",
        language: source?.language ?? ticket.triage.language,
        rewritten: false,
      },
    },
  };
}

/** Why nothing more can be decided on an escalated case, or null when it is not escalated. */
function escalatedBlock(state: DeskState, id: string): string | null {
  const escalation = state.escalations[id];
  return escalation ? `This case is with ${teamLabel(escalation.team)} now, so there is nothing to decide here.` : null;
}

function retry(state: DeskState, id: string): DeskState {
  const outgoing = state.outbox[id];
  if (outgoing?.status !== "failed") return state;
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    outbox: { ...state.outbox, [id]: { ...outgoing, status: "sending", attempt: seq } },
    notice: state.notice?.where === "list" || state.notice?.where === "bar" ? null : state.notice,
  };
}

/** The primary action of the decision bar for the open conversation (brief 9.1). */
function decide(state: DeskState, now: number, wall: number): DeskState {
  const ticket = openTicket(state);
  if (!ticket) return state;
  const escalated = escalatedBlock(state, ticket.id);
  if (escalated) return notify(state, escalated, "bar");
  const { primary, draft } = decisionFor(ticket, contextFor(state, ticket.id));
  if (primary.blocked) return notify(state, primary.blocked, "bar");
  const fromDraft = draft && { body: draft.body, language: draft.language, draftId: draft.id, edited: false };

  switch (primary.kind) {
    case "approve":
    case "send-variant":
      return fromDraft ? send(state, ticket, fromDraft, now, wall) : state;
    case "acknowledge":
      return fromDraft ? send(state, ticket, { ...fromDraft, events: ["Review opened with Trust & Safety"] }, now, wall) : state;
    case "take-over":
      return compose({ ...state, takenOver: { ...state.takenOver, [ticket.id]: iso(now) } }, ticket, "take-over", null);
    case "review-send":
      return draft ? compose(state, ticket, "edit", draft) : state;
    case "follow-up":
      return compose(state, ticket, "follow-up", null);
    case "write":
      return compose(state, ticket, "write", null);
    case "retry":
      return retry(state, ticket.id);
  }
}

function reduce(state: DeskState, action: DeskAction): DeskState {
  switch (action.type) {
    case "selectLane": {
      if (action.lane === state.lane) return state;
      const rows = rowsFor(state.listState, action.lane, hiddenIds(state));
      const openId =
        state.listState === "loading" || rows.some((t) => t.id === state.openId) ? state.openId : (rows[0]?.id ?? null);
      // A notice is about the lane it was raised in, so it does not follow the specialist elsewhere.
      return { ...state, lane: action.lane, openId, cursorId: openId, editMode: false, checked: [], notice: null };
    }

    case "activate":
      if (state.editMode) return toggleCheck(state, action.id);
      return { ...state, openId: action.id, cursorId: action.id };

    case "move": {
      const rows = rowsFor(state.listState, state.lane, hiddenIds(state));
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
      const ids = rowsFor(state.listState, "drafts", hiddenIds(state))
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
      const rows = rowsFor(action.listState, state.lane, hiddenIds(state));
      const openId =
        action.listState === "loading" || rows.some((t) => t.id === state.openId)
          ? state.openId
          : (rows[0]?.id ?? null);
      return { ...state, listState: action.listState, openId, cursorId: openId, editMode: false, checked: [] };
    }

    case "dismiss":
      return dismiss(state, action);

    case "restore":
      if (!state.dismissed[action.id]) return state;
      return reveal({ ...state, dismissed: omit(state.dismissed, action.id) }, action.id);

    case "reveal":
      return reveal(state, action.id);

    case "toggleTranslation":
      return { ...state, showTranslation: !state.showTranslation };

    case "notify":
      return notify(state, action.text, action.where);

    case "clearNotice":
      return state.notice?.id === action.id ? { ...state, notice: null } : state;

    case "decide":
      return decide(state, action.now, action.wall);

    case "approve": {
      const ticket = openTicket(state);
      if (!ticket) return state;
      const blocked = escalatedBlock(state, ticket.id) ?? approveBlocked(ticket, contextFor(state, ticket.id));
      return blocked ? notify(state, blocked, "bar") : decide(state, action.now, action.wall);
    }

    case "chooseVariant": {
      const ticket = openTicket(state);
      if (!ticket?.triage.drafts.some((d) => d.id === action.draftId)) return state;
      return {
        ...state,
        variantChoice: { ...state.variantChoice, [ticket.id]: action.draftId },
        notice: clearBarNotice(state),
      };
    }

    case "openComposer": {
      const ticket = openTicket(state);
      if (!ticket || state.composers[ticket.id]) return state;
      const escalated = escalatedBlock(state, ticket.id);
      if (escalated) return notify(state, escalated, "bar");
      const failed = state.outbox[ticket.id];
      if (failed?.status === "failed") {
        return compose(state, ticket, "edit", { id: failed.draftId, body: failed.body, language: failed.language });
      }
      const target = editTarget(ticket, contextFor(state, ticket.id));
      return "blocked" in target ? notify(state, target.blocked, "bar") : compose(state, ticket, "edit", target.draft);
    }

    case "composerInput": {
      const composer = state.composers[action.id];
      if (!composer) return state;
      return { ...state, composers: { ...state.composers, [action.id]: { ...composer, text: action.text } } };
    }

    case "composerRewrite": {
      const composer = state.composers[action.id];
      if (!composer) return state;
      const rewritten = { ...composer, text: action.text, language: action.language, rewritten: true };
      return { ...state, composers: { ...state.composers, [action.id]: rewritten } };
    }

    case "closeComposer": {
      if (!state.composers[action.id]) return state;
      const seq = state.seq + 1;
      const onOpen = action.id === state.openId;
      return {
        ...state,
        seq,
        composers: omit(state.composers, action.id),
        focusRequest: onOpen ? { id: action.id, nonce: seq } : state.focusRequest,
      };
    }

    case "sendComposer": {
      const composer = state.composers[action.id];
      const ticket = TICKETS_BY_ID.get(action.id);
      if (!composer || !ticket) return state;
      const blocked =
        escalatedBlock(state, ticket.id) ?? composerSendBlock(composer.text, composer.language, ticket.triage.language);
      if (blocked) return notify(state, blocked, "bar");
      const body = composer.text.trim();
      const edited = composer.mode === "edit" && (body !== composer.original.trim() || Boolean(state.outbox[ticket.id]?.edited));
      return send(
        state,
        ticket,
        { body, language: composer.language, draftId: composer.draftId, edited, composer },
        action.now,
        action.wall,
      );
    }

    case "undoSend": {
      const target = action.id ? state.outbox[action.id] : latestUndoable(state.outbox);
      if (target?.status !== "undoable") return state;
      const id = target.ticketId;
      // Undoing a follow-up leaves the delivered reply under it, and the case where it already was.
      const restored = target.previous
        ? { ...state, outbox: { ...state.outbox, [id]: target.previous }, openId: id, cursorId: id, notice: null }
        : reveal({ ...state, outbox: omit(state.outbox, id) }, id);
      // The composer comes back with the sent text, keeping focus in it, unless the case already has a newer one open.
      if (!target.composer || state.composers[id]) return restored;
      return { ...restored, composers: { ...restored.composers, [id]: target.composer }, focusRequest: state.focusRequest };
    }

    case "commitSend": {
      const outgoing = state.outbox[action.id];
      if (outgoing?.status !== "undoable" || outgoing.attempt !== action.attempt) return state;
      return { ...state, outbox: { ...state.outbox, [action.id]: { ...outgoing, status: "sending" } } };
    }

    case "sendSettled": {
      const outgoing = state.outbox[action.id];
      if (outgoing?.status !== "sending" || outgoing.attempt !== action.attempt) return state;
      const next = {
        ...state,
        outbox: { ...state.outbox, [action.id]: { ...outgoing, status: action.ok ? "sent" : "failed" } as Outgoing },
      };
      if (action.ok) return next;
      const ticket = TICKETS_BY_ID.get(action.id);
      if (!ticket) return next;
      if (state.openId === action.id) return notify(next, "Your reply wasn't sent. Retry sending, or edit it first.", "bar");
      const name = ticket.customer.name;
      const lane = LANES.find((l) => l.id === laneFor(ticket.triage.route))?.label ?? "its lane";
      const text = outgoing.previous
        ? `Your follow-up to ${name} wasn't sent. Open the conversation to retry.`
        : `Your reply to ${name} wasn't sent. It's back in ${lane}.`;
      return notify(next, text, "list", { label: "Open conversation", dispatch: { type: "reveal", id: action.id } });
    }

    case "retrySend":
      return retry(state, action.id);

    case "setEscalateOpen": {
      if (!action.open) return state.escalateOpen ? { ...state, escalateOpen: false } : state;
      const ticket = openTicket(state);
      if (!ticket) return state;
      const escalated = escalatedBlock(state, ticket.id);
      if (escalated) return notify(state, escalated, "bar");
      const composer = state.composers[ticket.id];
      if (composer && composer.text.trim() !== composer.original.trim()) {
        return notify(state, "Send or discard your reply before escalating.", "bar");
      }
      return { ...state, escalateOpen: true, composers: omit(state.composers, ticket.id), notice: clearBarNotice(state) };
    }

    case "escalate": {
      const ticket = openTicket(state);
      if (!ticket || state.escalations[ticket.id]) return state;
      const next: DeskState = {
        ...state,
        escalations: {
          ...state.escalations,
          [ticket.id]: { team: action.team, reasons: action.reasons, note: action.note, at: iso(action.now) },
        },
        escalateOpen: false,
        composers: omit(state.composers, ticket.id),
      };
      return notify(
        openNext(state, ticket.id, next, { stay: true }),
        `Escalated ${ticket.customer.name} to ${teamLabel(action.team)}.`,
        "list",
        { label: "Undo escalation", dispatch: { type: "undoEscalation", id: ticket.id } },
      );
    }

    case "undoEscalation":
      if (!state.escalations[action.id]) return state;
      return reveal({ ...state, escalations: omit(state.escalations, action.id) }, action.id);

    case "toggleMarkWrong": {
      const ticket = openTicket(state);
      if (!ticket || ticket.triage.route !== "auto_send") return state;
      if (state.markedWrong[ticket.id]) {
        return notify({ ...state, markedWrong: omit(state.markedWrong, ticket.id) }, "No longer marked as wrong.", "bar");
      }
      return notify(
        { ...state, markedWrong: { ...state.markedWrong, [ticket.id]: iso(action.now) } },
        "Marked as wrong. It counts in today's quality review.",
        "bar",
        { label: "Undo", dispatch: { type: "toggleMarkWrong", now: action.now } },
      );
    }

    case "setSendFailure":
      return { ...state, sendFailure: action.sendFailure };
  }
}

export function deskReducer(state: DeskState, action: DeskAction): DeskState {
  const next = reduce(state, action);
  if (next.openId === state.openId) return next;
  // The Escalate popover and decision feedback belong to the conversation they were raised on.
  const staleBarNotice = next.notice?.where === "bar" && next.notice === state.notice;
  return { ...next, escalateOpen: false, notice: staleBarNotice ? null : next.notice };
}

export const DeskContext = createContext<{ state: DeskState; dispatch: Dispatch<DeskAction> } | null>(null);

export function useDesk() {
  const desk = use(DeskContext);
  if (!desk) throw new Error("useDesk must be used inside <Desk>");
  return desk;
}
