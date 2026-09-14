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
  /** Why this confidence, in words, without the level: "intent is explicit; account data is partial". */
  confidenceNote: string;
  route: Route;
  hardRules: HardRule[]; // any hit forces human_led, even when confidence is "sure"
  /** 2 to 4 lines. `caution` marks a reason that holds the case back from sending on its own. */
  reasons: { label: string; evidence: string; sourceId?: string; caution?: boolean }[];
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
  /** Machine translation shown to the specialist when the message is not in English. */
  translationEn?: string;
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
  /** What the context panel shows about the customer (brief 7.5). */
  account: Account;
}

/* Account data around the ticket, as the agent reads it from the stores and payment records. */

export type ContextSection = "customer" | "subscription" | "billing" | "sources" | "advisor" | "contacts";
export type Store = "App Store" | "Google Play" | "Web";
/** The system a billing record comes from. Stores and Nebula's own payment records can disagree. */
export type BillingSystem = "App Store" | "Google Play" | "Web payments" | "Payments";

export interface Subscription {
  plan: string;
  price: string;
  status: "active" | "cancelled";
  store: Store;
  renewsAt?: string;
  cancelledAt?: string;
  /** Where the customer cancelled. */
  cancelledIn?: Store;
}

export interface BillingEvent {
  id: string;
  at: string;
  label: string;
  amount?: string;
  system: BillingSystem;
}

export interface BillingConflict {
  /** The two records that disagree, shown side by side. */
  eventIds: [string, string];
  /** What the disagreement is, in one sentence. */
  note: string;
}

export interface AdvisorSession {
  id: string;
  advisor: string;
  startedAt: string;
  minutes: number;
}

export interface PreviousContact {
  id: string;
  at: string;
  route: Route;
  topic: string;
  outcome: string;
  /** The customer came back after this contact was resolved automatically. */
  reopened?: boolean;
}

/** A field the agent is not permitted to read. The panel shows that it exists, with a lock. */
export interface RestrictedField {
  section: ContextSection;
  label: string;
  reason: string;
}

export interface Account {
  subscription: Subscription | null;
  /** Oldest first. */
  billing: BillingEvent[];
  conflict?: BillingConflict;
  /** Only for complaints about an advisor. */
  advisorSession?: AdvisorSession;
  /** The last three, newest first. */
  previousContacts: PreviousContact[];
  restricted: RestrictedField[];
}
