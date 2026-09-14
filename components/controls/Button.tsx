"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { UNDO_WINDOW_MS } from "@/lib/send";
import { cn } from "@/lib/utils";

/*
 * The desk's one button. Variants:
 *   primary  filled ink: the decision that will happen
 *   ghost    no fill until hover: chrome and secondary actions (the default)
 *   outline  hairline edge on the card colour: actions that sit on the wallpaper, and toggle chips
 *   text     a word inside a sentence ("Retry", "Undo escalation"), in the colour of that sentence
 *   undo     the text button for an optimistic send, drawing its window as a hairline (brief 9.3)
 *
 * Headless triggers (Popover, Menu, Dialog) render it through their `render` prop, so every
 * pressable control on the desk shares these classes.
 */

export type ButtonVariant = "primary" | "ghost" | "outline" | "text" | "undo";

export type ButtonOptions = {
  variant?: ButtonVariant;
  /** sm = 32px, for dense chrome on a fine pointer; md = 40px, for the decision bar. Pill variants only. */
  size?: "sm" | "md";
  /** Square button holding only an icon. It must carry an aria-label that names the action. */
  iconOnly?: boolean;
};

const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring";

/**
 * Hover is a background wash over 150 ms (fine pointers only, via the hover variant); press scales to
 * --press-scale over 100 ms, which reduced motion pins to 1. aria-disabled keeps a refused action
 * focusable and pressable, so it can say why (brief 9.2).
 */
export function buttonClass({ variant = "ghost", size = "sm", iconOnly = false }: ButtonOptions = {}) {
  if (variant === "text" || variant === "undo") {
    return cn(
      "relative inline-flex shrink-0 items-center rounded-xs font-medium select-none",
      FOCUS,
      "disabled:pointer-events-none aria-disabled:text-muted-foreground",
      variant === "undo" ? "text-foreground" : "hover:underline hover:underline-offset-2",
    );
  }
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-label whitespace-nowrap select-none",
    FOCUS,
    "[transition:background-color_var(--dur-hover)_ease,scale_100ms_var(--ease-out)] active:scale-(--press-scale)",
    "disabled:pointer-events-none disabled:text-muted-foreground",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    size === "sm" && (iconOnly ? "size-8" : "h-8 px-3"),
    size === "md" && (iconOnly ? "size-10" : "h-10 px-4"),
    variant === "primary" &&
      "bg-primary text-primary-foreground hover:bg-primary/90 aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted",
    variant === "ghost" &&
      "text-foreground hover:bg-accent data-popup-open:bg-accent aria-pressed:bg-accent aria-disabled:text-muted-foreground",
    variant === "outline" &&
      "border border-border bg-card text-foreground hover:bg-accent data-popup-open:bg-accent aria-pressed:bg-accent aria-disabled:text-muted-foreground",
  );
}

export type ButtonProps = ComponentProps<"button"> &
  Omit<ButtonOptions, "variant"> &
  (
    | { variant?: Exclude<ButtonVariant, "undo">; undoUntil?: undefined }
    | {
        variant: "undo";
        /** Date.now() deadline of the undo window. */
        undoUntil: number;
      }
  );

export function Button({ variant, size, iconOnly, undoUntil, type = "button", className, children, ...props }: ButtonProps) {
  const undo = variant === "undo" && undoUntil !== undefined;
  return (
    <button
      type={type}
      aria-keyshortcuts={undo ? "Z" : undefined}
      {...props}
      className={cn(buttonClass({ variant, size, iconOnly }), className)}
    >
      {undo ? <UndoCountdown undoUntil={undoUntil}>{children ?? "Undo"}</UndoCountdown> : children}
    </button>
  );
}

const secondsUntil = (deadline: number) =>
  Math.min(UNDO_WINDOW_MS / 1000, Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

/**
 * The window is a hairline under the word that empties over 5 s. Under reduced motion the hairline
 * is replaced by the seconds left, in text.
 */
function UndoCountdown({ undoUntil, children }: { undoUntil: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const hairline = useRef<HTMLSpanElement>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(undoUntil));

  // A button that mounts partway through the window starts its hairline where the window is.
  useLayoutEffect(() => {
    const elapsed = UNDO_WINDOW_MS - (undoUntil - Date.now());
    if (hairline.current) hairline.current.style.animationDelay = `${-Math.max(0, elapsed)}ms`;
  }, [undoUntil]);

  useEffect(() => {
    if (!reduced) return;
    const timer = setInterval(() => setSecondsLeft(secondsUntil(undoUntil)), 250);
    return () => clearInterval(timer);
  }, [reduced, undoUntil]);

  return (
    <>
      {children}
      {reduced ? (
        // Hidden from screen readers: the count changes every second, and inside a live region it would be read each time.
        <span aria-hidden className="text-muted-foreground tabular-nums">
          &nbsp;· {secondsLeft}s
        </span>
      ) : (
        <span
          ref={hairline}
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left animate-undo-countdown bg-current motion-reduce:hidden"
        />
      )}
    </>
  );
}
