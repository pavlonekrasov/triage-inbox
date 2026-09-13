"use client";

import { useEffect, useReducer } from "react";
import { ListPane } from "@/components/inbox/ListPane";
import { ThreadPane } from "@/components/thread/ThreadPane";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { DeskInit } from "@/lib/desk-params";
import { useShortcuts } from "@/lib/shortcuts";
import { createDeskState, DeskContext, deskReducer } from "./desk-store";

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

  // A notice stays 4 s, or 6 s when it offers Undo; a newer notice restarts the timer.
  const { notice } = state;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => dispatch({ type: "clearNotice", id: notice.id }), notice.action ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [notice]);

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
