import { describe, expect, it } from "vitest";
import { TICKETS_BY_ID } from "@/data/tickets";
import { escalationDefaults, reasonOptions, teamLabel } from "./escalation";

const ticket = (id: string) => {
  const t = TICKETS_BY_ID.get(id);
  if (!t) throw new Error(`missing fixture ${id}`);
  return t;
};

describe("escalation", () => {
  it("prefills team, reason and handoff note from the AI's suggestion", () => {
    const t = ticket("t02");
    expect(escalationDefaults(t)).toEqual({
      team: "billing",
      suggestedTeam: "billing",
      reasons: ["Disputed charge with conflicting records"],
      note: t.triage.suggestedEscalation?.handoffNote,
    });
  });

  it("falls back to the category's team and the summary when the AI suggested none", () => {
    const t = ticket("t05");
    expect(escalationDefaults(t)).toEqual({
      team: "billing",
      suggestedTeam: null,
      reasons: [],
      note: `Hannah Okafor: ${t.triage.summary}`,
    });
  });

  it("lists the AI's reason first, and only for the team it suggested", () => {
    expect(reasonOptions(ticket("t02"), "billing")[0]).toBe("Disputed charge with conflicting records");
    expect(reasonOptions(ticket("t02"), "tech")).not.toContain("Disputed charge with conflicting records");
    expect(teamLabel("trust_safety")).toBe("Trust & Safety");
  });
});
