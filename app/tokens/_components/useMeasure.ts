"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

/**
 * Runs `measure` against the rendered subtree after the first paint and again once web fonts
 * settle, so the numbers describe what is on screen rather than what the source intends.
 */
export function useMeasure<T>(measure: (root: HTMLDivElement) => T) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<T | null>(null);

  const run = useEffectEvent(() => {
    if (ref.current) setValue(measure(ref.current));
  });

  useEffect(() => {
    let alive = true;
    const frame = requestAnimationFrame(() => alive && run());
    document.fonts?.ready.then(() => alive && run());
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  return [ref, value] as const;
}
