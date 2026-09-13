"use client";

import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { Glass } from "@/components/glass/Glass";
import { LANES } from "@/lib/lanes";
import type { Lane } from "@/lib/types";

/*
 * Sliding tabs, carried over from the portfolio (brief 3.1). One ink thumb marks the selected lane
 * and springs to the next lane on select, never on hover. Inside the thumb sits a copy of every label
 * in primary-foreground, placed over the originals and clipped by the thumb, so the slice under the
 * thumb relabels itself as it travels.
 *
 * Named exception to transform-only motion: the thumb's width. The thumb is an absolutely
 * positioned leaf, so resizing it never reflows the tabs or the list.
 */

// Damping ratio 42 / (2·√520) ≈ 0.92: settles in about 200 ms with under 0.1% overshoot.
const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 1 } as const;

type Geometry = { x: number; width: number };

/** Positions the label copies over their tabs and returns the selected tab's geometry. */
function layout(track: HTMLElement, lane: Lane): Geometry | null {
  let selected: Geometry | null = null;
  for (const tab of track.querySelectorAll<HTMLElement>("[data-lane-tab]")) {
    const copy = track.querySelector<HTMLElement>(`[data-lane-copy="${tab.dataset.laneTab}"]`);
    if (copy) {
      copy.style.left = `${tab.offsetLeft}px`;
      copy.style.width = `${tab.offsetWidth}px`;
    }
    if (tab.dataset.laneTab === lane) selected = { x: tab.offsetLeft, width: tab.offsetWidth };
  }
  return selected;
}

function paint(thumb: HTMLElement, copies: HTMLElement, { x, width }: Geometry) {
  thumb.style.transform = `translateX(${x}px)`;
  thumb.style.width = `${width}px`;
  copies.style.transform = `translateX(${-x}px)`;
}

type LaneSwitcherProps = {
  lane: Lane;
  /** null while the queue is loading. Auto-resolved never shows a count: it holds nothing to act on. */
  counts: Record<Lane, number | null>;
  onSelect: (lane: Lane) => void;
};

export function LaneSwitcher({ lane, counts, onSelect }: LaneSwitcherProps) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const copiesRef = useRef<HTMLSpanElement>(null);
  const live = useRef<Geometry>({ x: 0, width: 0 });
  const laneRef = useRef(lane);
  const shownLane = useRef(lane);
  const springs = useRef<AnimationPlaybackControls[]>([]);

  useLayoutEffect(() => {
    laneRef.current = lane;
  });

  // Place the thumb before first paint, and re-place it without animation on resize or font swap.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const copies = copiesRef.current;
    if (!track || !thumb || !copies) return;
    const snap = () => {
      const geometry = layout(track, laneRef.current);
      if (!geometry) return;
      for (const spring of springs.current) spring.stop();
      live.current = geometry;
      paint(thumb, copies, geometry);
    };
    snap();
    track.removeAttribute("data-ssr");
    const observer = new ResizeObserver(snap);
    observer.observe(track);
    document.fonts?.ready.then(snap).catch(() => {});
    return () => observer.disconnect();
  }, []);

  // Spring to a newly selected lane. The only thing that moves the thumb.
  useEffect(() => {
    if (shownLane.current === lane) return;
    shownLane.current = lane;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const copies = copiesRef.current;
    if (!track || !thumb || !copies) return;
    const target = layout(track, lane);
    if (!target) return;
    for (const spring of springs.current) spring.stop();
    if (reduced) {
      live.current = target;
      paint(thumb, copies, target);
      return;
    }
    springs.current = [
      animate(live.current.x, target.x, {
        ...SPRING,
        onUpdate: (x) => {
          live.current.x = x;
          paint(thumb, copies, live.current);
        },
      }),
      animate(live.current.width, target.width, {
        ...SPRING,
        onUpdate: (width) => {
          live.current.width = width;
          paint(thumb, copies, live.current);
        },
      }),
    ];
  }, [lane, reduced]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = LANES.findIndex((l) => l.id === lane);
    const n = LANES.length;
    const next =
      event.key === "ArrowRight" ? (index + 1) % n
      : event.key === "ArrowLeft" ? (index - 1 + n) % n
      : event.key === "Home" ? 0
      : event.key === "End" ? n - 1
      : -1;
    if (next < 0) return;
    event.preventDefault();
    const id = LANES[next].id;
    onSelect(id);
    trackRef.current?.querySelector<HTMLElement>(`[data-lane-tab="${id}"]`)?.focus();
  };

  return (
    // Strong tint: the track carries labels, and rows scroll under it (brief 3.2, "any glass that carries text").
    <Glass surface="lane-track" tint="strong" className="p-1">
      <div
        ref={trackRef}
        role="tablist"
        aria-label="Lanes"
        data-ssr=""
        onKeyDown={onKeyDown}
        className="group/track relative flex w-full items-center"
      >
        <span
          ref={thumbRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 h-8 w-0 overflow-hidden rounded-full bg-primary shadow-(--shadow-thumb)"
        >
          <span ref={copiesRef} className="absolute inset-y-0 left-0">
            {LANES.map((l) => (
              <span
                key={l.id}
                data-lane-copy={l.id}
                className="absolute inset-y-0 flex items-center justify-center gap-1.5 text-label whitespace-nowrap text-primary-foreground"
              >
                <TabLabel lane={l} count={counts[l.id]} onThumb />
              </span>
            ))}
          </span>
        </span>

        {LANES.map((l) => {
          const selected = l.id === lane;
          const count = l.id === "auto_resolved" ? null : counts[l.id];
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              id={`lane-tab-${l.id}`}
              data-lane-tab={l.id}
              aria-selected={selected}
              aria-controls="lane-panel"
              aria-label={count === null ? l.label : `${l.label}, ${count}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(l.id)}
              className={
                "relative flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 text-label whitespace-nowrap outline-none " +
                "transition-colors duration-(--dur-hover) hover:bg-accent " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring " +
                // Before hydration places the thumb, the selected tab paints itself as the thumb would.
                "group-data-ssr/track:aria-selected:bg-primary group-data-ssr/track:aria-selected:text-primary-foreground"
              }
            >
              <TabLabel lane={l} count={counts[l.id]} selected={selected} />
            </button>
          );
        })}
      </div>
    </Glass>
  );
}

function TabLabel({
  lane,
  count,
  onThumb = false,
  selected = false,
}: {
  lane: (typeof LANES)[number];
  count: number | null;
  onThumb?: boolean;
  selected?: boolean;
}) {
  const shown = lane.id === "auto_resolved" ? null : count;
  return (
    <>
      <span className="@max-[22rem]:hidden">{lane.label}</span>
      <span className="hidden @max-[22rem]:inline">{lane.shortLabel}</span>
      {shown !== null && (
        <span
          className={
            onThumb ? "tabular-nums"
            : selected ? "text-muted-foreground tabular-nums group-data-ssr/track:text-primary-foreground"
            : "text-muted-foreground tabular-nums"
          }
        >
          {shown}
        </span>
      )}
    </>
  );
}
