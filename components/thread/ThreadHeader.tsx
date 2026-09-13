"use client";

import { Languages } from "lucide-react";
import { useDesk } from "@/components/desk/desk-store";
import { Glass } from "@/components/glass/Glass";
import { RouteGlyph } from "@/components/inbox/RouteGlyph";
import { glyphKind } from "@/components/inbox/TicketRow";
import { avatarStyle, initials } from "@/lib/avatar";
import { formatLocalTime } from "@/lib/clock";
import { isEnglish, languageCode, languageName } from "@/lib/language";
import { hasTranslation } from "@/lib/timeline";
import type { Ticket } from "@/lib/types";
import { useDemoNow } from "@/lib/use-demo-now";
import { cn } from "@/lib/utils";
import { ThreadMenu } from "./ThreadMenu";

/**
 * Glass surface 1 of 4 (brief 6.5): floats over the scrolling thread with the strong tint, because it
 * carries text. It answers "who is this and where do they stand": name, language, the customer's
 * wall-clock time, and the route. A long name wraps here; the list truncates it.
 */
export function ThreadHeader({ ticket }: { ticket: Ticket }) {
  const { customer, triage } = ticket;
  const now = useDemoNow();

  return (
    <Glass surface="thread-header" className="pointer-events-auto flex max-w-full items-center gap-2.5 py-1.5 pr-1.5 pl-1.5">
      <span
        aria-hidden
        className="avatar-tint inline-flex size-7 shrink-0 items-center justify-center rounded-full text-micro"
        style={avatarStyle(customer.id)}
      >
        {initials(customer.name)}
      </span>
      <h2 className="min-w-0 text-title break-words">{customer.name}</h2>
      <div className="flex shrink-0 items-center gap-2 pr-1">
        <LanguageChip ticket={ticket} />
        <span className="text-micro text-muted-foreground tabular-nums">
          <span className="sr-only">Customer’s local time </span>
          {formatLocalTime(now, customer.timeZone)} local
        </span>
        <RouteGlyph route={glyphKind(triage)} />
      </div>
      <ThreadMenu ticket={ticket} />
    </Glass>
  );
}

/**
 * English tickets show their code. Tickets in another language show "ES → EN", which is also the
 * switch for the English translation under every message and draft.
 */
function LanguageChip({ ticket }: { ticket: Ticket }) {
  const { state, dispatch } = useDesk();
  const tag = ticket.triage.language;
  const code = languageCode(tag);

  if (isEnglish(tag) || !hasTranslation(ticket)) {
    return (
      <span className="rounded-full bg-muted px-1.5 text-micro text-muted-foreground">
        <span className="sr-only">Written in {languageName(tag)}: </span>
        {code}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={state.showTranslation}
      aria-label={`Show English translation of ${languageName(tag)}`}
      title={state.showTranslation ? "Hide English translation" : "Show English translation"}
      onClick={() => dispatch({ type: "toggleTranslation" })}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-micro outline-none",
        "transition-colors duration-(--dur-hover) hover:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
        state.showTranslation ? "bg-muted text-foreground" : "border border-border text-muted-foreground",
      )}
    >
      <Languages aria-hidden className="size-3.5" strokeWidth={1.75} />
      {state.showTranslation ? `${code} → EN` : code}
    </button>
  );
}
