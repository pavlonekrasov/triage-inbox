"use client";

import { useSyncExternalStore } from "react";

/** Three panes from 1280 px (brief 7.1); below it the context panel opens as a sheet (7.2). */
const QUERY = "(min-width: 1280px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** The server renders the desktop layout; a narrower browser re-renders after hydration. */
export const useWideDesk = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
