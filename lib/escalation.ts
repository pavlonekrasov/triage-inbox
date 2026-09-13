import type { CategoryPrimary, EscalationTeam, Ticket } from "./types";

export const TEAMS: readonly { id: EscalationTeam; label: string }[] = [
  { id: "billing", label: "Billing" },
  { id: "trust_safety", label: "Trust & Safety" },
  { id: "wellbeing", label: "Wellbeing" },
  { id: "privacy", label: "Privacy" },
  { id: "tech", label: "Tech support" },
];

export const teamLabel = (team: EscalationTeam) => TEAMS.find((t) => t.id === team)?.label ?? team;

const TEAM_REASONS: Record<EscalationTeam, string[]> = {
  billing: ["Refund decision", "Charge dispute", "Records disagree"],
  trust_safety: ["Advisor conduct", "Harassment or abuse", "Fraud concern"],
  wellbeing: ["Customer in distress", "Needs a follow-up contact"],
  privacy: ["Data deletion", "Data access request", "Legal deadline"],
  tech: ["App error", "Sign-in problem", "Payment failed in the app"],
};

const CATEGORY_TEAM: Record<CategoryPrimary, EscalationTeam> = {
  subscription: "billing",
  billing: "billing",
  refund: "billing",
  advisor_complaint: "trust_safety",
  privacy: "privacy",
  technical: "tech",
  account: "tech",
  product_question: "tech",
  other: "tech",
};

/** Reason chips for a team. The AI's own reason comes first when it suggested this team. */
export function reasonOptions(ticket: Ticket, team: EscalationTeam): string[] {
  const suggested = ticket.triage.suggestedEscalation;
  const own = TEAM_REASONS[team];
  return suggested?.team === team && !own.includes(suggested.reason) ? [suggested.reason, ...own] : own;
}

/** The Escalate popover's starting values: prefilled from the AI's suggestion, never submitted for you. */
export function escalationDefaults(ticket: Ticket) {
  const suggested = ticket.triage.suggestedEscalation;
  const team = suggested?.team ?? CATEGORY_TEAM[ticket.triage.category.primary];
  return {
    team,
    suggestedTeam: suggested?.team ?? null,
    reasons: suggested ? [suggested.reason] : [],
    note: suggested?.handoffNote ?? `${ticket.customer.name}: ${ticket.triage.summary}`,
  };
}
