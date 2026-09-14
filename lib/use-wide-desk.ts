"use client";

import { useSyncExternalStore } from "react";

/** Three panes from 1280 px (brief 7.1); below it the context panel opens as a sheet (7.2). */
const WIDE = "(min-width: 1280px)";
/** Below 768 px the desk is a phone: the list is the root and a conversation pushes over it (7.2). */
const PHONE = "(max-width: 767px)";

const subscribeTo = (query: string) => (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const subscribeWide = subscribeTo(WIDE);
const subscribePhone = subscribeTo(PHONE);

/** The server renders the desktop layout; a narrower browser re-renders after hydration. */
export const useWideDesk = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );

export const usePhoneDesk = () =>
  useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
