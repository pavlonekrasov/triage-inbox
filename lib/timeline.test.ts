import { describe, expect, it } from "vitest";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import { DEMO_NOW } from "./clock";
import { buildTimeline, hasTranslation } from "./timeline";

const ticket = (id: string) => {
  const t = TICKETS_BY_ID.get(id);
  if (!t) throw new Error(`missing fixture ${id}`);
  return t;
};

const shape = (id: string) =>
  buildTimeline(ticket(id)).map((item) => {
    switch (item.kind) {
      case "day":
        return `day:${item.label}`;
      case "message":
        return `message:${item.message.author}`;
      case "steps":
        return `steps:${item.steps.map((s) => s.kind).join(",")}`;
      case "draft":
        return `draft:${item.variantCount}`;
      default:
        return item.kind;
    }
  });

describe("buildTimeline", () => {
  it("reads a reopened ticket across two days: old exchange, new message, AI steps, then the draft", () => {
    expect(shape("t12")).toEqual([
      "day:11 Sep",
      "message:customer",
      "message:auto",
      "day:Today",
      "message:customer",
      "steps:classified,checked_account,retrieved,routed,drafted",
      "draft:1",
    ]);
  });

  it("places an auto-sent reply after the steps that produced it, followed by the spot-check marker", () => {
    expect(shape("t08")).toEqual([
      "day:Today",
      "message:customer",
      "steps:classified,checked_account,retrieved,routed,drafted",
      "message:auto",
      "spot-check",
    ]);
  });

  it("shows no draft for a wellbeing case", () => {
    expect(shape("t06")).toEqual(["day:Today", "message:customer", "steps:classified,checked_account,retrieved,routed"]);
  });

  it("shows both variants of a two-outcome case until one is chosen, then only that one", () => {
    expect(shape("t02").slice(-2)).toEqual(["draft:2", "draft:2"]);
    const drafts = buildTimeline(ticket("t02"), undefined, { chosenDraftId: "t02-decline" }).filter((i) => i.kind === "draft");
    expect(drafts.map((i) => i.key)).toEqual(["t02-decline"]);
  });

  it("puts a sent reply in the draft's place under the draft's key, so the bubble changes in place", () => {
    const at = new Date(DEMO_NOW).toISOString();
    const before = buildTimeline(ticket("t17")).at(-1);
    const after = buildTimeline(ticket("t17"), undefined, {
      replies: [{ id: "1", body: "Hi Maya", language: "en-US", draftId: "t17-draft", edited: false, at, status: "undoable" }],
    });
    expect(after.at(-1)).toMatchObject({ kind: "reply", key: before?.key });
    expect(after.some((i) => i.kind === "draft")).toBe(false);
  });

  it("keeps the first reply when a follow-up is sent after it", () => {
    const at = new Date(DEMO_NOW).toISOString();
    const later = new Date(DEMO_NOW + 60_000).toISOString();
    const items = buildTimeline(ticket("t17"), undefined, {
      replies: [
        { id: "1", body: "Hi Maya", language: "en-US", draftId: "t17-draft", edited: false, at, status: "sent" },
        { id: "2", body: "One more thing", language: "en-US", draftId: null, edited: false, at: later, status: "undoable" },
      ],
    });
    const replies = items.filter((i) => i.kind === "reply");
    expect(replies.map((i) => i.key)).toEqual(["t17-draft", "reply-2"]);
  });

  it("does not show the draft that is open in the composer", () => {
    expect(buildTimeline(ticket("t17"), undefined, { editingDraftId: "t17-draft" }).some((i) => i.kind === "draft")).toBe(false);
  });

  it("records the specialist's action after the reply it belongs to", () => {
    const at = new Date(DEMO_NOW).toISOString();
    const items = buildTimeline(ticket("t03"), undefined, {
      replies: [{ id: "1", body: "Hi Camille", language: "en-GB", draftId: "t03-ack", edited: false, at, status: "sent" }],
      events: [{ at, text: "Review opened with Trust & Safety" }],
    });
    expect(items.slice(-2).map((i) => i.kind)).toEqual(["reply", "event"]);
  });

  it("never renders a 'sent' step as a service message", () => {
    for (const t of TICKETS) {
      for (const item of buildTimeline(t)) {
        if (item.kind === "steps") expect(item.steps.some((s) => s.kind === "sent")).toBe(false);
      }
    }
  });

  it("gives every item a unique key", () => {
    for (const t of TICKETS) {
      const keys = buildTimeline(t).map((i) => i.key);
      expect(new Set(keys).size, t.id).toBe(keys.length);
    }
  });

  it("puts the draft last whenever a ticket has one", () => {
    for (const t of TICKETS) {
      const items = buildTimeline(t);
      if (t.triage.drafts.length > 0) expect(items.at(-1)?.kind, t.id).toBe("draft");
    }
  });
});

describe("hasTranslation", () => {
  it("is true only for tickets written in another language", () => {
    expect(TICKETS.filter(hasTranslation).map((t) => t.id)).toEqual(["t07", "t08"]);
  });
});
