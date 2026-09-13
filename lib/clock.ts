/** The prototype's fixed "now": 13 Sep 2026, 18:44 in Kyiv, where the specialist works the US shift. */
export const DEMO_NOW = Date.parse("2026-09-13T15:44:00Z");

/** The specialist's time zone. Formatting always names it, so server and browser render the same text. */
export const DESK_TIME_ZONE = "Europe/Kyiv";

/** Under this much time to the first-response deadline, a row's timestamp becomes a countdown (brief 7.3). */
export const SLA_WARNING_MS = 5 * 60_000;

const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: DESK_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: DESK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: DESK_TIME_ZONE, weekday: "short" });
/* Month names are fixed here, not left to Intl: ICU builds disagree on en-GB "Sep" versus "Sept",
   and server and browser must render the same text or hydration fails. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayMonth = {
  format(ms: number) {
    const [, month, day] = dayKey.format(ms).split("-").map(Number);
    return `${day} ${MONTHS[month - 1]}`;
  },
};

function calendarDaysBetween(from: number, to: number) {
  const [fy, fm, fd] = dayKey.format(from).split("-").map(Number);
  const [ty, tm, td] = dayKey.format(to).split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Chat-list timestamp: "18:40" today, "Yesterday", a weekday within the week, then "4 Sep". */
export function formatListTime(iso: string, now: number = DEMO_NOW) {
  const at = Date.parse(iso);
  const days = calendarDaysBetween(at, now);
  if (days <= 0) return time.format(at);
  if (days === 1) return "Yesterday";
  if (days < 7) return weekday.format(at);
  return dayMonth.format(at);
}

/** Message time on the desk clock: "18:34". */
export const formatClockTime = (iso: string) => time.format(Date.parse(iso));

/** Calendar day on the desk clock, used to split a timeline into days. */
export const deskDayKey = (iso: string) => dayKey.format(Date.parse(iso));

/** Timeline day separator: "Today", "Yesterday", then "11 Sep". */
export function formatDayLabel(iso: string, now: number = DEMO_NOW) {
  const at = Date.parse(iso);
  const days = calendarDaysBetween(at, now);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return dayMonth.format(at);
}

/** A calendar date on the desk clock: "2 Sep". */
export const formatShortDate = (iso: string) => dayMonth.format(Date.parse(iso));

const localTimeFormats = new Map<string, Intl.DateTimeFormat>();

/** The customer's wall-clock time, so a reply is never written as if it were evening where they are. */
export function formatLocalTime(now: number, timeZone: string) {
  let format = localTimeFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    localTimeFormats.set(timeZone, format);
  }
  return format.format(now);
}

/** "4:07" for a remaining duration, rounded up so it reads 0:01 until the deadline passes. */
export function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
