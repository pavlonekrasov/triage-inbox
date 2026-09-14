"use client";

import { useEffect, useReducer, useRef } from "react";
import { ContextSheet } from "@/components/context/ContextPanel";
import { ContextRail } from "@/components/context/ContextRail";
import { CommandPalette } from "@/components/overlays/CommandPalette";
import { QualitySheet } from "@/components/overlays/QualitySheet";
import { ShortcutSheet } from "@/components/overlays/ShortcutSheet";
import { ListPane } from "@/components/inbox/ListPane";
import { ThreadPane } from "@/components/thread/ThreadPane";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { COLLEAGUE } from "@/data/team";
import { TICKETS_BY_ID } from "@/data/tickets";
import type { DeskInit } from "@/lib/desk-params";
import { sendReply } from "@/lib/send";
import { useShortcuts } from "@/lib/shortcuts";
import { readDemoNow } from "@/lib/use-demo-now";
import { usePhoneDesk, useWideDesk } from "@/lib/use-wide-desk";
import { createDeskState, DeskContext, deskReducer, isContextOpen, latestUndoable } from "./desk-store";

export function Desk({ initial, presentation = "desk" }: { initial: DeskInit; presentation?: "desk" | "thread" | "case" }) {
  const [state, dispatch] = useReducer(deskReducer, initial, createDeskState);
  const wideViewport = useWideDesk();
  const wide = presentation === "desk" && wideViewport;
  const phone = usePhoneDesk();
  const contextOpen = isContextOpen(state, wide);
  const openTicket = state.openId ? TICKETS_BY_ID.get(state.openId) : undefined;
  const pushed = state.threadPushed && openTicket !== undefined;
  const setContextOpen = (open: boolean) => dispatch({ type: "setContextOpen", open });

  // Mirror the view into the URL, so a reload or a copied link reopens the same lane, conversation and state.
  // A retried draft is on its way, so only a draft state set from the prototype controls is kept.
  const openDraft = state.openId ? state.draftStatus[state.openId] : undefined;
  const pinnedDraft = openDraft && openDraft.settlesAt === undefined ? openDraft.status : null;
  const viewing = state.openId !== null && state.openId in state.viewers;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("lane", state.lane);
    if (state.openId) params.set("ticket", state.openId);
    else params.delete("ticket");
    if (state.listState === "live") params.delete("list");
    else params.set("list", state.listState);
    if (pinnedDraft) params.set("draft", pinnedDraft);
    else params.delete("draft");
    if (viewing) params.set("viewer", COLLEAGUE.handle);
    else params.delete("viewer");
    if (state.online) params.delete("net");
    else params.set("net", "offline");
    const next = `?${params}`;
    if (next !== window.location.search) window.history.replaceState(null, "", next);
  }, [state.lane, state.openId, state.listState, pinnedDraft, viewing, state.online]);

  // A notice stays 4 s, 6 s when it offers an action, or as long as its undo window; a newer notice restarts the timer.
  const { notice, outbox, sendFailure } = state;
  useEffect(() => {
    if (!notice) return;
    const ms = notice.undoUntil ? Math.max(0, notice.undoUntil - Date.now()) : notice.action ? 6000 : 4000;
    const timer = setTimeout(() => dispatch({ type: "clearNotice", id: notice.id }), ms);
    return () => clearTimeout(timer);
  }, [notice]);

  // Approve is optimistic (brief 9.3): each reply commits when its own undo window closes.
  useEffect(() => {
    const timers = Object.values(outbox)
      .filter((o) => o.status === "undoable")
      .map((o) =>
        setTimeout(
          () => dispatch({ type: "commitSend", id: o.ticketId, attempt: o.attempt }),
          Math.max(0, o.undoUntil - Date.now()),
        ),
      );
    return () => timers.forEach(clearTimeout);
  }, [outbox]);

  // A committed reply goes to the send API once per attempt. The reducer ignores results from an
  // attempt that has since been retried.
  const inFlight = useRef(new Set<string>());
  useEffect(() => {
    for (const o of Object.values(outbox)) {
      const key = `${o.ticketId}:${o.attempt}`;
      if (o.status !== "sending" || inFlight.current.has(key)) continue;
      inFlight.current.add(key);
      const settle = (ok: boolean) => {
        inFlight.current.delete(key);
        dispatch({ type: "sendSettled", id: o.ticketId, attempt: o.attempt, ok });
      };
      sendReply(sendFailure).then(
        () => settle(true),
        () => settle(false),
      );
    }
  }, [outbox, sendFailure]);

  // A retried draft arrives after DRAFT_RETRY_MS; a draft state set from the prototype controls stays.
  const { draftStatus } = state;
  useEffect(() => {
    const timers = Object.entries(draftStatus).flatMap(([id, draft]) =>
      draft.settlesAt === undefined
        ? []
        : [setTimeout(() => dispatch({ type: "draftSettled", id }), Math.max(0, draft.settlesAt - Date.now()))],
    );
    return () => timers.forEach(clearTimeout);
  }, [draftStatus]);

  // The browser's own connection events drive the offline state too (brief 12).
  useEffect(() => {
    const update = () => dispatch({ type: "setOnline", online: navigator.onLine });
    if (!navigator.onLine) update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useShortcuts((command) => {
    // J and K move focus with the selection only when focus is already in the list, or nowhere.
    const active = document.activeElement;
    const focus = active === null || active === document.body || active.closest("[data-list-pane]") !== null;
    switch (command) {
      case "next":
        return dispatch({ type: "move", to: 1, focus });
      case "previous":
        return dispatch({ type: "move", to: -1, focus });
      case "lane-needs-you":
        return dispatch({ type: "selectLane", lane: "needs_you" });
      case "lane-drafts":
        return dispatch({ type: "selectLane", lane: "drafts" });
      case "lane-auto-resolved":
        return dispatch({ type: "selectLane", lane: "auto_resolved" });
      case "toggle-select":
        return dispatch({ type: "toggleCheck" });
      case "select-sure-drafts":
        return dispatch({ type: "selectSureDrafts" });
      case "exit-selection":
        // Esc steps back one level: the preview first, then selection.
        if (state.bulkPreview) return dispatch({ type: "setBulkPreview", open: false });
        if (!state.editMode) return false;
        return dispatch({ type: "exitSelection" });
      case "approve":
        // In selection mode A belongs to the bulk bar: the first press opens the preview, the second sends.
        if (state.editMode) {
          return dispatch(
            state.bulkPreview
              ? { type: "bulkApprove", now: readDemoNow(), wall: Date.now() }
              : { type: "setBulkPreview", open: true },
          );
        }
        return dispatch({ type: "approve", now: readDemoNow(), wall: Date.now() });
      case "edit":
        return dispatch({ type: "openComposer" });
      case "escalate":
        return dispatch({ type: "setEscalateOpen", open: true });
      case "undo":
        if (!latestUndoable(outbox)) return false;
        return dispatch({ type: "undoSend" });
      case "toggle-context":
        // Telegram Web's info panel key (brief 7.1).
        if (!openTicket) return false;
        return setContextOpen(!contextOpen);
      case "command-palette":
        return dispatch({ type: "setOverlay", overlay: state.overlay === "palette" ? null : "palette" });
      case "shortcuts":
        return dispatch({ type: "setOverlay", overlay: state.overlay === "shortcuts" ? null : "shortcuts" });
    }
  });

  return (
    <DeskContext value={{ state, dispatch }}>
      <div className="h-dvh overflow-hidden">
        {presentation === "thread" ? <ThreadPane /> : phone ? (
          /* Phone (brief 7.2): Telegram for iOS. The list is the root and stays mounted, so Back returns to
             the same scroll position; opening a conversation pushes the thread over it. */
          <>
            {/* One landmark and one page heading per screen: the list is the main content until a thread pushes over it. */}
            <main hidden={pushed} aria-label="Conversations" className="h-full">
              <ListPane />
            </main>
            {pushed && (
              <div className="h-full motion-safe:animate-push-in">
                <header className="sr-only">
                  <h1>Care Desk</h1>
                </header>
                <ThreadPane compact={presentation === "case"} />
              </div>
            )}
          </>
        ) : (
        <ResizablePanelGroup key={wide ? "wide" : "tablet"} orientation="horizontal">
          {/* Tablet (768 to 1279 px) keeps list and thread only, with minimums of 280 / 440 so both fit from 768 px. */}
          <ResizablePanel
            id="list"
            defaultSize={wide ? 360 : 320}
            minSize={wide ? 320 : 280}
            maxSize={480}
            groupResizeBehavior="preserve-pixel-size"
          >
            <ListPane />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel id="thread" minSize={wide ? 520 : 440}>
            <ThreadPane compact={presentation === "case"} />
          </ResizablePanel>
          {/* Three panes from 1280 px: list 360, thread, context 340, with minimums 320 / 520 / 300 (brief 7.1). */}
          {wide && openTicket && <ContextRail ticket={openTicket} open={contextOpen} onOpenChange={setContextOpen} />}
        </ResizablePanelGroup>
        )}
      </div>
      {!wide && openTicket && <ContextSheet ticket={openTicket} open={contextOpen} onOpenChange={setContextOpen} />}
      <CommandPalette />
      <ShortcutSheet />
      <QualitySheet />
    </DeskContext>
  );
}
