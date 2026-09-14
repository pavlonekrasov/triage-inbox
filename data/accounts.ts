import type { Account, BillingEvent, BillingSystem, PreviousContact, RestrictedField, Route, Subscription } from "@/lib/types";

/* Account data for the 23 fixtures (brief 7.5, 11). Times are UTC; the panel shows them in the
   customer's time zone. Ticket 2 and ticket 4 carry the records that disagree; ticket 12 carries the
   automatic reply the customer came back from. */

const BIRTH_DETAILS: RestrictedField = {
  section: "customer",
  label: "Birth details",
  reason: "Only the date they were last changed is visible to the agent",
};
const PAYMENT_CARD: RestrictedField = {
  section: "subscription",
  label: "Payment card",
  reason: "Card details stay with the store or payment provider",
};

const charge = (id: string, at: string, amount: string, system: BillingSystem, label = "Renewal charged"): BillingEvent => ({
  id,
  at,
  label,
  amount,
  system,
});

const contact = (id: string, at: string, route: Route, topic: string, outcome: string, reopened?: boolean): PreviousContact => ({
  id,
  at,
  route,
  topic,
  outcome,
  reopened,
});

const monthly = (price: string, store: Subscription["store"], renewsAt: string): Subscription => ({
  plan: "Nebula Plus, monthly",
  price,
  status: "active",
  store,
  renewsAt,
});

const yearly = (price: string, store: Subscription["store"], renewsAt: string): Subscription => ({
  plan: "Nebula Plus, yearly",
  price,
  status: "active",
  store,
  renewsAt,
});

const AUTO = "Answered automatically";
const APPROVED = "Draft approved by a specialist";

function account(parts: Partial<Account> & Pick<Account, "subscription">): Account {
  return {
    billing: [],
    previousContacts: [],
    ...parts,
    restricted: [BIRTH_DETAILS, PAYMENT_CARD, ...(parts.restricted ?? [])],
  };
}

export const ACCOUNTS: Readonly<Record<string, Account>> = {
  t01: account({
    subscription: monthly("$39.99", "App Store", "2026-09-28"),
    billing: [
      charge("t01-b1", "2026-07-28T14:10:00Z", "$39.99", "App Store"),
      charge("t01-b2", "2026-08-28T14:10:00Z", "$39.99", "App Store"),
    ],
  }),

  // Cancelled late on 12 Sep Pacific time; payments renewed at midnight Pacific and heard of the cancellation 31 minutes later.
  t02: account({
    subscription: {
      plan: "Nebula Plus, monthly",
      price: "$39.99",
      status: "cancelled",
      store: "App Store",
      cancelledAt: "2026-09-13T06:40:00Z",
      cancelledIn: "App Store",
    },
    billing: [
      charge("t02-b1", "2026-08-13T07:00:00Z", "$39.99", "Payments"),
      { id: "t02-b2", at: "2026-09-13T06:40:00Z", label: "Cancellation made", system: "App Store" },
      charge("t02-b3", "2026-09-13T07:00:00Z", "$39.99", "Payments"),
      { id: "t02-b4", at: "2026-09-13T07:31:00Z", label: "Cancellation received", system: "Payments" },
    ],
    conflict: {
      eventIds: ["t02-b2", "t02-b3"],
      note: "The App Store logged the cancellation before the renewal, but payments received it 31 minutes after charging.",
    },
    previousContacts: [
      contact("t02-c1", "2026-07-02T18:20:00Z", "auto_send", "Change birth time", AUTO),
      contact("t02-c2", "2026-03-18T16:05:00Z", "approve_draft", "Restore purchases on a new iPhone", APPROVED),
    ],
  }),

  t03: account({
    subscription: monthly("£34.99", "Google Play", "2026-10-08"),
    billing: [
      charge("t03-b1", "2026-09-08T09:00:00Z", "£34.99", "Google Play"),
      charge("t03-b2", "2026-09-13T15:08:00Z", "£19.99", "Google Play", "30-minute chat pack bought"),
    ],
    advisorSession: { id: "ses_4F82K1", advisor: "@MoonwardAria", startedAt: "2026-09-13T15:12:00Z", minutes: 14 },
    restricted: [{ section: "advisor", label: "Transcript content", reason: "Trust & Safety only" }],
  }),

  // The case the brief calls "time zones are the whole story": 3 Sep 23:58 Pacific is 4 Sep 06:58 UTC.
  t04: account({
    subscription: {
      plan: "Nebula Plus, yearly",
      price: "$119.99",
      status: "cancelled",
      store: "App Store",
      cancelledAt: "2026-09-04T06:58:00Z",
      cancelledIn: "App Store",
    },
    billing: [
      charge("t04-b1", "2025-09-04T07:02:00Z", "$119.99", "Payments"),
      { id: "t04-b2", at: "2026-09-04T06:58:00Z", label: "Cancellation made", system: "App Store" },
      charge("t04-b3", "2026-09-04T07:02:00Z", "$119.99", "Payments"),
    ],
    conflict: {
      eventIds: ["t04-b2", "t04-b3"],
      note: "The App Store shows the plan cancelled; payments renewed it 4 minutes later as if it were still active.",
    },
    previousContacts: [contact("t04-c1", "2026-01-12T20:40:00Z", "auto_send", "Birth chart houses", AUTO)],
  }),

  t05: account({
    subscription: null,
    billing: [
      charge("t05-b1", "2026-09-09T19:22:00Z", "£34.99", "Web payments", "60-minute chat pack bought"),
      { id: "t05-b2", at: "2026-09-10T20:05:00Z", label: "Advisor chat, 15 minutes used", system: "Payments" },
    ],
    previousContacts: [contact("t05-c1", "2026-02-03T12:15:00Z", "approve_draft", "Advisor chat did not start", APPROVED)],
  }),

  t06: account({
    subscription: monthly("$39.99", "App Store", "2026-09-21"),
    billing: [charge("t06-b1", "2026-08-21T13:30:00Z", "$39.99", "App Store")],
    restricted: [{ section: "customer", label: "Reading content", reason: "Readings are private to the customer" }],
  }),

  t07: account({
    subscription: monthly("MX$179.00", "Google Play", "2026-09-30"),
    billing: [charge("t07-b1", "2026-08-30T17:00:00Z", "MX$179.00", "Google Play")],
    previousContacts: [contact("t07-c1", "2026-05-14T02:10:00Z", "auto_send", "Change notification language", AUTO)],
  }),

  t08: account({
    subscription: monthly("R$54.90", "App Store", "2026-10-03"),
    billing: [charge("t08-b1", "2026-09-03T12:00:00Z", "R$54.90", "App Store")],
  }),

  t09: account({
    subscription: monthly("$39.99", "Web", "2026-10-01"),
    billing: [
      charge("t09-b1", "2026-08-01T15:00:00Z", "$39.99", "Web payments"),
      charge("t09-b2", "2026-09-01T15:00:00Z", "$39.99", "Web payments"),
    ],
  }),

  t10: account({
    subscription: monthly("$39.99", "Google Play", "2026-09-19"),
    billing: [charge("t10-b1", "2026-08-19T23:15:00Z", "$39.99", "Google Play", "Subscription started")],
  }),

  t11: account({
    subscription: monthly("CA$49.99", "Google Play", "2026-10-12"),
    billing: [charge("t11-b1", "2026-09-12T16:00:00Z", "CA$49.99", "Google Play")],
  }),

  t12: account({
    subscription: monthly("$39.99", "Web", "2026-10-12"),
    billing: [
      charge("t12-b1", "2026-08-12T14:00:00Z", "$39.99", "Web payments"),
      charge("t12-b2", "2026-09-12T14:00:00Z", "$39.99", "Web payments"),
    ],
    previousContacts: [
      contact("t12-c1", "2026-09-11T15:32:00Z", "auto_send", "How to cancel", "Answered automatically with web steps", true),
    ],
  }),

  t13: account({
    subscription: yearly("€59.99", "Web", "2026-12-01"),
    billing: [charge("t13-b1", "2025-12-01T10:00:00Z", "€59.99", "Web payments")],
    previousContacts: [
      contact("t13-c1", "2026-06-02T09:30:00Z", "auto_send", "Download my readings", AUTO),
      contact("t13-c2", "2026-03-09T17:45:00Z", "approve_draft", "Change account email", APPROVED),
      contact("t13-c3", "2025-12-03T11:20:00Z", "human_led", "Charged in the wrong currency", "Refunded by a specialist"),
    ],
  }),

  t14: account({
    subscription: monthly("$39.99", "App Store", "2026-09-22"),
    billing: [
      charge("t14-b1", "2026-08-22T16:00:00Z", "$39.99", "App Store"),
      { id: "t14-b2", at: "2026-09-13T14:40:00Z", label: "Advisor chat, 10 minutes paid, dropped at 2:06", system: "Payments" },
    ],
    previousContacts: [
      contact("t14-c1", "2026-08-30T21:10:00Z", "approve_draft", "Chat credits missing after purchase", APPROVED),
      contact("t14-c2", "2026-06-11T04:25:00Z", "auto_send", "Change daily horoscope time", AUTO),
      contact("t14-c3", "2026-02-19T18:50:00Z", "auto_send", "Find saved readings", AUTO),
    ],
  }),

  t15: account({
    subscription: monthly("$39.99", "Google Play", "2026-10-05"),
    billing: [charge("t15-b1", "2026-09-05T12:00:00Z", "$39.99", "Google Play")],
  }),

  t16: account({
    subscription: yearly("CA$149.99", "Web", "2027-03-15"),
    billing: [charge("t16-b1", "2026-03-15T15:00:00Z", "CA$149.99", "Web payments")],
    previousContacts: [contact("t16-c1", "2025-11-20T22:05:00Z", "auto_send", "Moon sign explained", AUTO)],
  }),

  t17: account({
    subscription: yearly("$119.99", "Web", "2026-09-20"),
    billing: [charge("t17-b1", "2025-09-20T18:00:00Z", "$119.99", "Web payments", "Subscription started")],
  }),

  t18: account({
    subscription: monthly("$39.99", "App Store", "2026-09-27"),
    billing: [charge("t18-b1", "2026-08-27T20:00:00Z", "$39.99", "App Store")],
  }),

  t19: account({
    subscription: monthly("$39.99", "Google Play", "2026-10-06"),
    billing: [charge("t19-b1", "2026-09-06T13:00:00Z", "$39.99", "Google Play")],
    previousContacts: [
      contact("t19-c1", "2026-04-22T23:40:00Z", "auto_send", "Tarot deck styles", AUTO),
      contact("t19-c2", "2025-12-15T15:10:00Z", "approve_draft", "Charged twice in December", "Draft approved, refund issued"),
    ],
  }),

  t20: account({
    subscription: null,
    previousContacts: [contact("t20-c1", "2025-06-03T14:30:00Z", "auto_send", "Reset password", AUTO)],
  }),

  t21: account({
    subscription: monthly("$39.99", "App Store", "2026-10-14"),
    billing: [charge("t21-b1", "2026-08-14T19:00:00Z", "$39.99", "App Store")],
  }),

  t22: account({
    subscription: monthly("$39.99", "Google Play", "2026-10-02"),
    billing: [charge("t22-b1", "2026-09-02T18:00:00Z", "$39.99", "Google Play")],
  }),

  t23: account({
    subscription: { plan: "Nebula Plus, annual", price: "£89.99", status: "active", store: "Google Play", renewsAt: "2027-09-10" },
    billing: [
      charge("t23-b1", "2025-09-10T08:12:00Z", "£89.99", "Google Play"),
      charge("t23-b2", "2026-09-03T18:40:00Z", "2 credits", "Payments", "Advisor chat credits used"),
      charge("t23-b3", "2026-09-10T08:12:00Z", "£89.99", "Google Play"),
    ],
    previousContacts: [
      contact("t23-c3", "2026-09-12T12:30:00Z", "approve_draft", "Refund of the renewal", "No reply yet"),
      contact("t23-c2", "2026-09-11T10:15:00Z", "approve_draft", "Refund of the renewal", "Pointed to Google Play refunds"),
      contact("t23-c1", "2026-09-09T21:05:00Z", "approve_draft", "Switch to monthly", "Reply promised the change before renewal"),
    ],
  }),
};
