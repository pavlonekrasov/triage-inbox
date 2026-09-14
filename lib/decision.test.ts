import { describe, expect, it } from "vitest";
import { TICKETS, TICKETS_BY_ID } from "@/data/tickets";
import { approveBlocked, decisionFor, editTarget } from "./decision";
import { NO_APPROVAL_RULES } from "./route";

const ticket = (id: string) => {
  const t = TICKETS_BY_ID.get(id);
  if (!t) throw new Error(`missing fixture ${id}`);
  return t;
};

describe("decisionFor", () => {
  it("names what will happen on the primary, by route (brief 9.1)", () => {
    expect(decisionFor(ticket("t17")).primary.label).toBe("Approve & send");
    expect(decisionFor(ticket("t06")).primary.label).toBe("Take over conversation");
    expect(decisionFor(ticket("t03")).primary.label).toBe("Acknowledge & open review");
    expect(decisionFor(ticket("t01")).primary.label).toBe("Follow up");
    expect(decisionFor(ticket("t01")).markWrong).toBe(true);
    for (const id of ["t04", "t09", "t12", "t13"]) expect(decisionFor(ticket(id)).primary.label, id).toBe("Edit & send reply");
  });

  it("makes the person choose Refund or Decline before ticket 2 can be sent", () => {
    const open = decisionFor(ticket("t02"));
    expect(open.variants.map((v) => v.label)).toEqual(["Refund", "Decline"]);
    expect(open.draft).toBeNull();
    expect(open.primary.blocked).toMatch(/^Choose Refund or Decline first/);
    expect(decisionFor(ticket("t02"), { chosenDraftId: "t02-decline" }).primary).toEqual({
      kind: "send-variant",
      label: "Send decline reply",
      blocked: null,
    });
  });

  it("offers Retry after a failed send and Follow up after a sent one", () => {
    expect(decisionFor(ticket("t17"), { outgoing: "failed" }).primary.label).toBe("Retry sending");
    expect(decisionFor(ticket("t17"), { outgoing: "sent" }).primary.kind).toBe("follow-up");
  });

  it("holds a follow-up until the reply before it is delivered", () => {
    for (const outgoing of ["undoable", "sending"] as const) {
      expect(decisionFor(ticket("t17"), { outgoing }).primary.blocked, outgoing).toBe(
        "Your reply is still sending. Follow up once it's delivered.",
      );
    }
    expect(decisionFor(ticket("t17"), { outgoing: "sent" }).primary.blocked).toBeNull();
  });

  it("turns a taken-over wellbeing case into a reply of the specialist's own", () => {
    expect(decisionFor(ticket("t06"), { takenOver: true }).primary).toMatchObject({ kind: "write", label: "Write a reply" });
  });

  it("holds a follow-up behind a reply queued offline", () => {
    expect(decisionFor(ticket("t17"), { outgoing: "queued" }).primary.blocked).toBe(
      "Your reply is queued until you reconnect. Follow up once it's delivered.",
    );
  });

  it("offers Escalate only while the AI drafts, and writing once the draft failed (brief 12)", () => {
    const drafting = decisionFor(ticket("t17"), { draft: "drafting" });
    expect(drafting.primary.kind).toBe("drafting");
    expect(drafting.edit).toBeNull();
    expect(drafting.draft).toBeNull();
    expect(decisionFor(ticket("t17"), { draft: "failed" }).primary).toMatchObject({ kind: "write", label: "Write a reply" });
    expect(approveBlocked(ticket("t17"), { draft: "failed" })).toBe("The AI couldn't draft this reply. Write one yourself instead.");
  });
});

describe("editTarget", () => {
  it("keeps the safety acknowledgment fixed and refuses to edit a draft that does not exist", () => {
    expect(decisionFor(ticket("t03")).edit).toBeNull();
    expect(editTarget(ticket("t03"))).toEqual({
      blocked: "The acknowledgment is fixed wording. The review itself happens with Trust & Safety.",
    });
    expect(editTarget(ticket("t06"))).toEqual({
      blocked: "There's no draft for a wellbeing case. Take over to write in your own words.",
    });
  });

  it("opens the draft, or the chosen variant once there is one", () => {
    expect(editTarget(ticket("t17"))).toMatchObject({ draft: { id: "t17-draft" } });
    expect(editTarget(ticket("t02"))).toHaveProperty("blocked");
    expect(editTarget(ticket("t02"), { chosenDraftId: "t02-refund" })).toMatchObject({ draft: { id: "t02-refund" } });
    expect(editTarget(ticket("t04"))).toMatchObject({ draft: { id: "t04-refund" } });
  });
});

describe("approveBlocked (review gate 9)", () => {
  const guarded = TICKETS.filter((t) => t.triage.hardRules.some((r) => (NO_APPROVAL_RULES as readonly string[]).includes(r)));

  it.each(guarded.map((t) => [t.id, t] as const))("never lets A approve %s, in any state", (_, t) => {
    const contexts = [{}, { takenOver: true }, ...t.triage.drafts.map((d) => ({ chosenDraftId: d.id }))];
    for (const ctx of contexts) {
      expect(approveBlocked(t, ctx)).toBeTruthy();
      expect(decisionFor(t, ctx).primary.kind).not.toBe("approve");
    }
  });

  it("approves only drafts routed for approval", () => {
    for (const t of TICKETS) expect(approveBlocked(t) === null, t.id).toBe(t.triage.route === "approve_draft");
  });

  it("explains the refusal in words", () => {
    expect(approveBlocked(ticket("t06"))).toBe("Approve is off for wellbeing cases. Take over instead.");
    expect(approveBlocked(ticket("t02"))).toBe("Approve is off for this decision. Choose Refund or Decline, then send it.");
    expect(approveBlocked(ticket("t01"))).toBe("This reply was sent automatically. Follow up instead.");
  });
});
