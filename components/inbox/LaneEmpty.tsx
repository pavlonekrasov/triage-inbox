"use client";

import { Button } from "@/components/controls/Button";
import { useDesk } from "@/components/desk/desk-store";
import { TODAY } from "@/data/metrics";
import type { Lane } from "@/lib/types";

const COPY: Record<Lane, { title: string; body: string }> = {
  needs_you: {
    title: "Nothing needs you right now.",
    body: `${TODAY.autoResolvedCount} conversations were auto-resolved today; ${TODAY.spotCheckSampleCount} are sampled for spot-check.`,
  },
  drafts: {
    title: "No drafts are waiting.",
    body: "A draft appears here when a reply needs your approval before it sends.",
  },
  auto_resolved: {
    title: "Nothing was auto-resolved yet today.",
    body: "Replies the AI sends on its own appear here, with a sample marked for spot-check.",
  },
};

/** An empty lane explains what the system did instead of only saying "empty" (brief 12). */
export function LaneEmpty({ lane }: { lane: Lane }) {
  const { dispatch } = useDesk();
  const { title, body } = COPY[lane];
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <h2 className="text-heading">{title}</h2>
      <p className="max-w-72 text-body-s text-muted-foreground">{body}</p>
      {lane === "needs_you" && (
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => dispatch({ type: "selectLane", lane: "auto_resolved" })}
        >
          Review spot-checks
        </Button>
      )}
    </div>
  );
}
