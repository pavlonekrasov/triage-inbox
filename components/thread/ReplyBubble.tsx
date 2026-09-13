"use client";

import { TriangleAlert } from "lucide-react";
import { formatClockTime } from "@/lib/clock";
import type { TimelineDraft, TimelineReply } from "@/lib/timeline";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Translation } from "./Bubble";
import { UndoButton } from "./UndoButton";

type ReplyBubbleProps = { showTranslation: boolean } & (
  | { kind: "draft"; draft: TimelineDraft; variantCount: number; sources: Source[]; showSources: boolean }
  | { kind: "reply"; reply: TimelineReply; gloss?: string; undoUntil?: number; onUndo: () => void; onRetry: () => void }
);

/**
 * The reply slot at the end of a thread: the AI's draft until someone sends it, then the sent reply,
 * in the same element. Sending a draft by accident is the costliest error in this tool, so a draft
 * differs from a sent reply on three channels that survive a 25% thumbnail: a dashed violet edge, a
 * near-white fill, and the words "not sent". On send the element stays and its state changes: the
 * edge fades and the draft fill crossfades to the sent fill over 180 ms (brief 10).
 */
export function ReplyBubble(props: ReplyBubbleProps) {
  const sent = props.kind === "reply";
  const body = sent ? props.reply.body : props.draft.body;
  const language = sent ? props.reply.language : props.draft.language;
  const gloss = !props.showTranslation ? undefined : sent ? props.gloss : props.draft.glossEn;

  return (
    <li
      data-draft={sent ? undefined : props.draft.id}
      data-reply={sent ? props.reply.status : undefined}
      className="flex flex-col items-end gap-1 pl-12"
    >
      {sent ? (
        <ReplyStatus reply={props.reply} undoUntil={props.undoUntil} onUndo={props.onUndo} onRetry={props.onRetry} />
      ) : (
        <p className="text-micro text-brand">
          {props.variantCount > 1 && props.draft.variant
            ? `Draft · ${props.draft.variant} · not sent · written by AI`
            : "Draft · not sent · written by AI"}
        </p>
      )}
      <div
        data-state={sent ? "sent" : "draft"}
        className={cn(
          "relative max-w-bubble rounded-bubble rounded-br-tail border bg-bubble-out px-3.5 py-2",
          "transition-[border-color] duration-180 ease-out",
          sent ? "border-transparent" : "border-dashed border-brand-edge",
        )}
      >
        {/* The draft fill lies over the sent fill and fades out on send, so the change is a crossfade. */}
        <span
          aria-hidden
          className={cn(
            "draft-fill pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-180 ease-out",
            sent && "opacity-0",
          )}
        />
        <p lang={language} className="relative text-body break-words whitespace-pre-wrap">
          {body}
        </p>
        {gloss && (
          <div className="relative">
            <Translation text={gloss} label={sent ? "English translation" : "English gloss, not sent"} />
          </div>
        )}
      </div>
      {!sent && props.showSources && <SourcesChip sources={props.sources} />}
    </li>
  );
}

function ReplyStatus({
  reply,
  undoUntil,
  onUndo,
  onRetry,
}: {
  reply: TimelineReply;
  undoUntil?: number;
  onUndo: () => void;
  onRetry: () => void;
}) {
  if (reply.status === "failed") {
    return (
      <p className="flex items-center gap-1 text-micro text-risk-high">
        <TriangleAlert aria-hidden className="size-3.5" strokeWidth={1.75} />
        Not sent ·
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xs font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
        >
          Retry
        </button>
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1 text-micro text-muted-foreground tabular-nums">
      Sent by you · <time dateTime={reply.at}>{formatClockTime(reply.at)}</time>
      <Ticks delivered={reply.status === "sent"} />
      <span className="sr-only">
        {reply.status === "sent" ? ", delivered" : reply.status === "sending" ? ", sending" : ", sends when the undo window closes"}
      </span>
      {reply.edited && (
        <>
          <span aria-hidden className="ml-0.5 size-1.5 rounded-full bg-muted-foreground" />
          Edited
        </>
      )}
      {reply.status === "undoable" && undoUntil !== undefined && (
        <>
          <span aria-hidden>·</span>
          <UndoButton undoUntil={undoUntil} onUndo={onUndo} />
        </>
      )}
    </p>
  );
}

/**
 * One tick while the reply is leaving, two once it is delivered (the WhatsApp grammar). Each tick
 * draws as it appears; under reduced motion it simply appears.
 */
function Ticks({ delivered }: { delivered: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path pathLength={1} d="M18 6 7 17l-5-5" className="[stroke-dasharray:1] motion-safe:animate-tick-draw" />
      {delivered && (
        <path pathLength={1} d="m22 10-7.5 7.5L13 16" className="[stroke-dasharray:1] motion-safe:animate-tick-draw" />
      )}
    </svg>
  );
}

/** What the draft rests on. An outdated source is flagged here, next to the text it shaped. */
function SourcesChip({ sources }: { sources: Source[] }) {
  const stale = sources.filter((s) => s.supersededBy);
  const names = sources.map((s) => `${s.title} ${s.version}`).join(", ");

  return (
    <p className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-micro text-muted-foreground">
      {stale.length > 0 && <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-risk-high" strokeWidth={1.75} />}
      <span className="truncate">{sources.length > 0 ? `Sources: ${names}` : "No help article or policy used"}</span>
      {stale.length > 0 && <span className="shrink-0 text-risk-high">· outdated</span>}
    </p>
  );
}
