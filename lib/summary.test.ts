import { describe, expect, it } from "vitest";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import { CONFIDENCE, HARD_RULE_LABEL, routeExplanation, summaryFlags } from "./summary";

const triage = (id: string) => {
  const t = TICKETS_BY_ID.get(id);
  if (!t) throw new Error(`missing fixture ${id}`);
  return t.triage;
};

describe("summaryFlags", () => {
  it("flags the conflict on ticket 4 and the outdated policy on ticket 5 (review gate 15)", () => {
    expect(summaryFlags(triage("t04"))).toEqual([{ kind: "source_conflict", text: "Sources disagree" }]);
    expect(summaryFlags(triage("t05"))).toEqual([
      { kind: "stale_source", text: "Chat credit refunds v3 is outdated: v4 published 2 Sep" },
    ]);
  });

  it("flags nothing when the evidence is current and agrees", () => {
    for (const id of ["t01", "t07", "t10", "t17"]) expect(summaryFlags(triage(id))).toEqual([]);
  });

  it("still flags a stale_source rule when no superseded source is attached", () => {
    expect(summaryFlags({ hardRules: ["stale_source"], sources: [] })).toEqual([
      { kind: "stale_source", text: "A source used is outdated" },
    ]);
  });
});

describe("routeExplanation", () => {
  it("names the hard rule before risk, even at Sure", () => {
    expect(routeExplanation({ route: "human_led", risk: "low", confidence: "sure", hardRules: ["wellbeing"] })).toMatch(
      /hard rule.*whatever the confidence/,
    );
  });

  it("follows the matrix row for each fixture's risk and confidence", () => {
    expect(routeExplanation(triage("t05"))).toMatch(/^Medium risk/);
    expect(routeExplanation(triage("t07"))).toMatch(/^Low risk, but Likely/);
    expect(routeExplanation(triage("t11"))).toMatch(/^Low risk, but Unsure/);
    expect(routeExplanation(triage("t01"))).toMatch(/sent automatically/);
    expect(routeExplanation(triage("t17"), { autoSendPaused: true })).toMatch(/auto-send is paused/);
  });
});

describe("summary vocabulary", () => {
  it("labels every hard rule and confidence level in words, with no percentages", () => {
    for (const label of [...Object.values(HARD_RULE_LABEL), ...Object.values(CONFIDENCE).map((c) => c.label)]) {
      expect(label).not.toMatch(/%|—/);
    }
    expect(Object.values(CONFIDENCE).map((c) => c.filled)).toEqual([3, 2, 1]);
  });

  it.each(TICKETS.map((t) => [t.id, t] as const))("%s explains its confidence in a short note", (_, t) => {
    const note = t.triage.confidenceNote;
    expect(note.split(/\s+/).length).toBeLessThanOrEqual(14);
    expect(note).not.toMatch(/—|%|^(sure|likely|unsure)\b/i);
  });

  it("marks cautions where the route holds a case back, and none on auto-sent replies", () => {
    for (const t of TICKETS) {
      const cautions = t.triage.reasons.filter((r) => r.caution).length;
      if (t.triage.route === "auto_send") expect(cautions, t.id).toBe(0);
      if (t.triage.hardRules.length > 0) expect(cautions, t.id).toBeGreaterThan(0);
    }
  });
});
