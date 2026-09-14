"use client";

import { MessagesSquare } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { threadOverlay, useDesk } from "@/components/desk/desk-store";
import { TICKETS_BY_ID } from "@/data/tickets";
import { formatClockTime } from "@/lib/clock";
import { buildTimeline, type TimelineOverlay } from "@/lib/timeline";
import type { Ticket } from "@/lib/types";
import { CustomerBubble, SentBubble } from "./Bubble";
import { BarFeedback, DecisionBar } from "./DecisionBar";
import { EditComposer } from "./EditComposer";
import { PinnedSummary } from "./PinnedSummary";
import { DraftFailedBubble, DraftingBubble, ReplyBubble } from "./ReplyBubble";
import { DaySeparator, ServiceGroup } from "./ServiceMessage";
import { ThreadHeader } from "./ThreadHeader";

export function ThreadPane({ compact = false }: { compact?: boolean }) {
  const { state } = useDesk();
  const ticket = state.openId ? TICKETS_BY_ID.get(state.openId) : undefined;
  const scroller = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const hasTicket = ticket !== undefined;

  // The swap fade runs only after the specialist changes conversation, never on first paint (brief 10).
  const [seen, setSeen] = useState({ id: state.openId, swapped: false });
  if (seen.id !== state.openId) setSeen({ id: state.openId, swapped: true });

  /*
   * The header strip and the dock float over the thread. The dock's height becomes the timeline's
   * bottom padding, so the last bubble always clears the decision bar or the composer.
   *
   * A thread at its latest message stays there whatever grows: a new reply or service message, the
   * composer, or "Why this route". Scrolled up, only the strip's growth is compensated, so the message
   * being read stays where it was. "At the latest message" is measured on scroll, before the growth,
   * because afterwards the new content already sits below the fold. Browser scroll anchoring is off so
   * nothing corrects twice (and Safari has none).
   */
  useLayoutEffect(() => {
    const pane = scroller.current;
    const top = strip.current;
    const bottom = dock.current;
    const timeline = pane?.querySelector("ol");
    if (!pane || !top || !bottom || !timeline) return;
    let topHeight = top.offsetHeight;
    let dockHeight = bottom.offsetHeight;
    let atLatest = true;
    pane.style.setProperty("--dock-h", `${dockHeight}px`);
    const onScroll = () => {
      atLatest = pane.scrollHeight - pane.clientHeight - pane.scrollTop < 2;
    };
    const observer = new ResizeObserver(() => {
      const nextTop = top.offsetHeight;
      const nextDock = bottom.offsetHeight;
      if (nextDock !== dockHeight) pane.style.setProperty("--dock-h", `${nextDock}px`);
      if (atLatest) pane.scrollTop = pane.scrollHeight;
      else pane.scrollTop += nextTop - topHeight;
      topHeight = nextTop;
      dockHeight = nextDock;
    });
    pane.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(top);
    observer.observe(bottom);
    observer.observe(timeline);
    return () => {
      pane.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [hasTicket, state.openId]);

  // Open at the latest message, before paint, like every messaging app.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.openId]);

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

  const composer = state.composers[ticket.id] ?? null;

  return (
    <main aria-label={`Conversation with ${ticket.customer.name}`} className="wallpaper @container/thread relative h-full min-w-0">
      <div ref={scroller} className="flex h-full flex-col overflow-y-auto overscroll-contain [overflow-anchor:none]">
        {/* The header and the pinned summary float and the thread scrolls under them; the strip itself
            lets clicks through. px-6 and max-w-168 line the card up with the bubble column below. */}
        <div
          ref={strip}
          className="pointer-events-none sticky top-0 z-10 flex shrink-0 flex-col items-center gap-2 px-3 pt-3 md:px-6"
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
          className="mx-auto flex w-full max-w-180 shrink-0 grow flex-col justify-end gap-3 px-3 pt-6 md:px-6 pb-[calc(var(--dock-h,4.5rem)+1rem)] motion-safe:data-[swap=true]:animate-thread-in"
        >
          <Timeline ticket={ticket} overlay={threadOverlay(state, ticket)} showTranslation={state.showTranslation} compact={compact} />
        </ol>
      </div>

      {/* The dock floats 16 px above the bottom edge, or above a phone's home indicator (safe area), with
          decision feedback, then the bar or the composer. */}
      <div
        ref={dock}
        data-dock
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6"
      >
        <BarFeedback ticket={ticket} />
        {composer ? (
          <EditComposer key={`${ticket.id}:${composer.mode}`} ticket={ticket} composer={composer} />
        ) : (
          <DecisionBar ticket={ticket} />
        )}
      </div>
    </main>
  );
}

function Timeline({ ticket, overlay, showTranslation, compact }: { ticket: Ticket; overlay: TimelineOverlay; showTranslation: boolean; compact: boolean }) {
  const { state, dispatch } = useDesk();
  const { customer, triage } = ticket;
  // The three-case export omits processing logs and previews one variant at a time. The radio choice
  // still controls the real decision; merely displaying the first variant never selects it for sending.
  const previewId = state.variantChoice[ticket.id] ?? triage.drafts[0]?.id;
  const items = buildTimeline(ticket, undefined, overlay).filter(item => !compact || (
    item.kind !== "day" && item.kind !== "steps" && item.kind !== "spot-check" &&
    (item.kind !== "draft" || item.draft.id === previewId)
  ));
  const lastDraftKey = items.filter((i) => i.kind === "draft").at(-1)?.key;

  return items.map((item) => {
    switch (item.kind) {
      case "day":
        return <DaySeparator key={item.key} label={item.label} />;
      case "steps":
        return <ServiceGroup key={item.key} label="What the AI did" lines={item.steps.map((s) => s.text)} />;
      case "spot-check":
        return <ServiceGroup key={item.key} label="Quality check" lines={["Sampled for a spot-check by a person"]} />;
      case "event":
        return <ServiceGroup key={item.key} label="What you did" lines={[`${item.text} · ${formatClockTime(item.at)}`]} />;
      case "draft":
        return (
          <ReplyBubble
            key={item.key}
            kind="draft"
            draft={item.draft}
            variantCount={item.variantCount}
            sources={triage.sources}
            showSources={item.key === lastDraftKey}
            onShowSources={(id) => dispatch({ type: "focusContext", section: "sources", target: `source:${id}` })}
            showTranslation={showTranslation}
          />
        );
      case "reply": {
        // Only the latest reply can still be undone or retried; the ones before it were delivered.
        const outgoing = state.outbox[ticket.id];
        const latest = outgoing && String(outgoing.attempt) === item.reply.id ? outgoing : undefined;
        const draft = triage.drafts.find((d) => d.id === item.reply.draftId);
        return (
          <ReplyBubble
            key={item.key}
            kind="reply"
            reply={item.reply}
            gloss={draft && item.reply.body === draft.body ? draft.glossEn : undefined}
            undoUntil={latest?.undoUntil}
            onUndo={() => dispatch({ type: "undoSend", id: ticket.id })}
            onRetry={() => dispatch({ type: "retrySend", id: ticket.id })}
            offline={!state.online}
            showTranslation={showTranslation}
          />
        );
      }
      case "drafting":
        return <DraftingBubble key={item.key} />;
      case "draft-failed":
        return (
          <DraftFailedBubble key={item.key} onRetry={() => dispatch({ type: "retryDraft", id: ticket.id, wall: Date.now() })} />
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
