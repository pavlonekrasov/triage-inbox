"use client";

import { useLayoutEffect, useRef } from "react";
import { usePanelRef } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import type { Ticket } from "@/lib/types";
import { ContextPanel } from "./ContextPanel";

/** Keep the rail mounted so closing can finish, rapid toggles reverse, and width is remembered. */
export function ContextRail({ ticket, open, onOpenChange }: {
  ticket: Ticket; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const panel = usePanelRef();
  const element = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const previousOpen = useRef(open);
  const initialSize = useRef(open ? 340 : 0);
  const expandedWidth = useRef(340);

  useLayoutEffect(() => {
    const root = element.current;
    const group = root?.parentElement;
    if (!root || !group || !panel.current) return;
    const changed = previousOpen.current !== open;
    previousOpen.current = open;
    // The parent group registers after child layout effects; defaultSize already handles the mount.
    if (!changed) return;
    if (!open && root.contains(document.activeElement)) {
      document.querySelector<HTMLElement>("[data-context-toggle]")?.focus({ preventScroll: true });
    }
    // Only visibility changes animate. Pointer resizing and the initial layout remain direct.
    group.setAttribute("data-context-transition", "");
    if (open) panel.current.resize(expandedWidth.current);
    else panel.current.collapse();
    const duration = parseFloat(getComputedStyle(root).getPropertyValue("--dur-ui")) || 220;
    const timer = window.setTimeout(() => group.removeAttribute("data-context-transition"), duration + 40);
    return () => window.clearTimeout(timer);
  }, [open, panel]);

  return <>
    <ResizableHandle disabled={!open} aria-hidden={!open || undefined} />
    <ResizablePanel
      id="context"
      data-context-rail
      data-open={open}
      elementRef={element}
      panelRef={panel}
      defaultSize={initialSize.current}
      minSize={300}
      maxSize={420}
      collapsible
      collapsedSize={0}
      groupResizeBehavior="preserve-pixel-size"
      inert={!open}
      aria-hidden={!open || undefined}
      className="overflow-hidden!"
      onResize={(size, _id, previous) => {
        // Keep the full content width while closing, so text never squeezes into the collapsing rail.
        if (size.inPixels >= 300) {
          expandedWidth.current = size.inPixels;
          content.current?.style.setProperty("--context-width", `${size.inPixels}px`);
        }
        if (previous && size.inPixels === 0 && open) onOpenChange(false);
      }}
    >
      <div ref={content} className="context-rail-content h-full w-(--context-width,340px) min-w-75">
        <ContextPanel key={ticket.id} ticket={ticket} onClose={() => {
          document.querySelector<HTMLElement>("[data-context-toggle]")?.focus({ preventScroll: true });
          onOpenChange(false);
        }} />
      </div>
    </ResizablePanel>
  </>;
}
