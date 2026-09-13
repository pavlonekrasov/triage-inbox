"use client";

import { useSyncExternalStore } from "react";
import { DEMO_NOW } from "./clock";

/*
 * The demo clock starts at DEMO_NOW when the first countdown mounts and advances in real time, so
 * SLA countdowns tick during a live click-through while fixtures stay deterministic. One interval
 * serves every subscriber and stops when none are left: nothing loops while nothing is shown.
 */

const listeners = new Set<() => void>();
let startedAt: number | null = null;
let snapshot = DEMO_NOW;
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  if (startedAt === null) startedAt = Date.now();
  // Whole seconds, so subscribers re-render once per second rather than on every interval.
  const next = DEMO_NOW + Math.floor((Date.now() - startedAt) / 1000) * 1000;
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    tick();
    timer = setInterval(tick, 250);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The demo clock's current value for an event handler, without re-rendering the caller every second. */
export function readDemoNow() {
  tick();
  return snapshot;
}

/** Server and hydration render DEMO_NOW; the browser then advances it. */
export function useDemoNow() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => DEMO_NOW,
  );
}
