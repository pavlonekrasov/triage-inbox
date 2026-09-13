"use client";

import { MessagesSquare } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useDesk } from "@/components/desk/desk-store";
import { TICKETS_BY_ID } from "@/data/tickets";
import { buildTimeline } from "@/lib/timeline";
import type { Ticket } from "@/lib/types";
import { CustomerBubble, SentBubble } from "./Bubble";
import { DraftBubble } from "./DraftBubble";
import { PinnedSummary } from "./PinnedSummary";
import { DaySeparator, ServiceGroup } from "./ServiceMessage";
import { ThreadHeader } from "./ThreadHeader";

export function ThreadPane() {
  const { state } = useDesk();
  const ticket = state.openId ? TICKETS_BY_ID.get(state.openId) : undefined;
  const scroller = useRef<HTMLDivElement>(null);

  // The swap fade runs only after the specialist changes conversation, never on first paint (brief 10).
  const [seen, setSeen] = useState({ id: state.openId, swapped: false });
  if (seen.id !== state.openId) setSeen({ id: state.openId, swapped: true });

  // Open at the latest message, before paint, like every messaging app.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.openId]);

  // The floating strip grows when "Why this route" opens. Its growth pushes the timeline down, so the
  // scroll position moves by the same amount each frame and the message in view stays where it was.
  // Browser scroll anchoring is off so it cannot add a second correction (and Safari has none).
  const strip = useRef<HTMLDivElement>(null);
  const hasTicket = ticket !== undefined;
  useLayoutEffect(() => {
    const el = strip.current;
    const pane = scroller.current;
    if (!el || !pane) return;
    let height = el.offsetHeight;
    const observer = new ResizeObserver(() => {
      const next = el.offsetHeight;
      pane.scrollTop += next - height;
      height = next;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTicket]);

  if (!ticket) {
    return (
      <main aria-label="Conversation" className="wallpaper flex h-full min-w-0 flex-col items-center justify-center gap-2 p-8">
        <MessagesSquare aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-body-s text-muted-foreground">
          {state.listState === "loading" ? "Loading conversations" : "No conversation open."}
        </p>
      </main>
    );
  }

  return (
    <main aria-label={`Conversation with ${ticket.customer.name}`} className="wallpaper h-full min-w-0">
      <div ref={scroller} className="flex h-full flex-col overflow-y-auto overscroll-contain [overflow-anchor:none]">
        {/* The header and the pinned summary float and the thread scrolls under them; the strip itself
            lets clicks through. px-6 and max-w-168 line the card up with the bubble column below. */}
        <div
          ref={strip}
          className="pointer-events-none sticky top-0 z-10 flex shrink-0 flex-col items-center gap-2 px-6 pt-3"
        >
          <ThreadHeader ticket={ticket} />
          <ThreadNotice />
          <PinnedSummary key={ticket.id} ticket={ticket} />
        </div>

        <ol
          key={ticket.id}
          role="list"
          data-swap={seen.swapped}
          aria-label="Timeline"
          className="mx-auto flex w-full max-w-180 shrink-0 grow flex-col justify-end gap-3 px-6 pt-6 pb-8 motion-safe:data-[swap=true]:animate-thread-in"
        >
          <Timeline ticket={ticket} showTranslation={state.showTranslation} />
        </ol>
      </div>
    </main>
  );
}

function Timeline({ ticket, showTranslation }: { ticket: Ticket; showTranslation: boolean }) {
  const { customer, triage } = ticket;

  return buildTimeline(ticket).map((item) => {
    switch (item.kind) {
      case "day":
        return <DaySeparator key={item.key} label={item.label} />;
      case "steps":
        return <ServiceGroup key={item.key} label="What the AI did" lines={item.steps.map((s) => s.text)} />;
      case "spot-check":
        return <ServiceGroup key={item.key} label="Quality check" lines={["Sampled for a spot-check by a person"]} />;
      case "draft":
        return (
          <DraftBubble
            key={item.key}
            draft={item.draft}
            variantCount={item.variantCount}
            sources={triage.sources}
            showTranslation={showTranslation}
          />
        );
      case "message":
        return item.message.author === "customer" ? (
          <CustomerBubble
            key={item.key}
            message={item.message}
            customerName={customer.name}
            language={triage.language}
            showTranslation={showTranslation}
          />
        ) : (
          <SentBubble key={item.key} message={item.message} language={triage.language} showTranslation={showTranslation} />
        );
    }
  });
}

/** Feedback for actions taken from the thread header, directly under it. */
function ThreadNotice() {
  const { state } = useDesk();
  const notice = state.notice?.where === "thread" ? state.notice : null;
  return (
    <div role="status" aria-live="polite" className="flex justify-center">
      {notice && (
        <p className="pointer-events-auto max-w-md rounded-card border border-border bg-card px-3 py-1.5 text-center text-body-s">
          {notice.text}
        </p>
      )}
    </div>
  );
}
