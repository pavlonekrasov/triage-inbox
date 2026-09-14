import { describe, expect, it } from "vitest";
import { TICKETS_BY_ID } from "@/data/tickets";
import {
  billingEntries,
  billingStatus,
  contactsStatus,
  formatDate,
  formatZoned,
  maskEmail,
  sourcesStatus,
  subscriptionStatus,
  zoneLabel,
} from "./context";

const ticket = (id: string) => {
  const t = TICKETS_BY_ID.get(id);
  if (!t) throw new Error(`missing fixture ${id}`);
  return t;
};

describe("formatting", () => {
  it("writes times in the customer's zone and adds the year only when it differs", () => {
    expect(formatZoned("2026-09-13T06:40:00Z", "America/Los_Angeles")).toBe("12 Sep 23:40");
    expect(formatZoned("2025-09-04T07:02:00Z", "America/Los_Angeles")).toBe("4 Sep 2025 00:02");
    expect(formatDate("2026-09-28")).toBe("28 Sep 2026");
  });

  it("names zones in words, with the city as a fallback", () => {
    expect(zoneLabel("America/Los_Angeles")).toBe("Pacific");
    expect(zoneLabel("Asia/Ho_Chi_Minh")).toBe("Ho Chi Minh");
  });

  it("masks the email down to its first letter and domain", () => {
    expect(maskEmail("jordan.kim@example.com")).toBe("j•••••••••@example.com");
    expect(maskEmail("al@example.com")).toBe("a•••@example.com");
  });
});

describe("section status", () => {
  it("says Sources disagree, in risk, on billing for tickets 2 and 4 only", () => {
    expect(billingStatus(ticket("t04").account)).toEqual({ text: "Sources disagree", risk: true });
    expect(billingStatus(ticket("t02").account).risk).toBe(true);
    expect(billingStatus(ticket("t17").account)).toEqual({ text: "1 record", risk: false });
  });

  it("counts outdated sources for ticket 5 (review gate 15)", () => {
    expect(sourcesStatus(ticket("t05").triage.sources)).toEqual({ text: "1 outdated", risk: true });
    expect(sourcesStatus(ticket("t11").triage.sources)).toEqual({ text: "None", risk: false });
  });

  it("flags a reopened contact and names a first contact", () => {
    expect(contactsStatus(ticket("t12").account)).toEqual({ text: "Reopened", risk: true });
    expect(contactsStatus(ticket("t01").account)).toEqual({ text: "First contact", risk: false });
    expect(subscriptionStatus(ticket("t04").account.subscription).text).toBe("Cancelled");
    expect(subscriptionStatus(null).text).toBe("None");
  });
});

describe("billingEntries", () => {
  it("groups the disagreeing records at the earlier one's place and keeps the rest in order", () => {
    const kinds = billingEntries(ticket("t02").account).map((e) => (e.kind === "event" ? e.event.id : "conflict"));
    expect(kinds).toEqual(["t02-b1", "conflict", "t02-b4"]);
  });

  it("returns plain events when there is no conflict", () => {
    expect(billingEntries(ticket("t12").account).every((e) => e.kind === "event")).toBe(true);
  });
});
