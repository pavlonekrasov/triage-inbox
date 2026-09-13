"use client";

import { useEffect, useReducer, useRef } from "react";
import { ListPane } from "@/components/inbox/ListPane";
import { ThreadPane } from "@/components/thread/ThreadPane";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { DeskInit } from "@/lib/desk-params";
import { sendReply } from "@/lib/send";
import { useShortcuts } from "@/lib/shortcuts";
import { readDemoNow } from "@/lib/use-demo-now";
import { createDeskState, DeskContext, deskReducer, latestUndoable } from "./desk-store";

export function Desk({ initial }: { initial: DeskInit }) {
  const [state, dispatch] = useReducer(deskReducer, initial, createDeskState);

  // Mirror the view into the URL, so a reload or a copied link reopens the same lane and conversation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("lane", state.lane);
    if (state.openId) params.set("ticket", state.openId);
    else params.delete("ticket");
    if (state.listState === "live") params.delete("list");
    else params.set("list", state.listState);
    const next = `?${params}`;
    if (next !== window.location.search) window.history.replaceState(null, "", next);
  }, [state.lane, state.openId, state.listState]);

  // A notice stays 4 s, or 6 s when it offers an action; a newer notice restarts the timer.
  const { notice, outbox, sendFailure } = state;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => dispatch({ type: "clearNotice", id: notice.id }), notice.action ? 6000 : 4000);
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
        if (!state.editMode) return false;
        return dispatch({ type: "exitSelection" });
      case "approve":
        // In selection mode A belongs to the bulk bar, which acts on the checked drafts.
        if (state.editMode) return false;
        return dispatch({ type: "approve", now: readDemoNow(), wall: Date.now() });
      case "edit":
        return dispatch({ type: "openComposer" });
      case "escalate":
        return dispatch({ type: "setEscalateOpen", open: true });
      case "undo":
        if (!latestUndoable(outbox)) return false;
        return dispatch({ type: "undoSend" });
    }
  });

  return (
    <DeskContext value={{ state, dispatch }}>
      <div className="h-dvh overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            id="list"
            defaultSize={360}
            minSize={320}
            maxSize={480}
            groupResizeBehavior="preserve-pixel-size"
          >
            <ListPane />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel id="thread" minSize={520}>
            <ThreadPane />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DeskContext>
  );
}
