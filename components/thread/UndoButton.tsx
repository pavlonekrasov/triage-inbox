"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { UNDO_WINDOW_MS } from "@/lib/send";
import { cn } from "@/lib/utils";

/**
 * Undo for an optimistic send (brief 9.3), with the window drawn as a hairline under the word that
 * empties over 5 s. Under reduced motion the hairline is replaced by the seconds left, in text.
 */
export function UndoButton({ undoUntil, onUndo, className }: { undoUntil: number; onUndo: () => void; className?: string }) {
  const reduced = useReducedMotion();
  const hairline = useRef<HTMLSpanElement>(null);
  const [secondsLeft, setSecondsLeft] = useState(UNDO_WINDOW_MS / 1000);

  // A button that mounts partway through the window starts its hairline where the window is.
  useLayoutEffect(() => {
    const elapsed = UNDO_WINDOW_MS - (undoUntil - Date.now());
    if (hairline.current) hairline.current.style.animationDelay = `${-Math.max(0, elapsed)}ms`;
  }, [undoUntil]);

  useEffect(() => {
    if (!reduced) return;
    const timer = setInterval(() => setSecondsLeft(Math.max(0, Math.ceil((undoUntil - Date.now()) / 1000))), 250);
    return () => clearInterval(timer);
  }, [reduced, undoUntil]);

  return (
    <button
      type="button"
      onClick={onUndo}
      aria-keyshortcuts="Z"
      className={cn(
        "relative inline-flex items-center rounded-xs font-medium text-foreground outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
        className,
      )}
    >
      Undo
      {reduced ? (
        <span className="text-muted-foreground tabular-nums">&nbsp;· {secondsLeft}s</span>
      ) : (
        <span
          ref={hairline}
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left animate-undo-countdown bg-current motion-reduce:hidden"
        />
      )}
    </button>
  );
}
