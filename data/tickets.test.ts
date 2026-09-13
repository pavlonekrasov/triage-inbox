import { describe, expect, it } from "vitest";
import { laneTickets } from "@/lib/lanes";
import { canBulkSelect, isSureLowRiskDraft, laneFor, NO_APPROVAL_RULES, routeFor } from "@/lib/route";
import { SOURCE_REGISTRY } from "./sources";
import { TICKETS, TICKETS_BY_ID } from "./tickets";

const words = (text: string) => text.trim().split(/\s+/).length;
const byId = (id: string) => {
  const ticket = TICKETS_BY_ID.get(id);
  if (!ticket) throw new Error(`missing fixture ${id}`);
  return ticket;
};

describe("fixtures", () => {
  it("holds 22 tickets with unique ids", () => {
    expect(TICKETS).toHaveLength(22);
    expect(new Set(TICKETS.map((t) => t.id)).size).toBe(22);
  });

  it.each(TICKETS.map((t) => [t.id, t] as const))("%s carries the route the matrix gives it", (_, t) => {
    expect(t.triage.route).toBe(routeFor(t.triage, { autoSendPaused: t.routedWhileAutoSendPaused }));
    expect(t.triage.ticketId).toBe(t.id);
  });

  it("fills the lanes 7 / 11 / 4", () => {
    expect(laneTickets(TICKETS, "needs_you")).toHaveLength(7);
    expect(laneTickets(TICKETS, "drafts")).toHaveLength(11);
    expect(laneTickets(TICKETS, "auto_resolved")).toHaveLength(4);
  });

  it("pins wellbeing, then safety, to the top of Needs you", () => {
    expect(laneTickets(TICKETS, "needs_you").slice(0, 2).map((t) => t.id)).toEqual(["t06", "t03"]);
  });

  it.each(TICKETS.map((t) => [t.id, t] as const))("%s keeps the contract's limits", (_, t) => {
    expect(words(t.triage.summary)).toBeLessThanOrEqual(32);
    expect(t.triage.reasons.length).toBeGreaterThanOrEqual(2);
    expect(t.triage.reasons.length).toBeLessThanOrEqual(4);
    expect(t.triage.drafts.length).toBeLessThanOrEqual(2);
    expect(t.triage.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(t.triage.confidenceScore).toBeLessThanOrEqual(1);
  });

  it.each(TICKETS.map((t) => [t.id, t] as const))("%s writes every reply in the support voice (brief 8.4)", (_, t) => {
    const replies = [
      ...t.triage.drafts.flatMap((d) => [d.body, d.glossEn ?? ""]),
      ...t.messages.filter((m) => m.author === "auto").flatMap((m) => [m.body, m.translationEn ?? ""]),
    ].filter(Boolean);
    for (const body of replies) {
      expect(words(body)).toBeLessThanOrEqual(90);
      expect(body).not.toMatch(/—/);
      expect(body).not.toMatch(/!/);
      expect(body).not.toMatch(/we apologi[sz]e for any inconvenience/i);
      expect(body).not.toMatch(/as per our policy/i);
      expect(body).not.toMatch(/\bunfortunately\b/i);
    }
  });

  it("links every reason to a source the ticket actually retrieved", () => {
    for (const t of TICKETS) {
      const retrieved = new Set(t.triage.sources.map((s) => s.id));
      for (const reason of t.triage.reasons) {
        if (reason.sourceId) expect(retrieved.has(reason.sourceId), `${t.id} → ${reason.sourceId}`).toBe(true);
      }
    }
  });

  it("points every superseded source at a registered newer version", () => {
    for (const source of SOURCE_REGISTRY.values()) {
      if (source.supersededBy) expect(SOURCE_REGISTRY.has(source.supersededBy)).toBe(true);
    }
    expect(byId("t05").triage.sources[0].supersededBy).toBe("src-credits-v4");
  });

  it("makes ⇧X select exactly the six drafts queued by the auto-send pause", () => {
    const selected = laneTickets(TICKETS, "drafts").filter((t) => isSureLowRiskDraft(t.triage));
    const queued = TICKETS.filter((t) => t.routedWhileAutoSendPaused);
    expect(selected.map((t) => t.id).sort()).toEqual(queued.map((t) => t.id).sort());
    expect(selected).toHaveLength(6);
  });

  it("never makes a wellbeing, safety, privacy, conflict or injection ticket bulk-selectable", () => {
    const guarded = TICKETS.filter((t) => t.triage.hardRules.some((r) => (NO_APPROVAL_RULES as readonly string[]).includes(r)));
    expect(guarded.map((t) => t.id).sort()).toEqual(["t02", "t03", "t04", "t06", "t09", "t13"]);
    for (const t of guarded) {
      expect(laneFor(t.triage.route)).toBe("needs_you");
      expect(canBulkSelect(t.triage)).toBe(false);
    }
  });

  it("gives ticket 2 a refund and a decline draft, and ticket 6 no draft at all", () => {
    expect(byId("t02").triage.drafts.map((d) => d.variant)).toEqual(["Refund", "Decline"]);
    expect(byId("t06").triage.drafts).toHaveLength(0);
  });

  it("includes a 48-character customer name for the truncation state", () => {
    expect(byId("t21").customer.name).toHaveLength(48);
  });
});
