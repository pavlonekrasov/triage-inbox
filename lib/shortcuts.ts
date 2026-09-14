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
  | "toggle-context"
  | "command-palette"
  | "shortcuts";

export type ShortcutGroup = "Move" | "Decide" | "Select" | "Desk";

export interface Binding {
  /** KeyboardEvent.key, lower-cased. */
  key: string;
  /** true needs Shift, false refuses it, "any" ignores it: ? needs Shift on most layouts, not all. */
  shift: boolean | "any";
  /** Ctrl on Windows and Linux, ⌘ on a Mac. */
  mod?: boolean;
  command: Command;
  group: ShortcutGroup;
  label: string;
  /** Key caps as the shortcut sheet and the palette show them. "Mod" is drawn as ⌘ or Ctrl. */
  caps: string[];
}

/** The desk's one keymap (brief 9.2). The shortcut sheet is drawn from this table. */
export const KEYMAP: readonly Binding[] = [
  { key: "j", shift: false, command: "next", group: "Move", label: "Next conversation", caps: ["J"] },
  { key: "k", shift: false, command: "previous", group: "Move", label: "Previous conversation", caps: ["K"] },
  { key: "1", shift: false, command: "lane-needs-you", group: "Move", label: "Needs you", caps: ["1"] },
  { key: "2", shift: false, command: "lane-drafts", group: "Move", label: "Drafts", caps: ["2"] },
  { key: "3", shift: false, command: "lane-auto-resolved", group: "Move", label: "Auto-resolved", caps: ["3"] },
  { key: "]", shift: false, command: "toggle-context", group: "Move", label: "Show or hide customer details", caps: ["]"] },
  { key: "a", shift: false, command: "approve", group: "Decide", label: "Approve & send the open draft", caps: ["A"] },
  { key: "e", shift: false, command: "edit", group: "Decide", label: "Edit the open draft", caps: ["E"] },
  { key: "h", shift: false, command: "escalate", group: "Decide", label: "Escalate the case to a team", caps: ["H"] },
  { key: "z", shift: false, command: "undo", group: "Decide", label: "Undo the last send", caps: ["Z"] },
  { key: "x", shift: false, command: "toggle-select", group: "Select", label: "Select or unselect the focused draft", caps: ["X"] },
  { key: "x", shift: true, command: "select-sure-drafts", group: "Select", label: "Select every low-risk Sure draft", caps: ["⇧", "X"] },
  { key: "escape", shift: false, command: "exit-selection", group: "Select", label: "Close the preview, then exit selection", caps: ["Esc"] },
  { key: "k", shift: false, mod: true, command: "command-palette", group: "Desk", label: "Command palette", caps: ["Mod", "K"] },
  { key: "?", shift: "any", command: "shortcuts", group: "Desk", label: "Keyboard shortcuts", caps: ["?"] },
];

/** Keys that work inside one control rather than across the desk. The shortcut sheet lists them too. */
export const LOCAL_KEYS: readonly { group: "In the list" | "In selection" | "In the composer"; label: string; caps: string[] }[] = [
  { group: "In the list", label: "Move within the list", caps: ["↑", "↓"] },
  { group: "In the list", label: "First or last conversation", caps: ["Home", "End"] },
  { group: "In selection", label: "Review the selected drafts, then send them", caps: ["A"] },
  { group: "In the composer", label: "Send the reply", caps: ["Mod", "Enter"] },
  { group: "In the composer", label: "Discard and close", caps: ["Esc"] },
];

export interface KeyPress {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/** The binding a key press matches, before asking where focus is. Alt is never part of a shortcut. */
export function bindingFor(press: KeyPress): Binding | null {
  if (press.altKey) return null;
  const key = press.key.toLowerCase();
  const mod = press.ctrlKey || press.metaKey;
  return (
    KEYMAP.find((b) => b.key === key && Boolean(b.mod) === mod && (b.shift === "any" || b.shift === press.shiftKey)) ??
    null
  );
}

/** Inputs that take no typed text: a letter pressed on them is still a shortcut. */
const NON_TEXT_INPUT = new Set(["radio", "checkbox", "button", "submit", "reset", "range", "color", "file", "image"]);

export function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.closest("textarea, select") !== null) return true;
  return target instanceof HTMLInputElement && !NON_TEXT_INPUT.has(target.type);
}

export function commandFor(event: KeyboardEvent): Command | null {
  if (event.defaultPrevented || event.isComposing) return null;
  const binding = bindingFor(event);
  if (!binding) return null;
  // Ctrl K or ⌘K opens and closes the palette from anywhere, text fields and dialogs included.
  if (binding.mod) return binding.command;
  if (isEditable(event.target)) return null;
  // An open menu or dialog owns the keyboard: J there is typeahead, not "next conversation". A dialog
  // may let the key that opened it through, so that key closes it: ] for customer details, ? for the
  // shortcut sheet.
  if (event.target instanceof Element && event.target.closest("[role=menu], [role=dialog]")) {
    const passes = event.target.closest("[data-pass-shortcut]")?.getAttribute("data-pass-shortcut");
    return passes === binding.command ? binding.command : null;
  }
  return binding.command;
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
