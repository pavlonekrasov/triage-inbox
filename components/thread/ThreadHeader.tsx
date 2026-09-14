"use client";

import { ChevronLeft, Languages, PanelRight, PanelRightClose } from "lucide-react";
import { Button } from "@/components/controls/Button";
import { isContextOpen, useDesk } from "@/components/desk/desk-store";
import { Glass } from "@/components/glass/Glass";
import { RouteGlyph } from "@/components/inbox/RouteGlyph";
import { glyphKind } from "@/components/inbox/TicketRow";
import { COLLEAGUE } from "@/data/team";
import { avatarStyle, initials } from "@/lib/avatar";
import { formatLocalTime } from "@/lib/clock";
import { isEnglish, languageCode, languageName } from "@/lib/language";
import { hasTranslation } from "@/lib/timeline";
import type { Ticket } from "@/lib/types";
import { useDemoNow } from "@/lib/use-demo-now";
import { usePhoneDesk, useWideDesk } from "@/lib/use-wide-desk";
import { cn } from "@/lib/utils";
import { ThreadMenu } from "./ThreadMenu";

/**
 * Glass surface 1 of 4 (brief 6.5): floats over the scrolling thread with the strong tint, because it
 * carries text. It answers "who is this and where do they stand": name, language, the customer's
 * wall-clock time, and the route. A long name wraps here; the list truncates it.
 */
export function ThreadHeader({ ticket }: { ticket: Ticket }) {
  const { customer, triage } = ticket;
  const { state, dispatch } = useDesk();
  const now = useDemoNow();
  const phone = usePhoneDesk();

  return (
    <Glass surface="thread-header" className="pointer-events-auto flex max-w-full items-center gap-2.5 py-1.5 pr-1.5 pl-1.5">
      {/* Phone (brief 7.2): the pill carries Telegram's back chevron to the list. */}
      {phone && (
        <Button iconOnly aria-label="Back to conversations" title="Back to conversations" onClick={() => dispatch({ type: "back" })} className="-mr-1">
          <ChevronLeft aria-hidden strokeWidth={1.75} />
        </Button>
      )}
      <span
        aria-hidden
        className="avatar-tint inline-flex size-7 shrink-0 items-center justify-center rounded-full text-micro"
        style={avatarStyle(customer.id)}
      >
        {initials(customer.name)}
      </span>
      {/* min-w-20: on a phone the controls beside the name never squeeze it to one letter per line. */}
      <h2 className="min-w-20 text-title break-words">{customer.name}</h2>
      <div className="flex shrink-0 items-center gap-2 pr-1">
        {ticket.id in state.viewers && <ViewerChip />}
        <LanguageChip ticket={ticket} />
        {/* On a phone the pill has no room for it; the customer details keep the local time. */}
        <span className="hidden text-micro text-muted-foreground tabular-nums md:inline">
          <span className="sr-only">Customer’s local time </span>
          {formatLocalTime(now, customer.timeZone)} local
        </span>
        <RouteGlyph route={glyphKind(triage, state.draftStatus[ticket.id]?.status)} showLabel="md" />
      </div>
      <ContextToggle />
      <ThreadMenu ticket={ticket} />
    </Glass>
  );
}

/** Collision (brief 12): a colleague has this conversation open too, so a send asks first. */
function ViewerChip() {
  return (
    <span data-viewer className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2 pl-0.5 text-micro text-muted-foreground max-md:pr-0.5">
      <span
        aria-hidden
        className="avatar-tint inline-flex size-5 items-center justify-center rounded-full"
        style={avatarStyle(COLLEAGUE.id)}
      >
        {initials(COLLEAGUE.name)}
      </span>
      {/* On a phone the avatar stands for the words, which stay for screen readers. */}
      <span className="max-md:sr-only">{COLLEAGUE.firstName} is viewing</span>
    </span>
  );
}

/** Shows or hides the context panel, which is a sheet below 1280 px (brief 7.2). ] does the same. */
function ContextToggle() {
  const { state, dispatch } = useDesk();
  const wide = useWideDesk();
  const open = isContextOpen(state, wide);
  const Icon = open ? PanelRightClose : PanelRight;
  return (
    <Button
      iconOnly
      data-context-toggle
      aria-pressed={open}
      aria-keyshortcuts="]"
      aria-label="Customer details"
      title={open ? "Hide customer details (])" : "Show customer details (])"}
      onClick={() => dispatch({ type: "setContextOpen", open: !open })}
    >
      <Icon aria-hidden strokeWidth={1.75} />
    </Button>
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
      // An English chip is dropped on a phone to leave the name room; the customer details keep the locale.
      <span className="rounded-full bg-muted px-1.5 text-micro text-muted-foreground max-md:hidden">
        <span className="sr-only">Written in {languageName(tag)}: </span>
        {code}
      </span>
    );
  }

  return (
    <Button
      variant={state.showTranslation ? "ghost" : "outline"}
      aria-pressed={state.showTranslation}
      aria-label={`Show English translation of ${languageName(tag)}`}
      title={state.showTranslation ? "Hide English translation" : "Show English translation"}
      onClick={() => dispatch({ type: "toggleTranslation" })}
      // A chip inside the 28 px header pill: 24 px tall, micro type, 14 px glyph.
      className={cn("h-6 gap-1 px-2 text-micro [&_svg]:size-3.5", state.showTranslation ? "bg-muted" : "text-muted-foreground")}
    >
      <Languages aria-hidden strokeWidth={1.75} />
      {state.showTranslation ? `${code} → EN` : code}
    </Button>
  );
}
