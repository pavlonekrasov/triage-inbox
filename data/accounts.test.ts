import { describe, expect, it } from "vitest";
import { billingEntries, formatUtc, formatZoned } from "@/lib/context";
import { TICKETS, TICKETS_BY_ID } from "./tickets";

describe("account fixtures", () => {
  it("gives every ticket an account", () => {
    for (const t of TICKETS) expect(t.account, t.id).toBeDefined();
  });

  it("lists up to the last three previous contacts, newest first, matching the lifetime count", () => {
    for (const t of TICKETS) {
      const contacts = t.account.previousContacts;
      expect(contacts.length, t.id).toBe(Math.min(3, t.customer.lifetimeContacts - 1));
      const dates = contacts.map((c) => c.at);
      expect(dates, t.id).toEqual([...dates].sort().reverse());
    }
  });

  it("records a billing conflict exactly where the triage hit the source-conflict rule, with both records on file", () => {
    for (const t of TICKETS) {
      const conflict = t.account.conflict;
      expect(Boolean(conflict), t.id).toBe(t.triage.hardRules.includes("source_conflict"));
      for (const id of conflict?.eventIds ?? []) expect(t.account.billing.some((e) => e.id === id), `${t.id} ${id}`).toBe(true);
    }
  });

  it("keeps billing oldest first and in the past", () => {
    for (const t of TICKETS) {
      const dates = t.account.billing.map((e) => e.at);
      expect(dates, t.id).toEqual([...dates].sort());
      for (const at of dates) expect(Date.parse(at), `${t.id} ${at}`).toBeLessThan(Date.parse(t.receivedAt));
    }
  });

  it("shows an advisor session only for complaints about an advisor", () => {
    for (const t of TICKETS) {
      expect(Boolean(t.account.advisorSession), t.id).toBe(t.triage.category.primary === "advisor_complaint");
    }
  });

  it("marks ticket 12's earlier automatic answer as reopened", () => {
    expect(TICKETS_BY_ID.get("t12")?.account.previousContacts[0]).toMatchObject({ route: "auto_send", reopened: true });
  });

  it("puts ticket 4's records side by side, 4 minutes apart, in Pacific time with the UTC original (review gate 15)", () => {
    const t = TICKETS_BY_ID.get("t04")!;
    const conflict = billingEntries(t.account).find((e) => e.kind === "conflict");
    if (conflict?.kind !== "conflict") throw new Error("no conflict entry");
    const [cancel, renewal] = conflict.events;
    expect(conflict.minutes).toBe(4);
    expect([formatZoned(cancel.at, t.customer.timeZone), formatUtc(cancel.at)]).toEqual(["3 Sep 23:58", "4 Sep 06:58 UTC"]);
    expect([formatZoned(renewal.at, t.customer.timeZone), formatUtc(renewal.at)]).toEqual(["4 Sep 00:02", "4 Sep 07:02 UTC"]);
  });
});
