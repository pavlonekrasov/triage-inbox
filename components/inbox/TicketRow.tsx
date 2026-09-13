"use client";

import { Check, CheckCheck, Pin } from "lucide-react";
import { memo } from "react";
import { avatarStyle, initials } from "@/lib/avatar";
import { isEnglish, languageCode } from "@/lib/language";
import { isPinned, isResolved } from "@/lib/lanes";
import type { Ticket, TriageResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryGlyph } from "./CategoryGlyph";
import { ListTime } from "./ListTime";
import { RouteGlyph, type RouteGlyphKind } from "./RouteGlyph";

export const rowId = (ticketId: string) => `row-${ticketId}`;

export function glyphKind(triage: TriageResult): RouteGlyphKind {
  if (triage.route === "auto_send") return "auto";
  if (triage.route === "approve_draft") return "draft";
  return triage.hardRules.includes("wellbeing") ? "wellbeing" : "you";
}

/** Language chip only when the customer did not write in English: an EN chip on most rows is noise. */
const foreignLanguage = (bcp47: string) => (isEnglish(bcp47) ? null : languageCode(bcp47));

type TicketRowProps = {
  ticket: Ticket;
  open: boolean;
  checked: boolean;
  editMode: boolean;
  tabbable: boolean;
  last: boolean;
  onActivate: (id: string) => void;
};

/*
 * Anatomy (brief 7.3): 72px row, 12px side padding, 44px avatar, text column at 68px, separator
 * inset to 68px. The right column is exactly 28px (12px gap + 16px glyph), which is the distance the
 * row travels in edit mode, so the timestamp lands where the route glyph was and nothing clips.
 */
export const TicketRow = memo(function TicketRow({
  ticket,
  open,
  checked,
  editMode,
  tabbable,
  last,
  onActivate,
}: TicketRowProps) {
  const { customer, triage } = ticket;
  const resolved = isResolved(ticket);
  const pinned = isPinned(ticket);
  const language = foreignLanguage(triage.language);

  return (
    <button
      type="button"
      role="option"
      id={rowId(ticket.id)}
      aria-selected={editMode ? checked : open}
      tabIndex={tabbable ? 0 : -1}
      data-open={open && !editMode}
      data-edit={editMode}
      onClick={() => onActivate(ticket.id)}
      className={cn(
        "group/row relative flex h-18 w-full scroll-mt-14 items-center overflow-hidden px-3 text-left outline-none select-none",
        // outline-none sets outline-style: none, so the ring must restore the style, not only the width.
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
        // Selection paints the row with no transition, so J/K stays instant (brief 10).
        "data-[open=true]:bg-accent",
        // Hover is a separate overlay; only its opacity eases, so it never delays a selection.
        "before:pointer-events-none before:absolute before:inset-0 before:bg-accent before:opacity-0 before:transition-opacity before:duration-120 before:ease-[ease] hover:before:opacity-100 data-[open=true]:before:hidden",
        !last && "after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-17 after:h-px after:bg-border",
      )}
    >
      {/* Edit-mode checkbox: enters from the left together with the row, 200ms, no stagger. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-3 flex size-5 -translate-x-7 -translate-y-1/2 items-center justify-center rounded-full border opacity-0",
          "transition-[translate,opacity] duration-[calc(200ms*var(--motion))] ease-out",
          "group-data-[edit=true]/row:translate-x-0 group-data-[edit=true]/row:opacity-100",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-card",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={2.5} />}
      </span>

      <span className="relative flex min-w-0 flex-1 items-center gap-3 transition-[translate] duration-[calc(200ms*var(--motion))] ease-out group-data-[edit=true]/row:translate-x-7">
        <span
          aria-hidden
          className="avatar-tint inline-flex size-11 shrink-0 items-center justify-center rounded-full text-label"
          style={avatarStyle(customer.id)}
        >
          {initials(customer.name)}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "truncate text-label group-data-[open=true]/row:font-semibold",
                resolved && "text-muted-foreground",
              )}
            >
              {customer.name}
            </span>
            {language && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 text-micro text-muted-foreground">
                <span className="sr-only">Written in </span>
                {language}
              </span>
            )}
            <span className="ml-auto flex shrink-0 items-center gap-1 pl-2 text-micro text-muted-foreground tabular-nums">
              {pinned && (
                <>
                  <Pin aria-hidden className="size-3.5" strokeWidth={1.75} />
                  <span className="sr-only">Pinned. </span>
                </>
              )}
              {resolved && (
                <>
                  <CheckCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
                  <span className="sr-only">Sent </span>
                </>
              )}
              <ListTime ticket={ticket} />
            </span>
          </span>

          <span className="flex min-w-0 items-center gap-1.5 text-body-s text-muted-foreground">
            <CategoryGlyph category={triage.category.primary} />
            {/* Telegram's "Draft:" preview prefix: a word in ink weight, so the marker costs the name no width. */}
            <span className="truncate">
              {ticket.spotCheck && <span className="font-medium text-foreground">Spot-check: </span>}
              {triage.summary}
            </span>
          </span>
        </span>

        <span className="flex w-4 shrink-0 justify-center transition-opacity duration-[calc(200ms*var(--motion))] group-data-[edit=true]/row:opacity-0">
          <RouteGlyph route={glyphKind(triage)} showLabel={false} />
        </span>
      </span>
    </button>
  );
});
