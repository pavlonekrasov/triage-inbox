/*
 * The desk's two dialogs, the command palette and the shortcut sheet, are opaque like every popover
 * (brief 6.5): the popover colour with a 1 px border and no shadow, because only glass casts one (6.4).
 * Both are rare, so they may move like the Escalate popover (10): from scale 0.96 and transparent over
 * 160 ms, out over 120 ms. Under reduced motion only the opacity changes.
 */
export const BACKDROP =
  "fixed inset-0 z-50 bg-scrim transition-opacity duration-160 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-120";

export const POPUP =
  "z-50 rounded-card border border-border bg-popover text-popover-foreground outline-none " +
  "transition-[scale,opacity] duration-160 ease-out data-starting-style:scale-96 data-starting-style:opacity-0 " +
  "data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:duration-120 data-ending-style:ease-in " +
  "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100";
