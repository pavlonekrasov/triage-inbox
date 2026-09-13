import { describe, expect, it } from "vitest";
import { TICKETS } from "@/data/tickets";
import { DEMO_NOW } from "@/lib/clock";
import { NO_APPROVAL_RULES } from "@/lib/route";
import type { Lane } from "@/lib/types";
import { createDeskState, deskReducer, hiddenIds, rowsFor, type DeskAction, type DeskState } from "./desk-store";

const WALL = 1_000_000;
const now = DEMO_NOW;
const start = (ticketId: string, lane: Lane) => createDeskState({ lane, ticketId, listState: "live" });
const run = (state: DeskState, ...actions: DeskAction[]) => actions.reduce(deskReducer, state);
const inLane = (state: DeskState, lane: Lane, id: string) =>
  rowsFor(state.listState, lane, hiddenIds(state)).some((t) => t.id === id);

describe("dismiss and restore", () => {
  it("snoozes a ticket out of its lane, opens the next row, and offers Undo", () => {
    const state = deskReducer(start("t17", "drafts"), { type: "dismiss", id: "t17", kind: "snoozed", now });
    expect(inLane(state, "drafts", "t17")).toBe(false);
    expect(state.openId).not.toBe("t17");
    expect(state.openId).not.toBeNull();
    expect(state.notice?.text).toBe("Snoozed Maya Ruiz until 19:44.");
    expect(state.notice?.action?.label).toBe("Undo snooze");
  });

  it("restores the ticket to its lane and reopens it on Undo", () => {
    const restored = run(
      start("t17", "drafts"),
      { type: "dismiss", id: "t17", kind: "snoozed", now },
      { type: "selectLane", lane: "needs_you" },
      { type: "restore", id: "t17" },
    );
    expect(restored.lane).toBe("drafts");
    expect(restored.openId).toBe("t17");
    expect(inLane(restored, "drafts", "t17")).toBe(true);
  });

  it.each([
    ["t06", "snoozed"],
    ["t06", "spam"],
    ["t03", "snoozed"],
    ["t13", "spam"],
  ] as const)("keeps %s in the queue when asked to mark it %s", (id, kind) => {
    const state = deskReducer(start(id, "needs_you"), { type: "dismiss", id, kind, now });
    expect(state.dismissed[id]).toBeUndefined();
    expect(state.openId).toBe(id);
    expect(state.notice?.where).toBe("thread");
  });

  it("allows snoozing a privacy request, which only blocks spam", () => {
    const state = deskReducer(start("t13", "needs_you"), { type: "dismiss", id: "t13", kind: "snoozed", now });
    expect(state.dismissed.t13?.kind).toBe("snoozed");
  });
});

describe("approve and undo (brief 9.3)", () => {
  it("sends optimistically: the row leaves Drafts, the next ticket opens with focus, the reply waits out the window", () => {
    const state = run(start("t17", "drafts"), { type: "approve", now, wall: WALL });
    expect(state.outbox.t17).toMatchObject({ status: "undoable", undoUntil: WALL + 5000, draftId: "t17-draft", edited: false });
    expect(inLane(state, "drafts", "t17")).toBe(false);
    expect(state.openId).not.toBe("t17");
    expect(state.focusRequest?.id).toBe(state.openId);
  });

  it("restores the draft, the row, the lane and focus on Undo", () => {
    const undone = run(
      start("t17", "drafts"),
      { type: "approve", now, wall: WALL },
      { type: "selectLane", lane: "needs_you" },
      { type: "undoSend" },
    );
    expect(undone.outbox.t17).toBeUndefined();
    expect(undone.lane).toBe("drafts");
    expect(undone.openId).toBe("t17");
    expect(undone.focusRequest?.id).toBe("t17");
    expect(inLane(undone, "drafts", "t17")).toBe(true);
  });

  it("commits when the window closes, then marks the reply sent, after which Undo does nothing", () => {
    const sent = run(start("t17", "drafts"), { type: "approve", now, wall: WALL });
    const { attempt } = sent.outbox.t17;
    const delivered = run(sent, { type: "commitSend", id: "t17", attempt }, { type: "sendSettled", id: "t17", attempt, ok: true });
    expect(delivered.outbox.t17.status).toBe("sent");
    expect(deskReducer(delivered, { type: "undoSend", id: "t17" })).toBe(delivered);
  });

  it("puts a failed send back in its lane with a notice, and retries as a new attempt", () => {
    const sent = run(start("t17", "drafts"), { type: "approve", now, wall: WALL });
    const { attempt } = sent.outbox.t17;
    const failed = run(sent, { type: "commitSend", id: "t17", attempt }, { type: "sendSettled", id: "t17", attempt, ok: false });
    expect(failed.outbox.t17.status).toBe("failed");
    expect(inLane(failed, "drafts", "t17")).toBe(true);
    expect(failed.notice?.text).toBe("Your reply to Maya Ruiz wasn't sent. It's back in Drafts.");

    const retried = deskReducer(failed, { type: "retrySend", id: "t17" });
    expect(retried.outbox.t17.status).toBe("sending");
    expect(retried.outbox.t17.attempt).not.toBe(attempt);
    // A result that arrives late from the earlier attempt no longer counts.
    expect(deskReducer(retried, { type: "sendSettled", id: "t17", attempt, ok: true }).outbox.t17.status).toBe("sending");
  });

  it("keeps an auto-resolved ticket in its lane after a follow-up", () => {
    const state = run(
      start("t01", "auto_resolved"),
      { type: "decide", now, wall: WALL },
      { type: "composerInput", text: "Hi Emma, checking the cancellation went through for you." },
      { type: "sendComposer", now, wall: WALL },
    );
    expect(state.outbox.t01).toMatchObject({ status: "undoable", draftId: null });
    expect(state.openId).toBe("t01");
    expect(inLane(state, "auto_resolved", "t01")).toBe(true);
  });
});

describe("review gate 9 through the reducer", () => {
  const guarded = TICKETS.filter((t) => t.triage.hardRules.some((r) => (NO_APPROVAL_RULES as readonly string[]).includes(r)));

  it.each(guarded.map((t) => [t.id, t] as const))("never lets A send %s", (id, t) => {
    const choices = t.triage.drafts.map((d): DeskAction => ({ type: "chooseVariant", draftId: d.id }));
    const state = run(start(id, "needs_you"), ...choices, { type: "approve", now, wall: WALL });
    expect(state.outbox[id]).toBeUndefined();
    expect(state.notice?.where).toBe("bar");
  });

  it("explains a refused A in words next to the bar", () => {
    const state = run(start("t06", "needs_you"), { type: "approve", now, wall: WALL });
    expect(state.notice).toMatchObject({ where: "bar", text: "Approve is off for wellbeing cases. Take over instead." });
  });
});

describe("two outcomes, take-over and acknowledgment", () => {
  it("refuses to send ticket 2 until Refund or Decline is chosen, then sends the chosen reply", () => {
    const refused = run(start("t02", "needs_you"), { type: "decide", now, wall: WALL });
    expect(refused.outbox.t02).toBeUndefined();
    expect(refused.notice?.text).toMatch(/^Choose Refund or Decline first/);
    const sent = run(refused, { type: "chooseVariant", draftId: "t02-decline" }, { type: "decide", now, wall: WALL });
    expect(sent.outbox.t02).toMatchObject({ draftId: "t02-decline", status: "undoable" });
  });

  it("takes over a wellbeing case into an empty composer and sends nothing until the person writes", () => {
    const state = run(start("t06", "needs_you"), { type: "decide", now, wall: WALL });
    expect(state.takenOver.t06).toBeDefined();
    expect(state.composer).toMatchObject({ ticketId: "t06", mode: "take-over", text: "" });
    const empty = deskReducer(state, { type: "sendComposer", now, wall: WALL });
    expect(empty.outbox.t06).toBeUndefined();
    expect(empty.notice?.text).toBe("Write a reply before sending.");
  });

  it("acknowledges a safety report with the fixed text, records the review, and never opens it for editing", () => {
    const state = run(start("t03", "needs_you"), { type: "decide", now, wall: WALL });
    expect(state.outbox.t03).toMatchObject({ draftId: "t03-ack", edited: false, events: ["Review opened with Trust & Safety"] });
    expect(run(start("t03", "needs_you"), { type: "openComposer" }).composer).toBeNull();
  });
});

describe("edit composer", () => {
  it("opens the draft, marks a changed reply as edited, and reopens the edit on Undo", () => {
    const opened = run(start("t17", "drafts"), { type: "openComposer" });
    expect(opened.composer).toMatchObject({ mode: "edit", draftId: "t17-draft" });
    const sent = run(
      opened,
      { type: "composerInput", text: `${opened.composer?.text} Reply here if anything looks wrong.` },
      { type: "sendComposer", now, wall: WALL },
    );
    expect(sent.outbox.t17.edited).toBe(true);
    expect(sent.composer).toBeNull();
    expect(deskReducer(sent, { type: "undoSend" }).composer?.text).toContain("Reply here if anything looks wrong.");
  });

  it("holds an English reply to a customer who wrote in Spanish until it is translated back", () => {
    const state = run(
      start("t07", "drafts"),
      { type: "openComposer" },
      { type: "composerRewrite", text: "Hi Diego", language: "en" },
      { type: "sendComposer", now, wall: WALL },
    );
    expect(state.outbox.t07).toBeUndefined();
    expect(state.notice?.text).toMatch(/^Translate the reply back to Spanish/);
  });
});

describe("escalation", () => {
  it("moves the case to the team with a notice, and Undo brings it back open", () => {
    const state = run(start("t02", "needs_you"), {
      type: "escalate",
      team: "billing",
      reasons: ["Refund decision"],
      note: "Please confirm which record is right.",
      now,
    });
    expect(inLane(state, "needs_you", "t02")).toBe(false);
    expect(state.notice?.text).toBe("Escalated Jordan Kim to Billing.");
    const action = state.notice?.action?.dispatch;
    if (!action) throw new Error("no undo action");
    const undone = deskReducer(state, action);
    expect(inLane(undone, "needs_you", "t02")).toBe(true);
    expect(undone.openId).toBe("t02");
  });
});
