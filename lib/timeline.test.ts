import { describe, expect, it } from "vitest";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
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

  it("holds one draft slot for a two-variant case and records how many variants exist", () => {
    expect(shape("t02").at(-1)).toBe("draft:2");
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
