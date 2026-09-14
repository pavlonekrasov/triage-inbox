import { describe, expect, it } from "vitest";
import { approvalBlock, canBulkSelect, isSureLowRiskDraft, laneFor, NO_APPROVAL_RULES, routeFor } from "./route";
import type { Confidence, HardRule, Risk } from "./types";

const HARD_RULES: HardRule[] = [
  "money_decision",
  "safety_complaint",
  "privacy_legal",
  "wellbeing",
  "source_conflict",
  "stale_source",
  "instruction_in_message",
  "reopened",
];
const RISKS: Risk[] = ["low", "medium", "high"];
const CONFIDENCES: Confidence[] = ["sure", "likely", "unsure"];

describe("routeFor", () => {
  it.each(HARD_RULES)("forces human_led when %s is hit, even at low risk and confidence sure", (rule) => {
    expect(routeFor({ risk: "low", confidence: "sure", hardRules: [rule] })).toBe("human_led");
  });

  it("never lets confidence or a paused auto-send move a case past a hard rule", () => {
    for (const risk of RISKS) {
      for (const confidence of CONFIDENCES) {
        for (const autoSendPaused of [false, true]) {
          expect(routeFor({ risk, confidence, hardRules: ["money_decision"] }, { autoSendPaused })).toBe("human_led");
        }
      }
    }
  });

  it.each(CONFIDENCES)("routes high risk to a person at confidence %s", (confidence) => {
    expect(routeFor({ risk: "high", confidence, hardRules: [] })).toBe("human_led");
  });

  it.each(CONFIDENCES)("routes medium risk to a draft at confidence %s", (confidence) => {
    expect(routeFor({ risk: "medium", confidence, hardRules: [] })).toBe("approve_draft");
  });

  it("auto-sends only low risk with confidence sure", () => {
    expect(routeFor({ risk: "low", confidence: "sure", hardRules: [] })).toBe("auto_send");
    expect(routeFor({ risk: "low", confidence: "likely", hardRules: [] })).toBe("approve_draft");
    expect(routeFor({ risk: "low", confidence: "unsure", hardRules: [] })).toBe("approve_draft");
  });

  it("queues a would-be auto-send as a draft while auto-send is paused", () => {
    expect(routeFor({ risk: "low", confidence: "sure", hardRules: [] }, { autoSendPaused: true })).toBe("approve_draft");
  });
});

describe("laneFor", () => {
  it("maps each route to its lane", () => {
    expect(laneFor("human_led")).toBe("needs_you");
    expect(laneFor("approve_draft")).toBe("drafts");
    expect(laneFor("auto_send")).toBe("auto_resolved");
  });
});

describe("approval blocks", () => {
  const draft = { id: "d", language: "en-US", body: "Hi" };

  it.each(NO_APPROVAL_RULES)("takes approval and bulk selection away for %s, even on a low-risk Sure draft", (rule) => {
    // Deliberately inconsistent input: the route claims a draft. The guard must still refuse.
    const triage = { route: "approve_draft" as const, risk: "low" as const, confidence: "sure" as const, hardRules: [rule], drafts: [draft] };
    expect(approvalBlock(triage)?.rule).toBe(rule);
    expect(canBulkSelect(triage)).toBe(false);
    expect(isSureLowRiskDraft(triage)).toBe(false);
  });

  it("allows bulk selection of a draft with no hard rules and limits ⇧X to low risk and Sure", () => {
    const base = { route: "approve_draft" as const, hardRules: [], drafts: [draft] };
    expect(isSureLowRiskDraft({ ...base, risk: "low", confidence: "sure" })).toBe(true);
    expect(canBulkSelect({ ...base, risk: "medium", confidence: "sure" })).toBe(true);
    expect(isSureLowRiskDraft({ ...base, risk: "medium", confidence: "sure" })).toBe(false);
    expect(isSureLowRiskDraft({ ...base, risk: "low", confidence: "likely" })).toBe(false);
  });

  it("refuses bulk selection when there is no draft to send", () => {
    expect(canBulkSelect({ route: "approve_draft", risk: "low", confidence: "sure", hardRules: [], drafts: [] })).toBe(false);
  });
});
