import { describe, expect, it } from "vitest";
import { DEMO_NOW } from "@/lib/clock";
import { DRAFT_RETRY_MS } from "@/lib/decision";
import type { DeskInit } from "@/lib/desk-params";
import type { Lane } from "@/lib/types";
import { contextFor, createDeskState, deskReducer, laneRows, restamp, type DeskAction, type DeskState } from "./desk-store";

/* The states catalogue (brief 12) and phone navigation (brief 7.2). */

const WALL = 1_000_000;
const now = DEMO_NOW;
const run = (state: DeskState, ...actions: DeskAction[]) => actions.reduce(deskReducer, state);
const inLane = (state: DeskState, lane: Lane, id: string) => laneRows(state, lane).some((t) => t.id === id);
const open = (ticketId: string, lane: Lane, extra: Partial<DeskInit> = {}) =>
  createDeskState({ lane, ticketId, listState: "live", ...extra });

describe("drafting", () => {
  it("holds A and E while the AI drafts, and says why", () => {
    const approved = run(open("t17", "drafts", { draft: "drafting" }), { type: "approve", now, wall: WALL });
    expect(approved.outbox.t17).toBeUndefined();
    expect(approved.notice?.text).toBe("The AI is still drafting this reply. Escalate now, or wait for the draft.");
    const edited = run(open("t17", "drafts", { draft: "drafting" }), { type: "openComposer" });
    expect(edited.composers.t17).toBeUndefined();
    expect(edited.notice?.text).toBe("The AI is still drafting. There's nothing to edit yet.");
  });

  it("keeps a draft that is not ready out of bulk selection", () => {
    const drafting = open("t17", "drafts", { draft: "drafting" });
    expect(run(drafting, { type: "toggleCheck", id: "t17" }).checked).not.toContain("t17");
    expect(run(drafting, { type: "selectSureDrafts" }).checked).not.toContain("t17");
  });

  it("keeps a state set from the prototype controls until it is changed", () => {
    const pinned = open("t17", "drafts", { draft: "drafting" });
    expect(deskReducer(pinned, { type: "draftSettled", id: "t17" })).toBe(pinned);
    expect(deskReducer(pinned, { type: "setDraftStatus", id: "t17", status: null }).draftStatus.t17).toBeUndefined();
  });

  it("ignores draft states on a conversation the AI already answered", () => {
    const answered = open("t01", "auto_resolved");
    expect(deskReducer(answered, { type: "setDraftStatus", id: "t01", status: "failed" })).toBe(answered);
  });
});

describe("draft failed", () => {
  const writtenReply = () => run(open("t17", "drafts", { draft: "failed" }),
    { type: "decide", now, wall: WALL },
    { type: "composerInput", id: "t17", text: "Here are the steps you need." },
    { type: "sendComposer", id: "t17", now, wall: WALL });

  it("restores a manually written reply to Needs you on Undo", () => {
    const restored = deskReducer(writtenReply(), { type: "undoSend", id: "t17" });
    expect(restored.lane).toBe("needs_you");
    expect(inLane(restored, restored.lane, "t17")).toBe(true);
    expect(restored.composers.t17.text).toBe("Here are the steps you need.");
  });

  it("names the current lane after a manual send fails and reopens it there", () => {
    const sent = writtenReply();
    const attempt = sent.outbox.t17.attempt;
    const failed = run(sent,
      { type: "commitSend", id: "t17", attempt },
      { type: "sendSettled", id: "t17", attempt, ok: false });
    expect(failed.notice?.text).toContain("back in Needs you");
    const revealed = deskReducer(failed, { type: "reveal", id: "t17" });
    expect(revealed.lane).toBe("needs_you");
  });
  it("drops the case to Needs you, open, with writing in place of approval", () => {
    const state = open("t17", "drafts", { draft: "failed" });
    expect(state.lane).toBe("needs_you");
    expect(state.openId).toBe("t17");
    expect(inLane(state, "needs_you", "t17")).toBe(true);
    expect(inLane(state, "drafts", "t17")).toBe(false);
    expect(contextFor(state, "t17").draft).toBe("failed");
  });

  it("moves an open case with it when the draft fails from the controls", () => {
    const failed = deskReducer(open("t17", "drafts"), { type: "setDraftStatus", id: "t17", status: "failed" });
    expect(failed.lane).toBe("needs_you");
    expect(failed.openId).toBe("t17");
  });

  it("brings the open case back to Drafts on Retry, and the draft arrives when the retry settles", () => {
    const retried = run(open("t17", "drafts", { draft: "failed" }), { type: "retryDraft", id: "t17", wall: WALL });
    expect(retried.lane).toBe("drafts");
    expect(retried.draftStatus.t17).toEqual({ status: "drafting", settlesAt: WALL + DRAFT_RETRY_MS });
    expect(deskReducer(retried, { type: "draftSettled", id: "t17" }).draftStatus.t17).toBeUndefined();
  });
});

describe("collision", () => {
  it("asks once before sending while a colleague views the conversation, then sends", () => {
    const asked = run(open("t17", "drafts", { viewer: true }), { type: "approve", now, wall: WALL });
    expect(asked.outbox.t17).toBeUndefined();
    expect(asked.notice?.text).toBe("Ana is viewing this conversation too. Send anyway?");
    expect(asked.notice?.action?.label).toBe("Send reply anyway");
    expect(deskReducer(asked, { type: "approve", now, wall: WALL }).outbox.t17?.status).toBe("undoable");
  });

  it("withdraws the question when the specialist opens another conversation or the notice times out", () => {
    const asked = run(open("t17", "drafts", { viewer: true }), { type: "approve", now, wall: WALL });
    const away = run(asked, { type: "activate", id: "t21" }, { type: "activate", id: "t17" });
    expect(away.confirmSend).toBeNull();
    const timedOut = deskReducer(asked, { type: "clearNotice", id: asked.notice!.id });
    expect(timedOut.confirmSend).toBeNull();
    expect(deskReducer(timedOut, { type: "approve", now, wall: WALL }).outbox.t17).toBeUndefined();
  });

  it("keeps a viewed draft out of bulk selection", () => {
    expect(run(open("t17", "drafts", { viewer: true }), { type: "toggleCheck", id: "t17" }).checked).not.toContain("t17");
  });

  it("replays a notice action with the clock of the moment it runs", () => {
    expect(restamp({ type: "decide", now: 1, wall: 2 }, 3, 4)).toEqual({ type: "decide", now: 3, wall: 4 });
    expect(restamp({ type: "toggleMarkWrong", now: 1 }, 3, 4)).toEqual({ type: "toggleMarkWrong", now: 3 });
    expect(restamp({ type: "restore", id: "t17" }, 3, 4)).toEqual({ type: "restore", id: "t17" });
  });
});

describe("offline", () => {
  it("queues a reply when its undo window closes, takes the case out of its lane, and sends on reconnect", () => {
    const approved = run(open("t17", "drafts", { offline: true }), { type: "approve", now, wall: WALL });
    const queued = deskReducer(approved, { type: "commitSend", id: "t17", attempt: approved.outbox.t17.attempt });
    expect(queued.outbox.t17.status).toBe("queued");
    expect(inLane(queued, "drafts", "t17")).toBe(false);
    const back = deskReducer(queued, { type: "setOnline", online: true });
    expect(back.outbox.t17.status).toBe("sending");
    expect(back.notice?.text).toBe("Back online. 1 queued reply is sending.");
  });

  it("queues a retried send while offline", () => {
    const approved = run(open("t17", "drafts"), { type: "approve", now, wall: WALL });
    const { attempt } = approved.outbox.t17;
    const failed = run(
      approved,
      { type: "commitSend", id: "t17", attempt },
      { type: "sendSettled", id: "t17", attempt, ok: false },
      { type: "setOnline", online: false },
      { type: "retrySend", id: "t17" },
    );
    expect(failed.outbox.t17.status).toBe("queued");
  });
});

describe("phone navigation", () => {
  it("pushes the conversation when opened from a notice after Back", () => {
    const list = run(open("t17", "drafts"), { type: "back" });
    expect(deskReducer(list, { type: "reveal", id: "t17" }).threadPushed).toBe(true);
  });
  it("pushes the thread when a row opens and returns to the list with Back, with focus on the row", () => {
    const list = createDeskState({ lane: "drafts", ticketId: null, listState: "live" });
    expect(list.threadPushed).toBe(false);
    const pushed = deskReducer(list, { type: "activate", id: "t17" });
    expect(pushed.threadPushed).toBe(true);
    const back = deskReducer(pushed, { type: "back" });
    expect(back.threadPushed).toBe(false);
    expect(back.focusRequest?.id).toBe("t17");
  });

  it("opens a linked conversation already pushed", () => {
    expect(open("t17", "drafts").threadPushed).toBe(true);
  });
});
