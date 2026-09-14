import { DEMO_NOW } from "./clock";
import type { Account, BillingEvent, Platform, Source, Subscription } from "./types";

/* What the context panel says about an account (brief 7.5), kept out of the component so it is tested. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/*
 * Zone names are written here, not taken from Intl's short names: ICU builds disagree on "PDT"
 * versus "GMT-7", and server and browser must render the same text.
 */
const ZONE_LABEL: Record<string, string> = {
  "America/Los_Angeles": "Pacific",
  "America/Phoenix": "Arizona",
  "America/Denver": "Mountain",
  "America/Chicago": "Central",
  "America/New_York": "Eastern",
  "America/Toronto": "Eastern",
  "America/Mexico_City": "Mexico City",
  "America/Sao_Paulo": "São Paulo",
  "Europe/London": "UK",
  "Europe/Berlin": "Berlin",
  UTC: "UTC",
};

export const zoneLabel = (timeZone: string) => ZONE_LABEL[timeZone] ?? timeZone.split("/").at(-1)!.replace(/_/g, " ");

const formats = new Map<string, Intl.DateTimeFormat>();

function parts(ms: number, timeZone: string) {
  let format = formats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formats.set(timeZone, format);
  }
  const get = (type: Intl.DateTimeFormatPartTypes) => format.formatToParts(ms).find((p) => p.type === type)?.value ?? "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), time: `${get("hour")}:${get("minute")}` };
}

/** "3 Sep 23:58" in the given zone; the year is added when it is not the desk's current year. */
export function formatZoned(iso: string, timeZone: string, now: number = DEMO_NOW) {
  const p = parts(Date.parse(iso), timeZone);
  const year = p.year === parts(now, timeZone).year ? "" : ` ${p.year}`;
  return `${p.day} ${MONTHS[p.month - 1]}${year} ${p.time}`;
}

/** "4 Sep 06:58 UTC": the original record, shown under a normalised time. */
export const formatUtc = (iso: string, now: number = DEMO_NOW) => `${formatZoned(iso, "UTC", now)} UTC`;

/** "28 Sep 2026" for a calendar date such as a renewal or customer-since date. */
export function formatDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export const minutesApart = (a: string, b: string) => Math.round(Math.abs(Date.parse(a) - Date.parse(b)) / 60_000);

/** "jordan.kim@example.com" → "j•••••••••@example.com". The reveal is logged. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}${"•".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

export const PLATFORM_LABEL: Record<Platform, string> = { ios: "iOS", android: "Android", web: "Web" };

export type SectionStatus = { text: string; risk: boolean };

export function subscriptionStatus(subscription: Subscription | null): SectionStatus {
  if (!subscription) return { text: "None", risk: false };
  return { text: subscription.status === "active" ? "Active" : "Cancelled", risk: false };
}

export function billingStatus(account: Pick<Account, "billing" | "conflict">): SectionStatus {
  if (account.conflict) return { text: "Sources disagree", risk: true };
  const n = account.billing.length;
  return { text: n === 0 ? "None" : `${n} ${n === 1 ? "record" : "records"}`, risk: false };
}

export function sourcesStatus(sources: readonly Source[]): SectionStatus {
  const stale = sources.filter((s) => s.supersededBy).length;
  if (stale > 0) return { text: `${stale} outdated`, risk: true };
  return { text: sources.length === 0 ? "None" : String(sources.length), risk: false };
}

export function contactsStatus(account: Pick<Account, "previousContacts">): SectionStatus {
  if (account.previousContacts.some((c) => c.reopened)) return { text: "Reopened", risk: true };
  const n = account.previousContacts.length;
  return { text: n === 0 ? "First contact" : String(n), risk: false };
}

/**
 * The billing timeline in reading order, with the two records that disagree grouped into one entry
 * at the position of the earlier one, so they can sit side by side.
 */
export type BillingEntry =
  | { kind: "event"; event: BillingEvent }
  | { kind: "conflict"; events: [BillingEvent, BillingEvent]; note: string; minutes: number };

export function billingEntries(account: Pick<Account, "billing" | "conflict">): BillingEntry[] {
  const sorted = [...account.billing].sort((a, b) => a.at.localeCompare(b.at));
  const conflict = account.conflict;
  const pair = conflict ? conflict.eventIds.map((id) => sorted.find((e) => e.id === id)) : [];
  if (!conflict || !pair[0] || !pair[1]) return sorted.map((event) => ({ kind: "event", event }));

  const events = (pair as BillingEvent[]).sort((a, b) => a.at.localeCompare(b.at)) as [BillingEvent, BillingEvent];
  const entries: BillingEntry[] = [];
  for (const event of sorted) {
    if (event === events[0]) {
      entries.push({ kind: "conflict", events, note: conflict.note, minutes: minutesApart(events[0].at, events[1].at) });
    } else if (event !== events[1]) {
      entries.push({ kind: "event", event });
    }
  }
  return entries;
}
