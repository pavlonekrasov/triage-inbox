import { describe, expect, it } from "vitest";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import { DEMO_NOW } from "@/lib/clock";
import { NO_APPROVAL_RULES } from "@/lib/route";
import type { Lane } from "@/lib/types";
import {
  createDeskState,
  deskReducer,
  hiddenIds,
  isContextOpen,
  rowsFor,
  threadOverlay,
  type DeskAction,
  type DeskState,
} from "./desk-store";

const WALL = 1_000_000;
const now = DEMO_NOW;
const start = (ticketId: string, lane: Lane) => createDeskState({ lane, ticketId, listState: "live" });
const run = (state: DeskState, ...actions: DeskAction[]) => actions.reduce(deskReducer, state);
const inLane = (state: DeskState, lane: Lane, id: string) =>
  rowsFor(state.listState, lane, hiddenIds(state)).some((t) => t.id === id);

/** Commits the reply on a ticket and settles the send. */
const deliver = (state: DeskState, id: string, ok = true) => {
  const { attempt } = state.outbox[id];
  return run(state, { type: "commitSend", id, attempt }, { type: "sendSettled", id, attempt, ok });
};

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
    const delivered = deliver(run(start("t17", "drafts"), { type: "approve", now, wall: WALL }), "t17");
    expect(delivered.outbox.t17.status).toBe("sent");
    expect(deskReducer(delivered, { type: "undoSend", id: "t17" })).toBe(delivered);
  });

  it("puts a failed send back in its lane with a notice, and retries as a new attempt", () => {
    const sent = run(start("t17", "drafts"), { type: "approve", now, wall: WALL });
    const { attempt } = sent.outbox.t17;
    const failed = deliver(sent, "t17", false);
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
      { type: "composerInput", id: "t01", text: "Hi Emma, checking the cancellation went through for you." },
      { type: "sendComposer", id: "t01", now, wall: WALL },
    );
    expect(state.outbox.t01).toMatchObject({ status: "undoable", draftId: null });
    expect(state.openId).toBe("t01");
    expect(inLane(state, "auto_resolved", "t01")).toBe(true);
  });
});

describe("follow-ups keep what was already sent", () => {
  // Approve Maya's draft, deliver it, and come back to her conversation.
  const answered = () =>
    run(deliver(run(start("t17", "drafts"), { type: "approve", now, wall: WALL }), "t17"), { type: "reveal", id: "t17" });

  const followUp = (state: DeskState) =>
    run(
      state,
      { type: "decide", now, wall: WALL },
      { type: "composerInput", id: "t17", text: "One more thing: you keep access until 20 Sep." },
      { type: "sendComposer", id: "t17", now: now + 60_000, wall: WALL + 60_000 },
    );

  it("shows the delivered reply and the follow-up, in order", () => {
    const state = followUp(answered());
    const bodies = threadOverlay(state, TICKETS_BY_ID.get("t17")!).replies?.map((r) => r.body);
    expect(bodies).toHaveLength(2);
    expect(bodies?.[1]).toBe("One more thing: you keep access until 20 Sep.");
    expect(inLane(state, "drafts", "t17")).toBe(false);
  });

  it("undoes only the follow-up: the first reply stays delivered and the case stays out of Drafts", () => {
    const undone = deskReducer(followUp(answered()), { type: "undoSend", id: "t17" });
    expect(undone.outbox.t17).toMatchObject({ status: "sent", draftId: "t17-draft" });
    expect(threadOverlay(undone, TICKETS_BY_ID.get("t17")!).replies).toHaveLength(1);
    expect(inLane(undone, "drafts", "t17")).toBe(false);
  });

  it("keeps a case answered when its follow-up fails", () => {
    const failed = deliver(followUp(answered()), "t17", false);
    expect(failed.outbox.t17.status).toBe("failed");
    expect(inLane(failed, "drafts", "t17")).toBe(false);
  });

  it("refuses a follow-up while the reply before it is still in its undo window", () => {
    const state = run(start("t01", "auto_resolved"), { type: "decide", now, wall: WALL });
    const sending = run(
      state,
      { type: "composerInput", id: "t01", text: "Hi Emma, a quick check-in." },
      { type: "sendComposer", id: "t01", now, wall: WALL },
      { type: "decide", now, wall: WALL },
    );
    expect(sending.composers.t01).toBeUndefined();
    expect(sending.notice?.text).toBe("Your reply is still sending. Follow up once it's delivered.");
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
    expect(state.composers.t06).toMatchObject({ ticketId: "t06", mode: "take-over", text: "" });
    const empty = deskReducer(state, { type: "sendComposer", id: "t06", now, wall: WALL });
    expect(empty.outbox.t06).toBeUndefined();
    expect(empty.notice?.text).toBe("Write a reply before sending.");
  });

  it("acknowledges a safety report with the fixed text, records the review, and never opens it for editing", () => {
    const state = run(start("t03", "needs_you"), { type: "decide", now, wall: WALL });
    expect(state.outbox.t03).toMatchObject({ draftId: "t03-ack", edited: false, events: ["Review opened with Trust & Safety"] });
    expect(run(start("t03", "needs_you"), { type: "openComposer" }).composers.t03).toBeUndefined();
  });
});

describe("edit composer", () => {
  it("opens the draft, marks a changed reply as edited, and reopens the edit on Undo", () => {
    const opened = run(start("t17", "drafts"), { type: "openComposer" });
    expect(opened.composers.t17).toMatchObject({ mode: "edit", draftId: "t17-draft" });
    const sent = run(
      opened,
      { type: "composerInput", id: "t17", text: `${opened.composers.t17.text} Reply here if anything looks wrong.` },
      { type: "sendComposer", id: "t17", now, wall: WALL },
    );
    expect(sent.outbox.t17.edited).toBe(true);
    expect(sent.composers.t17).toBeUndefined();
    expect(deskReducer(sent, { type: "undoSend" }).composers.t17?.text).toContain("Reply here if anything looks wrong.");
  });

  it("keeps an unsent edit on one conversation while the specialist edits another", () => {
    const state = run(
      start("t17", "drafts"),
      { type: "openComposer" },
      { type: "composerInput", id: "t17", text: "My careful edit" },
      { type: "activate", id: "t18" },
      { type: "openComposer" },
    );
    expect(state.composers.t17?.text).toBe("My careful edit");
    expect(state.composers.t18).toMatchObject({ draftId: "t18-draft" });
    expect(run(state, { type: "activate", id: "t17" }).composers.t17?.text).toBe("My careful edit");
  });

  it("holds an English reply to a customer who wrote in Spanish until it is translated back", () => {
    const state = run(
      start("t07", "drafts"),
      { type: "openComposer" },
      { type: "composerRewrite", id: "t07", text: "Hi Diego", language: "en" },
      { type: "sendComposer", id: "t07", now, wall: WALL },
    );
    expect(state.outbox.t07).toBeUndefined();
    expect(state.notice?.text).toMatch(/^Translate the reply back to Spanish/);
  });
});

describe("escalation", () => {
  const escalate: DeskAction = {
    type: "escalate",
    team: "billing",
    reasons: ["Refund decision"],
    note: "Please confirm which record is right.",
    now,
  };

  it("moves the case to the team with a notice, and Undo brings it back open", () => {
    const state = run(start("t02", "needs_you"), escalate);
    expect(inLane(state, "needs_you", "t02")).toBe(false);
    expect(state.notice?.text).toBe("Escalated Jordan Kim to Billing.");
    const action = state.notice?.action?.dispatch;
    if (!action) throw new Error("no undo action");
    const undone = deskReducer(state, action);
    expect(inLane(undone, "needs_you", "t02")).toBe(true);
    expect(undone.openId).toBe("t02");
  });

  it.each<DeskAction>([
    { type: "approve", now, wall: WALL },
    { type: "decide", now, wall: WALL },
    { type: "openComposer" },
    { type: "setEscalateOpen", open: true },
  ])("does nothing but explain when $type is pressed on an escalated case still on screen", (action) => {
    const escalated = run(start("t17", "drafts"), escalate, { type: "reveal", id: "t17" });
    const state = deskReducer(escalated, action);
    expect(state.outbox.t17).toBeUndefined();
    expect(state.composers.t17).toBeUndefined();
    expect(state.escalateOpen).toBe(false);
    expect(state.notice).toMatchObject({ where: "bar", text: "This case is with Billing now, so there is nothing to decide here." });
  });
});

describe("context panel", () => {
  it("is open on a wide desk and closed where it would be a sheet, until the specialist chooses", () => {
    const state = start("t04", "needs_you");
    expect(isContextOpen(state, true)).toBe(true);
    expect(isContextOpen(state, false)).toBe(false);
    const closed = deskReducer(state, { type: "setContextOpen", open: false });
    expect(isContextOpen(closed, true)).toBe(false);
  });

  it("opens the panel and the section, and asks for the row again each time a citation is followed", () => {
    const state = run(
      start("t05", "drafts"),
      { type: "setContextOpen", open: false },
      { type: "toggleSection", section: "sources" },
      { type: "focusContext", section: "sources", target: "source:src-credits-v3" },
    );
    expect(state.contextPanel).toBe("open");
    expect(state.collapsedSections).not.toContain("sources");
    expect(state.contextFocus?.target).toBe("source:src-credits-v3");
    const again = deskReducer(state, { type: "focusContext", section: "sources", target: "source:src-credits-v3" });
    expect(again.contextFocus?.nonce).not.toBe(state.contextFocus?.nonce);
  });

  it("logs the first email reveal in the thread, once", () => {
    const state = run(
      start("t02", "needs_you"),
      { type: "revealEmail", id: "t02", now },
      { type: "revealEmail", id: "t02", now: now + 60_000 },
    );
    const logged = threadOverlay(state, TICKETS_BY_ID.get("t02")!).events?.filter((e) => e.text === "Email address revealed by you");
    expect(logged).toEqual([{ at: new Date(now).toISOString(), text: "Email address revealed by you" }]);
  });
});

describe("context panel requests", () => {
  it("clears a row request once the panel has handled it, so showing the panel again does not replay it", () => {
    const asked = deskReducer(start("t04", "needs_you"), { type: "focusContext", section: "billing", target: "billing-conflict" });
    const nonce = asked.contextFocus?.nonce ?? -1;
    expect(deskReducer(asked, { type: "contextFocusDone", nonce: nonce + 1 }).contextFocus).not.toBeNull();
    expect(deskReducer(asked, { type: "contextFocusDone", nonce }).contextFocus).toBeNull();
  });

  it("drops a row request when another conversation opens", () => {
    const state = run(
      start("t04", "needs_you"),
      { type: "focusContext", section: "billing", target: "billing-conflict" },
      { type: "activate", id: "t02" },
    );
    expect(state.contextFocus).toBeNull();
  });
});

describe("bulk approval (brief 9.2, 9.3)", () => {
  const selected = () => run(start("t17", "drafts"), { type: "selectSureDrafts" });
  const previewed = () => deskReducer(selected(), { type: "setBulkPreview", open: true });

  it("opens a preview before anything is sent, and refuses to preview an empty selection", () => {
    const state = previewed();
    expect(state.bulkPreview).toBe(true);
    expect(Object.keys(state.outbox)).toEqual([]);
    const empty = run(start("t17", "drafts"), { type: "enterSelection" }, { type: "setBulkPreview", open: true });
    expect(empty.bulkPreview).toBe(false);
    expect(empty.notice?.text).toMatch(/^Select drafts to review first/);
  });

  it("opens the preview instead of sending when bulk approval is asked for without it", () => {
    const state = deskReducer(selected(), { type: "bulkApprove", now, wall: WALL });
    expect(state.bulkPreview).toBe(true);
    expect(Object.keys(state.outbox)).toEqual([]);
  });

  it("sends every selected draft as one batch with one Undo toast, and leaves selection", () => {
    const before = previewed();
    const ids = [...before.checked];
    expect(ids).toHaveLength(6);
    const sent = deskReducer(before, { type: "bulkApprove", now, wall: WALL });
    const batches = new Set(ids.map((id) => sent.outbox[id]?.batch));
    expect(batches.size).toBe(1);
    expect([...batches][0]).not.toBeNull();
    for (const id of ids) expect(inLane(sent, "drafts", id), id).toBe(false);
    expect(sent.editMode).toBe(false);
    expect(sent.notice).toMatchObject({ where: "list", text: "6 replies sent.", undoUntil: WALL + 5000 });
  });

  it("brings the whole batch back, still selected, from the toast or from Z", () => {
    const before = previewed();
    const sent = deskReducer(before, { type: "bulkApprove", now, wall: WALL });
    const toastUndo = sent.notice?.action?.dispatch;
    if (!toastUndo) throw new Error("no undo on the toast");
    for (const undo of [toastUndo, { type: "undoSend" } as DeskAction]) {
      const back = deskReducer(sent, undo);
      expect(Object.keys(back.outbox)).toEqual([]);
      expect(back.editMode).toBe(true);
      expect([...back.checked].sort()).toEqual([...before.checked].sort());
      for (const id of before.checked) expect(inLane(back, "drafts", id), id).toBe(true);
    }
  });

  it("never sends what bulk selection refuses, even when it is in the selection (review gate 9)", () => {
    const forged: DeskState = { ...start("t17", "drafts"), editMode: true, bulkPreview: true, checked: ["t17", "t02", "t06", "t05"] };
    const sent = deskReducer(forged, { type: "bulkApprove", now, wall: WALL });
    expect(Object.keys(sent.outbox).sort()).toEqual(["t05", "t17"]);
  });

  it("closes the preview when the selection empties", () => {
    let state = previewed();
    for (const id of [...state.checked]) state = deskReducer(state, { type: "toggleCheck", id });
    expect(state.bulkPreview).toBe(false);
  });

  it("opens Escalate on the team chosen in the palette, and forgets it when the popover closes", () => {
    const state = deskReducer(start("t17", "drafts"), { type: "setEscalateOpen", open: true, team: "privacy" });
    expect(state).toMatchObject({ escalateOpen: true, escalateTeam: "privacy" });
    expect(deskReducer(state, { type: "setEscalateOpen", open: false }).escalateTeam).toBeNull();
  });
});
