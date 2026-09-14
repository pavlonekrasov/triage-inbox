"use client";

import { CirclePause, WifiOff, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useCallback, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/controls/Button";
import { PrototypeControls } from "@/components/dev/PrototypeControls";
import { fallenIds, hiddenIds, laneRows, rowsFor, useDesk } from "@/components/desk/desk-store";
import { ThemeIconToggle } from "@/components/theme/ThemeIconToggle";
import { cn } from "@/lib/utils";
import { formatDuration, formatPercent, TODAY } from "@/data/metrics";
import { LANES } from "@/lib/lanes";
import { isSureLowRiskDraft } from "@/lib/route";
import type { Lane } from "@/lib/types";
import { BulkBar } from "./BulkBar";
import { LaneEmpty } from "./LaneEmpty";
import { LaneSwitcher } from "./LaneSwitcher";
import { SkeletonRows } from "./SkeletonRows";
import { rowId, TicketRow } from "./TicketRow";

/*
 * A row leaving its lane (brief 10): the rows below close the gap over 240 ms, and the row itself
 * fades and scales to 0.98 over 150 ms. Reduced motion keeps the fade only. Selection never moves a
 * row, so J and K stay instant.
 */
const ROW_TRANSITION: Transition = {
  layout: { duration: 0.24, ease: [0.23, 1, 0.32, 1] },
  opacity: { duration: 0.15, ease: "easeIn" },
  scale: { duration: 0.15, ease: "easeIn" },
};

export function ListPane() {
  const { state, dispatch } = useDesk();
  const { lane, listState, editMode, checked, cursorId, openId, focusRequest, outbox, draftStatus } = state;
  const notice = state.notice?.where === "list" ? state.notice : null;
  const reduced = useReducedMotion();
  const hidden = hiddenIds(state);
  const fallen = fallenIds(state);
  const rows = rowsFor(listState, lane, hidden, fallen);

  const counts = Object.fromEntries(
    LANES.map((l) => [l.id, listState === "loading" ? null : rowsFor(listState, l.id, hidden, fallen).length]),
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
    <section data-list-pane aria-label="Conversations" className="@container relative flex h-full min-w-0 flex-col bg-sidebar">
      <ListHeader />
      {/* Offline (brief 12): a thin bar under the header. Decisions still work; replies queue. */}
      <div role="status" aria-live="polite">
        {!state.online && (
          <p
            data-offline
            className="flex h-8 items-center gap-2 border-y border-border bg-muted px-4 text-body-s text-muted-foreground"
          >
            <WifiOff aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Offline · actions will send when you reconnect</span>
          </p>
        )}
      </div>

      <motion.div
        layoutScroll
        // In selection the bulk bar floats over the list, so the last row can scroll clear of it.
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", editMode && lane === "drafts" && "pb-20")}
      >
        {/* The lane track floats and the list scrolls under it: glass surface 3 of 4 (brief 6.5). */}
        <div className="sticky top-0 z-10 px-3 pt-1 pb-2">
          <LaneSwitcher lane={lane} counts={counts} onSelect={(next) => dispatch({ type: "selectLane", lane: next })} />
          <div role="status" aria-live="polite">
            {notice && (
              <div className="mt-2 flex items-center gap-2 rounded-card border border-border bg-card py-1.5 pr-1.5 pl-3">
                <p className="min-w-0 flex-1 py-0.5 text-body-s">{notice.text}</p>
                {notice.action &&
                  (notice.undoUntil ? (
                    <Button
                      variant="undo"
                      undoUntil={notice.undoUntil}
                      className="mr-1.5 text-body-s"
                      onClick={() => dispatch(notice.action!.dispatch)}
                    >
                      {notice.action.label}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => dispatch(notice.action!.dispatch)}>
                      {notice.action.label}
                    </Button>
                  ))}
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
            // Keyed by lane, so switching lanes replaces the list at once instead of animating rows out.
            <div
              key={`${lane}:${listState}`}
              role="listbox"
              aria-label={laneLabel}
              aria-multiselectable={editMode || undefined}
              onKeyDown={onListKeyDown}
              className="relative"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {rows.map((ticket, i) => (
                  <motion.div
                    key={ticket.id}
                    layout={reduced ? false : "position"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                    transition={ROW_TRANSITION}
                  >
                    <TicketRow
                      ticket={ticket}
                      open={ticket.id === openId}
                      checked={checked.includes(ticket.id)}
                      editMode={editMode}
                      tabbable={ticket.id === tabbableId}
                      last={i === rows.length - 1}
                      unsent={outbox[ticket.id]?.status === "failed"}
                      draft={draftStatus[ticket.id]?.status ?? null}
                      onActivate={activate}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      <BulkBar />

      {/* Metrics live one click away (brief 1): the footer line opens the quality sheet (brief 13). */}
      <footer className="box-content flex h-10 shrink-0 items-center gap-2 border-t border-border pr-1 pb-[env(safe-area-inset-bottom)] pl-2 text-micro text-muted-foreground tabular-nums max-md:h-12">
        <Button
          variant="text"
          data-quality-trigger
          aria-haspopup="dialog"
          title="Open the quality view"
          onClick={() => dispatch({ type: "setOverlay", overlay: "quality" })}
          className="h-8 min-w-0 flex-1 justify-start px-2 font-normal"
        >
          <span className="truncate">
            Today {formatPercent(TODAY.autoResolutionRate)} auto · {formatDuration(TODAY.firstResponseMedianSeconds)} first
            response · {formatPercent(TODAY.reopenRate)} reopened
          </span>
        </Button>
        <PrototypeControls />
      </footer>
    </section>
  );
}

/** Telegram grammar: the title bar becomes the selection bar in edit mode. */
function ListHeader() {
  const { state, dispatch } = useDesk();
  const drafts = laneRows(state, "drafts");
  const sureIds = drafts.filter((t) => isSureLowRiskDraft(t.triage)).map((t) => t.id);
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
          <Button onClick={() => dispatch({ type: "selectSureDrafts" })}>
            Select {sureCount} Sure drafts
          </Button>
        )}
        <Button iconOnly aria-label="Exit selection" title="Exit selection (Esc)" onClick={() => dispatch({ type: "exitSelection" })}>
          <X aria-hidden strokeWidth={1.75} />
        </Button>
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-4">
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="text-title">Care Desk</h1>
        <span className="text-micro text-muted-foreground">concept</span>
      </div>
      {state.lane === "drafts" && drafts.length > 0 && (
        <Button title="Select drafts (X)" onClick={() => dispatch({ type: "enterSelection" })}>
          Select drafts
        </Button>
      )}
      <ThemeIconToggle />
    </header>
  );
}
