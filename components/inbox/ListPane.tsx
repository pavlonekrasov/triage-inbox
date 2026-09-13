"use client";

import { CirclePause, X } from "lucide-react";
import { useCallback, useEffect, type KeyboardEvent } from "react";
import { PillButton } from "@/components/controls/PillButton";
import { PrototypeControls } from "@/components/dev/PrototypeControls";
import { rowsFor, useDesk } from "@/components/desk/desk-store";
import { ThemeIconToggle } from "@/components/theme/ThemeIconToggle";
import { formatDuration, formatPercent, TODAY } from "@/data/metrics";
import { LANES } from "@/lib/lanes";
import { isSureLowRiskDraft } from "@/lib/route";
import type { Lane } from "@/lib/types";
import { LaneEmpty } from "./LaneEmpty";
import { LaneSwitcher } from "./LaneSwitcher";
import { SkeletonRows } from "./SkeletonRows";
import { rowId, TicketRow } from "./TicketRow";

export function ListPane() {
  const { state, dispatch } = useDesk();
  const { lane, listState, editMode, checked, cursorId, openId, dismissed, focusRequest } = state;
  const notice = state.notice?.where === "list" ? state.notice : null;
  const rows = rowsFor(listState, lane, dismissed);

  const counts = Object.fromEntries(
    LANES.map((l) => [l.id, listState === "loading" ? null : rowsFor(listState, l.id, dismissed).length]),
  ) as Record<Lane, number | null>;

  // Keep the keyboard row in view with no smooth scroll: J/K runs hundreds of times a shift.
  useEffect(() => {
    if (cursorId) document.getElementById(rowId(cursorId))?.scrollIntoView({ block: "nearest" });
  }, [cursorId, lane]);

  useEffect(() => {
    if (focusRequest) document.getElementById(rowId(focusRequest.id))?.focus({ preventScroll: true });
  }, [focusRequest]);

  const activate = useCallback((id: string) => dispatch({ type: "activate", id }), [dispatch]);

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const to =
      event.key === "ArrowDown" ? 1
      : event.key === "ArrowUp" ? -1
      : event.key === "Home" ? "first"
      : event.key === "End" ? "last"
      : null;
    if (to === null) return;
    event.preventDefault();
    dispatch({ type: "move", to, focus: true });
  };

  const tabbableId = rows.some((t) => t.id === cursorId) ? cursorId : rows[0]?.id;
  const laneLabel = LANES.find((l) => l.id === lane)?.label ?? "";

  return (
    <section data-list-pane aria-label="Conversations" className="@container flex h-full min-w-0 flex-col bg-sidebar">
      <ListHeader />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* The lane track floats and the list scrolls under it: glass surface 3 of 4 (brief 6.5). */}
        <div className="sticky top-0 z-10 px-3 pt-1 pb-2">
          <LaneSwitcher lane={lane} counts={counts} onSelect={(next) => dispatch({ type: "selectLane", lane: next })} />
          <div role="status" aria-live="polite">
            {notice && (
              <div className="mt-2 flex items-center gap-2 rounded-card border border-border bg-card py-1.5 pr-1.5 pl-3">
                <p className="min-w-0 flex-1 py-0.5 text-body-s">{notice.text}</p>
                {notice.action && (
                  <PillButton variant="outline" onClick={() => dispatch(notice.action!.dispatch)}>
                    {notice.action.label}
                  </PillButton>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          role="tabpanel"
          id="lane-panel"
          aria-labelledby={`lane-tab-${lane}`}
          aria-busy={listState === "loading" || undefined}
        >
          {lane === "drafts" && listState !== "loading" && (
            <p className="mx-3 mb-2 flex items-center gap-2 rounded-card bg-muted px-3 py-2 text-body-s text-muted-foreground">
              <CirclePause aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
              Auto-send paused until 15 Sep: policy v4 rollout
            </p>
          )}

          {listState === "loading" ? (
            <>
              <p className="sr-only">Loading conversations</p>
              <SkeletonRows />
            </>
          ) : rows.length === 0 ? (
            <LaneEmpty lane={lane} />
          ) : (
            <div
              role="listbox"
              aria-label={laneLabel}
              aria-multiselectable={editMode || undefined}
              onKeyDown={onListKeyDown}
            >
              {rows.map((ticket, i) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  open={ticket.id === openId}
                  checked={checked.includes(ticket.id)}
                  editMode={editMode}
                  tabbable={ticket.id === tabbableId}
                  last={i === rows.length - 1}
                  onActivate={activate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics live one click away (brief 1); the line becomes the quality sheet's trigger in step 8. */}
      <footer className="flex h-10 shrink-0 items-center gap-2 border-t border-border pr-1 pl-4 text-micro text-muted-foreground tabular-nums">
        <p className="min-w-0 flex-1 truncate">
          Today {formatPercent(TODAY.autoResolutionRate)} auto · {formatDuration(TODAY.firstResponseMedianSeconds)} first
          response · {formatPercent(TODAY.reopenRate)} reopened
        </p>
        <PrototypeControls />
      </footer>
    </section>
  );
}

/** Telegram grammar: the title bar becomes the selection bar in edit mode. */
function ListHeader() {
  const { state, dispatch } = useDesk();
  const sureIds = rowsFor(state.listState, "drafts", state.dismissed)
    .filter((t) => isSureLowRiskDraft(t.triage))
    .map((t) => t.id);
  const sureCount = sureIds.length;
  // Hidden once exactly the Sure set is selected: pressing it again would change nothing.
  const sureAlreadySelected =
    state.checked.length === sureCount && sureIds.every((id) => state.checked.includes(id));

  if (state.editMode) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-4">
        <p className="min-w-0 flex-1 truncate text-title tabular-nums" aria-live="polite">
          {state.checked.length} selected
        </p>
        {sureCount > 0 && !sureAlreadySelected && (
          <PillButton onClick={() => dispatch({ type: "selectSureDrafts" })}>
            Select {sureCount} Sure drafts
          </PillButton>
        )}
        <PillButton iconOnly aria-label="Exit selection" title="Exit selection (Esc)" onClick={() => dispatch({ type: "exitSelection" })}>
          <X aria-hidden strokeWidth={1.75} />
        </PillButton>
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-4">
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="text-title">Care Desk</h1>
        <span className="text-micro text-muted-foreground">concept</span>
      </div>
      {state.lane === "drafts" && state.listState !== "loading" && (
        <PillButton title="Select drafts (X)" onClick={() => dispatch({ type: "enterSelection" })}>
          Select drafts
        </PillButton>
      )}
      <ThemeIconToggle />
    </header>
  );
}
