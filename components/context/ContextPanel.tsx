"use client";

import { ChevronRight, FileText, Lock, PanelRightClose, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/controls/Button";
import { useDesk } from "@/components/desk/desk-store";
import { RouteGlyph, type RouteGlyphKind } from "@/components/inbox/RouteGlyph";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SOURCE_REGISTRY } from "@/data/sources";
import { formatClockTime, formatLocalTime, formatShortDate } from "@/lib/clock";
import {
  billingEntries,
  billingStatus,
  contactsStatus,
  formatDate,
  formatUtc,
  formatZoned,
  maskEmail,
  PLATFORM_LABEL,
  sourcesStatus,
  subscriptionStatus,
  zoneLabel,
  type SectionStatus,
} from "@/lib/context";
import type { BillingEvent, ContextSection, Route, Source, Ticket } from "@/lib/types";
import { readDemoNow, useDemoNow } from "@/lib/use-demo-now";
import { cn } from "@/lib/utils";

const ROUTE_KIND: Record<Route, RouteGlyphKind> = { auto_send: "auto", approve_draft: "draft", human_led: "you" };

/**
 * The context panel (brief 7.5): what the agent read about the customer, so the specialist can check
 * the AI's evidence without leaving the thread. Opaque, like all content (6.5): cards on the list
 * pane's tone. Restricted fields are shown with a lock rather than hidden, because knowing a field
 * exists and is out of the agent's reach is part of trusting what it did read.
 */
export function ContextPanel({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const { state, dispatch } = useDesk();
  const root = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const focus = state.contextFocus;

  /*
   * A citation or flag elsewhere asked for a row: move focus to it, bring it into view, and flash an
   * ink wash that fades over 600 ms with ease-in, so it holds near full strength before it goes. Then
   * the request is marked done, so showing the panel again later does not replay it. Under reduced
   * motion there is no flash; the focus ring marks the row.
   */
  useEffect(() => {
    if (!focus) return;
    const row = body.current?.querySelector<HTMLElement>(`[data-context-target="${CSS.escape(focus.target)}"]`);
    if (row) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Focus first: in Chromium a focus call after a smooth scroll starts cancels the scroll.
      row.focus({ preventScroll: true });
      row.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      if (!reduced) {
        row.querySelector("[data-flash]")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: "ease-in" });
      }
    }
    dispatch({ type: "contextFocusDone", nonce: focus.nonce });
  }, [focus, dispatch]);

  // Hiding the panel with focus inside it hands focus to the header button that shows it again.
  // A layout cleanup runs while the panel is still in the document, so the check still sees focus.
  useLayoutEffect(() => {
    const panel = root.current;
    return () => {
      if (panel?.contains(document.activeElement)) document.querySelector<HTMLElement>("[data-context-toggle]")?.focus();
    };
  }, []);

  return (
    <aside ref={root} aria-label="Customer details" data-context-panel className="flex h-full min-h-0 flex-col bg-sidebar">
      <header className="flex h-14 shrink-0 items-center gap-2 pr-2 pl-4">
        <h2 className="min-w-0 flex-1 truncate text-title">Customer details</h2>
        <Button
          iconOnly
          aria-label="Hide customer details"
          aria-keyshortcuts="]"
          title="Hide customer details (])"
          onClick={onClose}
        >
          <PanelRightClose aria-hidden strokeWidth={1.75} />
        </Button>
      </header>
      <div ref={body} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-3 pb-3">
        <CustomerSection ticket={ticket} />
        <SubscriptionSection ticket={ticket} />
        <BillingSection ticket={ticket} />
        <SourcesSection sources={ticket.triage.sources} />
        {ticket.triage.category.primary === "advisor_complaint" && <AdvisorSection ticket={ticket} />}
        <ContactsSection ticket={ticket} />
      </div>
    </aside>
  );
}

/** Below 1280 px the panel is a right sheet, opened from the header pill or with ] (brief 7.2). */
export function ContextSheet({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-context-sheet
        data-pass-shortcut="toggle-context"
        aria-label={`Details for ${ticket.customer.name}`}
        className="gap-0 border-border p-0 data-[side=right]:w-[min(22rem,100vw)] data-[side=right]:sm:max-w-none"
      >
        <ContextPanel key={ticket.id} ticket={ticket} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function Section({
  id,
  title,
  status,
  children,
}: {
  id: ContextSection;
  title: string;
  status: SectionStatus;
  children: ReactNode;
}) {
  const { state, dispatch } = useDesk();
  const open = !state.collapsedSections.includes(id);

  return (
    <Collapsible
      open={open}
      onOpenChange={() => dispatch({ type: "toggleSection", section: id })}
      data-context-section={id}
      className="shrink-0 rounded-card border border-border bg-card"
    >
      {/* Open, the header sits on the panel body, so its hover fill squares off at the bottom. */}
      <CollapsibleTrigger
        render={<Button className={cn("h-10 w-full justify-start gap-2 rounded-[inherit] px-3", open && "rounded-b-none")} />}
      >
        <ChevronRight
          aria-hidden
          strokeWidth={1.75}
          className={cn("text-muted-foreground transition-[rotate] duration-(--dur-hover) motion-reduce:transition-none", open && "rotate-90")}
        />
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        {/* The status is words, with a glyph when it is a risk: never colour alone (review gate 6). */}
        <span className={cn("flex items-center gap-1 text-micro", status.risk ? "text-risk-high" : "text-muted-foreground")}>
          {status.risk && <TriangleAlert aria-hidden className="size-3.5!" strokeWidth={1.75} />}
          {status.text}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-3 pt-2.5 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function Fields({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-body-s">{children}</dl>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

function RestrictedFields({ ticket, section }: { ticket: Ticket; section: ContextSection }) {
  return ticket.account.restricted
    .filter((field) => field.section === section)
    .map((field) => (
      <Field key={field.label} label={field.label}>
        <span data-restricted className="inline-flex items-center gap-1 text-muted-foreground">
          <Lock aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
          Restricted
        </span>
        <span className="block text-micro text-muted-foreground">{field.reason}</span>
      </Field>
    ));
}

/** A row a citation can point at. The panel moves focus to it and animates its wash when asked for. */
function Target({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <li
      data-context-target={id}
      tabIndex={-1}
      className={cn(
        "relative rounded-input outline-none motion-reduce:focus:outline-2 motion-reduce:focus:outline-offset-2 motion-reduce:focus:outline-solid motion-reduce:focus:outline-ring",
        className,
      )}
    >
      <span data-flash aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground/10 opacity-0" />
      {children}
    </li>
  );
}

function CustomerSection({ ticket }: { ticket: Ticket }) {
  const { state, dispatch } = useDesk();
  const now = useDemoNow();
  const { customer } = ticket;
  const revealedAt = state.revealedEmails[ticket.id];
  const email = useRef<HTMLSpanElement>(null);
  const revealing = useRef(false);

  // Reveal removes its own button, so focus moves to the address it revealed.
  useEffect(() => {
    if (!revealedAt || !revealing.current) return;
    revealing.current = false;
    email.current?.focus();
  }, [revealedAt]);

  return (
    <Section id="customer" title="Customer" status={{ text: PLATFORM_LABEL[customer.platform], risk: false }}>
      <Fields>
        <Field label="Name">{customer.name}</Field>
        <Field label="Email">
          {revealedAt ? (
            <>
              <span
                ref={email}
                tabIndex={-1}
                className="rounded-xs break-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
              >
                {customer.email}
              </span>
              <span className="block text-micro text-muted-foreground">
                Revealed by you at {formatClockTime(revealedAt)}, logged in the thread
              </span>
            </>
          ) : (
            <span className="flex flex-wrap items-center gap-x-2">
              <span className="break-all">{maskEmail(customer.email)}</span>
              <Button
                variant="text"
                aria-label={`Reveal ${customer.name}'s email address. The reveal is logged.`}
                onClick={() => {
                  revealing.current = true;
                  dispatch({ type: "revealEmail", id: ticket.id, now: readDemoNow() });
                }}
              >
                Reveal
              </Button>
            </span>
          )}
        </Field>
        <Field label="Locale">{customer.locale}</Field>
        <Field label="Local time">
          <span className="tabular-nums">{formatLocalTime(now, customer.timeZone)}</span> · {zoneLabel(customer.timeZone)}
        </Field>
        <Field label="Platform">{PLATFORM_LABEL[customer.platform]}</Field>
        <Field label="Customer since">{formatDate(customer.customerSince)}</Field>
        <Field label="Contacts">
          {customer.lifetimeContacts === 1 ? "This is the first" : `${customer.lifetimeContacts}, including this one`}
        </Field>
        <RestrictedFields ticket={ticket} section="customer" />
      </Fields>
    </Section>
  );
}

function SubscriptionSection({ ticket }: { ticket: Ticket }) {
  const { subscription } = ticket.account;
  const zone = ticket.customer.timeZone;

  return (
    <Section id="subscription" title="Subscription" status={subscriptionStatus(subscription)}>
      {!subscription && <p className="mb-1.5 text-body-s text-muted-foreground">No subscription on record.</p>}
      <Fields>
        {subscription && (
          <>
            <Field label="Plan">{subscription.plan}</Field>
            <Field label="Price">
              <span className="tabular-nums">{subscription.price}</span>
            </Field>
            <Field label="Status">{subscription.status === "active" ? "Active" : "Cancelled"}</Field>
            <Field label="Billed through">{subscription.store}</Field>
            {subscription.renewsAt && <Field label="Renews">{formatDate(subscription.renewsAt)}</Field>}
            {subscription.cancelledAt && (
              <Field label="Cancelled">
                <span className="tabular-nums">{formatZoned(subscription.cancelledAt, zone)}</span> · {zoneLabel(zone)}
              </Field>
            )}
            {subscription.cancelledIn && <Field label="Cancelled in">{subscription.cancelledIn}</Field>}
          </>
        )}
        <RestrictedFields ticket={ticket} section="subscription" />
      </Fields>
    </Section>
  );
}

function BillingSection({ ticket }: { ticket: Ticket }) {
  const { account, customer } = ticket;
  const entries = billingEntries(account);
  const zone = customer.timeZone;

  return (
    <Section id="billing" title="Billing timeline" status={billingStatus(account)}>
      {entries.length === 0 ? (
        <p className="text-body-s text-muted-foreground">No charges on record.</p>
      ) : (
        <>
          <p className="mb-1.5 text-micro text-muted-foreground">Times in the customer&rsquo;s zone: {zoneLabel(zone)}.</p>
          <ol aria-label="Billing records, oldest first" className="flex flex-col">
            {entries.map((entry) =>
              entry.kind === "event" ? (
                <li key={entry.event.id} className="flex gap-2.5 py-1.5">
                  <span aria-hidden className="mt-1.75 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                  <div className="min-w-0">
                    <BillingLabel event={entry.event} />
                    <p className="text-micro text-muted-foreground tabular-nums">
                      {formatZoned(entry.event.at, zone)} · {entry.event.system}
                    </p>
                  </div>
                </li>
              ) : (
                <Target key="conflict" id="billing-conflict" className="my-1 bg-risk-high-wash p-2.5">
                  <p className="flex items-center gap-1 text-label text-risk-high">
                    <TriangleAlert aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
                    Sources disagree · {entry.minutes} {entry.minutes === 1 ? "minute" : "minutes"} apart
                  </p>
                  {/* Side by side, each in the customer's time with the UTC original underneath (brief 7.5). */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {entry.events.map((event) => (
                      <div key={event.id} data-conflict-record className="min-w-0 rounded-input border border-border bg-card p-2">
                        <p className="text-micro text-muted-foreground">{event.system}</p>
                        {/* 131 px wide: the amount takes its own line instead of wrapping after a dot. */}
                        <p className="text-body-s">{event.label}</p>
                        {event.amount && <p className="text-body-s tabular-nums">{event.amount}</p>}
                        <p className="mt-1 text-body-s tabular-nums">{formatZoned(event.at, zone)}</p>
                        <p className="text-micro text-muted-foreground tabular-nums">{formatUtc(event.at)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-body-s">{entry.note}</p>
                </Target>
              ),
            )}
          </ol>
        </>
      )}
    </Section>
  );
}

function BillingLabel({ event }: { event: BillingEvent }) {
  return (
    <p className="text-body-s">
      {event.label}
      {event.amount && <span className="tabular-nums"> · {event.amount}</span>}
    </p>
  );
}

function SourcesSection({ sources }: { sources: Source[] }) {
  return (
    <Section id="sources" title="Sources used" status={sourcesStatus(sources)}>
      {sources.length === 0 ? (
        <p className="text-body-s text-muted-foreground">No help article or policy used.</p>
      ) : (
        <ul className="-mx-1.5 flex flex-col gap-0.5">
          {sources.map((source) => {
            const newer = source.supersededBy ? SOURCE_REGISTRY.get(source.supersededBy) : undefined;
            return (
              <Target key={source.id} id={`source:${source.id}`} className="flex gap-2 p-1.5">
                {newer ? (
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-risk-high" strokeWidth={1.75} />
                ) : (
                  <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                )}
                <div className="min-w-0">
                  {newer ? (
                    <>
                      {/* Struck through with the line at 50%; the text keeps its 4.5:1 (review gate 2). */}
                      <p className="text-body-s text-muted-foreground line-through decoration-foreground/50">
                        <span className="sr-only">Outdated: </span>
                        {source.title} {source.version}
                      </p>
                      <p className="text-micro text-risk-high">
                        Newer version exists ({newer.version}, {formatShortDate(newer.updatedAt)})
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-body-s">
                        {source.title} {source.version}
                      </p>
                      <p className="text-micro text-muted-foreground">Updated {formatShortDate(source.updatedAt)}</p>
                    </>
                  )}
                </div>
              </Target>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function AdvisorSection({ ticket }: { ticket: Ticket }) {
  const session = ticket.account.advisorSession;
  if (!session) return null;
  const zone = ticket.customer.timeZone;

  return (
    <Section id="advisor" title="Advisor session" status={{ text: "Locked for review", risk: false }}>
      <Fields>
        <Field label="Session">
          <span className="tabular-nums">{session.id}</span>
        </Field>
        <Field label="Advisor">{session.advisor}</Field>
        <Field label="Started">
          <span className="tabular-nums">{formatZoned(session.startedAt, zone)}</span> · {zoneLabel(zone)}
        </Field>
        <Field label="Duration">{session.minutes} min</Field>
        <Field label="Transcript">
          <span className="inline-flex items-center gap-1">
            <Lock aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
            Preserved · locked for review
          </span>
        </Field>
        <RestrictedFields ticket={ticket} section="advisor" />
      </Fields>
      {/* Brief 7.5: the panel never displays an AI verdict about the advisor. */}
      <p className="mt-2 text-micro text-muted-foreground">Trust &amp; Safety reviews the session. No judgment about the advisor is shown here.</p>
    </Section>
  );
}

function ContactsSection({ ticket }: { ticket: Ticket }) {
  const { account, customer } = ticket;
  const firstName = customer.name.split(" ")[0];

  return (
    <Section id="contacts" title="Previous contacts" status={contactsStatus(account)}>
      {account.previousContacts.length === 0 ? (
        <p className="text-body-s text-muted-foreground">This is {firstName}&rsquo;s first contact.</p>
      ) : (
        <ol aria-label="Last three contacts, newest first" className="flex flex-col gap-2.5">
          {account.previousContacts.map((contact) => (
            <li key={contact.id} data-reopened={contact.reopened ?? false} className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-micro text-muted-foreground tabular-nums">
                <span>{formatZoned(contact.at, customer.timeZone)}</span>
                <RouteGlyph route={ROUTE_KIND[contact.route]} />
                {contact.reopened && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-risk-high-wash px-1.5 text-risk-high">
                    <RotateCcw aria-hidden className="size-3" strokeWidth={2} />
                    Reopened
                  </span>
                )}
              </div>
              <p className="text-body-s">{contact.topic}</p>
              <p className="text-micro text-muted-foreground">
                {contact.outcome}
                {contact.reopened && `; ${firstName} came back about it`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
