"use client";

import { Flag, HandHeart, Pencil, Reply, RotateCw, Send, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/controls/Button";
import { KeyHint } from "@/components/controls/KeyHint";
import { contextFor, latestUndoable, useDesk } from "@/components/desk/desk-store";
import { Glass } from "@/components/glass/Glass";
import { TICKETS_BY_ID } from "@/data/tickets";
import { formatClockTime } from "@/lib/clock";
import { decisionFor, type PrimaryKind } from "@/lib/decision";
import { teamLabel } from "@/lib/escalation";
import type { Ticket } from "@/lib/types";
import { readDemoNow } from "@/lib/use-demo-now";
import { EscalatePopover } from "./EscalatePopover";

export const PRIMARY_ICON: Record<PrimaryKind, LucideIcon> = {
  approve: Send,
  "send-variant": Send,
  "take-over": HandHeart,
  acknowledge: ShieldCheck,
  "review-send": Pencil,
  "follow-up": Reply,
  retry: RotateCw,
  write: Pencil,
};

/** 18 px icons in the decision bar (brief 6.6), and 14 px sides so three labelled decisions with key hints fit 560 px. */
export const BAR_BUTTON = "px-3.5 [&_svg]:size-4.5";

/**
 * Glass surface 2 of 4 (brief 6.5): floats 16 px above the thread's bottom edge, centred, 560 px at
 * most. The primary always names what will happen (9.1). A refused action stays visible and
 * pressable, and pressing it says why, above the bar (9.2).
 */
export function DecisionBar({ ticket }: { ticket: Ticket }) {
  const { state, dispatch } = useDesk();
  const escalation = state.escalations[ticket.id];
  // An escalated case stays on screen when it was the last in its lane. It says where it went; there is nothing left to decide here.
  if (escalation) {
    return (
      <p
        data-escalated={escalation.team}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-body-s"
      >
        <UsersRound aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        With {teamLabel(escalation.team)} · escalated by you at {formatClockTime(escalation.at)}
      </p>
    );
  }

  const decision = decisionFor(ticket, contextFor(state, ticket.id));
  const { primary, edit, variants } = decision;
  const PrimaryIcon = PRIMARY_ICON[primary.kind];
  const markedWrong = ticket.id in state.markedWrong;

  return (
    <>
      {/* The outcome choice sits directly above the bar, as its own opaque control: the bar keeps
          its three labelled decisions within 560 px, and the choice reads as a step before sending. */}
      {variants.length > 0 && (
        <div
          data-variant-choice
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-3"
        >
          <span id={`variant-label-${ticket.id}`} className="text-label text-muted-foreground">
            Reply to send
          </span>
          <div role="radiogroup" aria-labelledby={`variant-label-${ticket.id}`} className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
            {variants.map((variant) => (
              <label key={variant.id} className="relative">
                <input
                  type="radio"
                  name={`variant-${ticket.id}`}
                  value={variant.id}
                  checked={state.variantChoice[ticket.id] === variant.id}
                  onChange={() => dispatch({ type: "chooseVariant", draftId: variant.id })}
                  className="peer sr-only"
                />
                <span className="flex h-7 cursor-default items-center rounded-full px-3 text-label text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-(--shadow-thumb) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-solid peer-focus-visible:outline-ring">
                  {variant.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Glass
        surface="decision-bar"
        role="group"
        aria-label={`Decide on the conversation with ${ticket.customer.name}`}
        className="pointer-events-auto flex max-w-[min(35rem,100%)] items-center gap-1 p-1.5"
      >
        <Button
          variant="primary"
          size="md"
          data-primary={primary.kind}
          aria-disabled={primary.blocked ? true : undefined}
          aria-keyshortcuts={primary.kind === "approve" ? "A" : undefined}
          className={BAR_BUTTON}
          onClick={() => dispatch({ type: "decide", now: readDemoNow(), wall: Date.now() })}
        >
          <PrimaryIcon aria-hidden strokeWidth={1.75} />
          {primary.label}
          {primary.kind === "approve" && <KeyHint onPrimary>A</KeyHint>}
        </Button>

        {edit && (
          <Button
            size="md"
            aria-disabled={edit.blocked ? true : undefined}
            aria-keyshortcuts="E"
            className={BAR_BUTTON}
            onClick={() => dispatch({ type: "openComposer" })}
          >
            <Pencil aria-hidden strokeWidth={1.75} />
            {edit.label}
            <KeyHint>E</KeyHint>
          </Button>
        )}

        {decision.markWrong && (
          <Button
            size="md"
            aria-pressed={markedWrong}
            className={BAR_BUTTON}
            onClick={() => dispatch({ type: "toggleMarkWrong", now: readDemoNow() })}
          >
            <Flag aria-hidden strokeWidth={1.75} />
            Mark as wrong
          </Button>
        )}

        <EscalatePopover ticket={ticket} />
      </Glass>
    </>
  );
}

/**
 * Feedback for decisions, directly above the bar: why a refused action did nothing, and the Undo for
 * a reply whose conversation is no longer on screen. When the sent reply is visible, its own bubble
 * carries the Undo instead.
 */
export function BarFeedback({ ticket }: { ticket: Ticket }) {
  const { state, dispatch } = useDesk();
  const notice = state.notice?.where === "bar" ? state.notice : null;
  const undoable = latestUndoable(state.outbox);
  // A bulk send has one toast, in the list where it was sent from (brief 9.3), so it gets no pill here.
  const away = undoable && undoable.batch === null && undoable.ticketId !== ticket.id ? undoable : null;
  const awayName = away ? TICKETS_BY_ID.get(away.ticketId)?.customer.name : undefined;

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
      {notice && (
        <p className="pointer-events-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-card px-3 py-1.5 text-body-s">
          <span>{notice.text}</span>
          {notice.action && (
            <Button variant="text" onClick={() => dispatch(notice.action!.dispatch)}>
              {notice.action.label}
            </Button>
          )}
        </p>
      )}
      {away && (
        <p className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-body-s">
          <span>Sent to {awayName}</span>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <Button
            key={`${away.ticketId}:${away.attempt}`}
            variant="undo"
            undoUntil={away.undoUntil}
            onClick={() => dispatch({ type: "undoSend", id: away.ticketId })}
          />
        </p>
      )}
    </div>
  );
}
