"use client";

import { useEffect, useEffectEvent } from "react";

export type Command =
  | "next"
  | "previous"
  | "lane-needs-you"
  | "lane-drafts"
  | "lane-auto-resolved"
  | "toggle-select"
  | "select-sure-drafts"
  | "exit-selection";

/** The desk's one keymap. Delivery step 7 adds A, E, H, ], ⌘K and ? to this table. */
export const KEYMAP: readonly { key: string; shift?: boolean; command: Command; label: string }[] = [
  { key: "j", command: "next", label: "Next conversation" },
  { key: "k", command: "previous", label: "Previous conversation" },
  { key: "1", command: "lane-needs-you", label: "Needs you" },
  { key: "2", command: "lane-drafts", label: "Drafts" },
  { key: "3", command: "lane-auto-resolved", label: "Auto-resolved" },
  { key: "x", command: "toggle-select", label: "Select or unselect the focused draft" },
  { key: "x", shift: true, command: "select-sure-drafts", label: "Select every low-risk Sure draft" },
  { key: "escape", command: "exit-selection", label: "Exit selection" },
];

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select") !== null)
  );
}

export function commandFor(event: KeyboardEvent): Command | null {
  if (event.defaultPrevented || event.isComposing) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isEditable(event.target)) return null;
  const key = event.key.toLowerCase();
  return KEYMAP.find((b) => b.key === key && Boolean(b.shift) === event.shiftKey)?.command ?? null;
}

/**
 * The single keydown listener. The handler returns false when a command does not apply right now
 * (Escape with nothing to exit), so the key keeps its default behaviour.
 */
export function useShortcuts(onCommand: (command: Command) => boolean | void) {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    const command = commandFor(event);
    if (command && onCommand(command) !== false) event.preventDefault();
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handle(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
