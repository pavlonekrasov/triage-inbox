import { describe, expect, it } from "vitest";
import { DEMO_NOW } from "@/lib/clock";
import { createDeskState, deskReducer, rowsFor } from "./desk-store";

const start = (ticketId: string, lane: "needs_you" | "drafts" | "auto_resolved") =>
  createDeskState({ lane, ticketId, listState: "live" });

describe("dismiss and restore", () => {
  it("snoozes a ticket out of its lane, opens the next row, and offers Undo", () => {
    const state = deskReducer(start("t17", "drafts"), { type: "dismiss", id: "t17", kind: "snoozed", now: DEMO_NOW });
    expect(rowsFor(state.listState, "drafts", state.dismissed).some((t) => t.id === "t17")).toBe(false);
    expect(state.openId).not.toBe("t17");
    expect(state.openId).not.toBeNull();
    expect(state.notice?.text).toBe("Snoozed Maya Ruiz until 19:44.");
    expect(state.notice?.action?.label).toBe("Undo snooze");
  });

  it("restores the ticket to its lane and reopens it on Undo", () => {
    const snoozed = deskReducer(start("t17", "drafts"), { type: "dismiss", id: "t17", kind: "snoozed", now: DEMO_NOW });
    const away = deskReducer(snoozed, { type: "selectLane", lane: "needs_you" });
    const restored = deskReducer(away, { type: "restore", id: "t17" });
    expect(restored.lane).toBe("drafts");
    expect(restored.openId).toBe("t17");
    expect(rowsFor(restored.listState, "drafts", restored.dismissed).some((t) => t.id === "t17")).toBe(true);
  });

  it.each([
    ["t06", "snoozed"],
    ["t06", "spam"],
    ["t03", "snoozed"],
    ["t13", "spam"],
  ] as const)("keeps %s in the queue when asked to mark it %s", (id, kind) => {
    const state = deskReducer(start(id, "needs_you"), { type: "dismiss", id, kind, now: DEMO_NOW });
    expect(state.dismissed[id]).toBeUndefined();
    expect(state.openId).toBe(id);
    expect(state.notice?.where).toBe("thread");
  });

  it("allows snoozing a privacy request, which only blocks spam", () => {
    const state = deskReducer(start("t13", "needs_you"), { type: "dismiss", id: "t13", kind: "snoozed", now: DEMO_NOW });
    expect(state.dismissed.t13?.kind).toBe("snoozed");
  });
});
