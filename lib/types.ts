/* The agent's contract (brief section 8). The UI renders exactly this object per ticket, so the
   prototype is honest about what a real agent would return. */

export type Route = "auto_send" | "approve_draft" | "human_led";
export type Risk = "low" | "medium" | "high";
export type Confidence = "sure" | "likely" | "unsure";
export type HardRule =
  | "money_decision"
  | "safety_complaint"
  | "privacy_legal"
  | "wellbeing"
  | "source_conflict"
  | "stale_source"
  | "instruction_in_message"
  | "reopened";

export type CategoryPrimary =
  | "subscription"
  | "billing"
  | "technical"
  | "refund"
  | "advisor_complaint"
  | "account"
  | "product_question"
  | "privacy"
  | "other";

export type StepKind = "classified" | "checked_account" | "retrieved" | "routed" | "drafted" | "sent";
export type EscalationTeam = "billing" | "trust_safety" | "wellbeing" | "privacy" | "tech";

export interface Source {
  id: string;
  title: string;
  version: string;
  updatedAt: string;
  /** Id of the newer registered version, when this one is superseded. */
  supersededBy?: string;
}

export interface TriageResult {
  ticketId: string;
  language: string; // BCP 47, e.g. "es-MX"
  category: { primary: CategoryPrimary; secondary?: string };
  summary: string; // at most 32 words, plain language, facts then ask
  risk: Risk;
  confidence: Confidence;
  confidenceScore: number; // 0..1, shown only inside "Why this route"
  route: Route;
  hardRules: HardRule[]; // any hit forces human_led, even when confidence is "sure"
  reasons: { label: string; evidence: string; sourceId?: string }[]; // 2 to 4 lines
  sources: Source[];
  steps: { at: string; kind: StepKind; text: string }[];
  drafts: { id: string; variant?: string; language: string; body: string; glossEn?: string }[]; // 0..2
  suggestedEscalation?: { team: EscalationTeam; reason: string; handoffNote: string };
}

/* Helpdesk data around the contract. */

export type Lane = "needs_you" | "drafts" | "auto_resolved";
export type Platform = "ios" | "android" | "web";

export interface Customer {
  id: string;
  name: string;
  email: string;
  locale: string;
  timeZone: string;
  platform: Platform;
  customerSince: string;
  lifetimeContacts: number;
}

export interface Message {
  id: string;
  author: "customer" | "auto" | "specialist";
  at: string;
  body: string;
}

export interface Ticket {
  id: string;
  customer: Customer;
  receivedAt: string;
  /** First-response deadline. */
  slaDueAt: string;
  messages: Message[];
  triage: TriageResult;
  /** Routed while auto-send was paused, so a reply that would have sent automatically waits as a draft. */
  routedWhileAutoSendPaused?: boolean;
  /** An auto-sent reply sampled for a human spot-check. */
  spotCheck?: boolean;
}
