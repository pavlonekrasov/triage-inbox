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
  | "exit-selection"
  | "approve"
  | "edit"
  | "escalate"
  | "undo"
  | "toggle-context";

/** The desk's one keymap. Delivery step 7 adds ⌘K and ? to this table. */
export const KEYMAP: readonly { key: string; shift?: boolean; command: Command; label: string }[] = [
  { key: "]", command: "toggle-context", label: "Show or hide customer details" },
  { key: "a", command: "approve", label: "Approve & send the open draft" },
  { key: "e", command: "edit", label: "Edit the open draft" },
  { key: "h", command: "escalate", label: "Escalate the case to a team" },
  { key: "z", command: "undo", label: "Undo the last send" },
  { key: "j", command: "next", label: "Next conversation" },
  { key: "k", command: "previous", label: "Previous conversation" },
  { key: "1", command: "lane-needs-you", label: "Needs you" },
  { key: "2", command: "lane-drafts", label: "Drafts" },
  { key: "3", command: "lane-auto-resolved", label: "Auto-resolved" },
  { key: "x", command: "toggle-select", label: "Select or unselect the focused draft" },
  { key: "x", shift: true, command: "select-sure-drafts", label: "Select every low-risk Sure draft" },
  { key: "escape", command: "exit-selection", label: "Exit selection" },
];

/** Inputs that take no typed text: a letter pressed on them is still a shortcut. */
const NON_TEXT_INPUT = new Set(["radio", "checkbox", "button", "submit", "reset", "range", "color", "file", "image"]);

export function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.closest("textarea, select") !== null) return true;
  return target instanceof HTMLInputElement && !NON_TEXT_INPUT.has(target.type);
}

export function commandFor(event: KeyboardEvent): Command | null {
  if (event.defaultPrevented || event.isComposing) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isEditable(event.target)) return null;
  const key = event.key.toLowerCase();
  const command = KEYMAP.find((b) => b.key === key && Boolean(b.shift) === event.shiftKey)?.command ?? null;
  // An open menu or dialog owns the keyboard: J there is typeahead, not "next conversation". The one
  // exception is ] inside the customer details sheet, which closes it the way it opened it.
  if (event.target instanceof Element && event.target.closest("[role=menu], [role=dialog]")) {
    return command === "toggle-context" && event.target.closest("[data-context-sheet]") ? command : null;
  }
  return command;
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
