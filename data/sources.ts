import type { Source } from "@/lib/types";

/** Every policy and help article the agent can retrieve, current and superseded. */
const REGISTRY = {
  "src-cancel-ios": { title: "Cancel a subscription on iPhone", version: "v6", updatedAt: "2026-08-21" },
  "src-cancel-android": { title: "Cancel a subscription on Android", version: "v5", updatedAt: "2026-07-30" },
  "src-cancel-web": { title: "Cancel a web subscription", version: "v3", updatedAt: "2026-06-12" },
  "src-refund-v4": { title: "Refund policy", version: "v4", updatedAt: "2026-09-02" },
  "src-credits-v3": {
    title: "Chat credit refunds",
    version: "v3",
    updatedAt: "2026-03-11",
    supersededBy: "src-credits-v4",
  },
  "src-credits-v4": { title: "Chat credit refunds", version: "v4", updatedAt: "2026-09-02" },
  "src-advisor-conduct": { title: "Advisor conduct reports", version: "v2", updatedAt: "2026-05-19" },
  "src-wellbeing": { title: "Supporting customers in distress", version: "v3", updatedAt: "2026-05-02" },
  "src-login-new-phone": { title: "Sign in on a new phone", version: "v4", updatedAt: "2026-07-08" },
  "src-birth-data": { title: "Edit your birth details", version: "v3", updatedAt: "2026-04-27" },
  "src-privacy-erasure": { title: "Data deletion requests", version: "v2", updatedAt: "2026-02-16" },
  "src-session-drop": { title: "Interrupted advisor sessions", version: "v3", updatedAt: "2026-08-05" },
  "src-notifications": { title: "Notification settings", version: "v5", updatedAt: "2026-06-30" },
  "src-zodiac-system": { title: "How birth charts are calculated", version: "v2", updatedAt: "2026-01-20" },
  "src-change-email": { title: "Change your account email", version: "v2", updatedAt: "2026-05-11" },
  "src-saved-readings": { title: "Find your saved readings", version: "v4", updatedAt: "2026-07-22" },
  "src-email-prefs": { title: "Email preferences", version: "v3", updatedAt: "2026-06-03" },
  "src-multi-device": { title: "Use one account on several devices", version: "v2", updatedAt: "2026-04-09" },
} satisfies Record<string, Omit<Source, "id">>;

export type SourceId = keyof typeof REGISTRY;

export const SOURCE_REGISTRY: ReadonlyMap<string, Source> = new Map(
  Object.entries(REGISTRY).map(([id, source]) => [id, { id, ...source }]),
);

export function sources(...ids: SourceId[]): Source[] {
  return ids.map((id) => ({ id, ...REGISTRY[id] }));
}
