"use client";

import { Clock3, RotateCw, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/controls/Button";
import { formatClockTime } from "@/lib/clock";
import type { TimelineDraft, TimelineReply } from "@/lib/timeline";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Translation } from "./Bubble";

type ReplyBubbleProps = { showTranslation: boolean } & (
  | {
      kind: "draft";
      draft: TimelineDraft;
      variantCount: number;
      sources: Source[];
      showSources: boolean;
      /** Opens the source's row in the context panel. */
      onShowSources: (sourceId: string) => void;
    }
  | {
      kind: "reply";
      reply: TimelineReply;
      gloss?: string;
      undoUntil?: number;
      /** Offline, a reply in its undo window is already labelled as queued. */
      offline: boolean;
      onUndo: () => void;
      onRetry: () => void;
    }
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
        <ReplyStatus
          reply={props.reply}
          undoUntil={props.undoUntil}
          offline={props.offline}
          onUndo={props.onUndo}
          onRetry={props.onRetry}
        />
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
      {!sent && props.showSources && <SourcesChip sources={props.sources} onShow={props.onShowSources} />}
    </li>
  );
}

function ReplyStatus({
  reply,
  undoUntil,
  offline,
  onUndo,
  onRetry,
}: {
  reply: TimelineReply;
  undoUntil?: number;
  offline: boolean;
  onUndo: () => void;
  onRetry: () => void;
}) {
  if (reply.status === "failed") {
    return (
      <p className="flex items-center gap-1 text-micro text-risk-high">
        <TriangleAlert aria-hidden className="size-3.5" strokeWidth={1.75} />
        Not sent ·
        <Button variant="text" onClick={onRetry}>
          Retry
        </Button>
      </p>
    );
  }

  // Offline (brief 12), a reply waits in a queue and never claims to be sent: a clock replaces the ticks.
  const queued = reply.status === "queued" || (offline && reply.status === "undoable");
  const spoken =
    reply.status === "sent" ? ", delivered"
    : reply.status === "sending" ? ", sending"
    : queued ? ", sends when you reconnect"
    : ", sends when the undo window closes";

  return (
    <p className="flex items-center gap-1 text-micro text-muted-foreground tabular-nums">
      {queued ? "Queued" : "Sent by you"} · <time dateTime={reply.at}>{formatClockTime(reply.at)}</time>
      {queued ? (
        <Clock3 aria-hidden className="size-3.5" strokeWidth={1.75} />
      ) : (
        <Ticks delivered={reply.status === "sent"} />
      )}
      <span className="sr-only">{spoken}</span>
      {reply.edited && (
        <>
          <span aria-hidden className="ml-0.5 size-1.5 rounded-full bg-muted-foreground" />
          Edited
        </>
      )}
      {reply.status === "undoable" && undoUntil !== undefined && (
        <>
          <span aria-hidden>·</span>
          <Button variant="undo" undoUntil={undoUntil} onClick={onUndo} />
        </>
      )}
    </p>
  );
}

/**
 * Drafting (brief 12): the AI is still writing, so the reply slot holds a typing indicator in the draft
 * treatment. The dots pulse only while the bubble is on screen (Weightless parking, brief 3.3); under
 * reduced motion the words "Drafting reply" stand in for them.
 */
export function DraftingBubble() {
  const bubble = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = bubble.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li data-drafting className="flex flex-col items-end gap-1 pl-12">
      <p className="text-micro text-brand">Drafting · not sent · written by AI</p>
      <div
        ref={bubble}
        role="status"
        className="draft-fill rounded-bubble rounded-br-tail border border-dashed border-brand-edge px-3.5 py-2"
      >
        <span className="sr-only">The AI is drafting a reply</span>
        <span aria-hidden className="flex h-5.5 items-center gap-1 motion-reduce:hidden">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-typing-dot rounded-full bg-brand"
              style={{ animationDelay: `${i * 160}ms`, animationPlayState: onScreen ? "running" : "paused" }}
            />
          ))}
        </span>
        <span aria-hidden className="hidden text-body text-brand motion-reduce:inline">
          Drafting reply
        </span>
      </div>
    </li>
  );
}

/**
 * Draft failed (brief 12): nothing machine-written is waiting, so the slot drops the violet treatment and
 * says the case is ready for a person. The case falls to Needs you; Retry asks the AI once more.
 */
export function DraftFailedBubble({ onRetry }: { onRetry: () => void }) {
  return (
    <li data-draft-failed className="flex flex-col items-end gap-1 pl-12">
      <p className="text-micro text-muted-foreground">No draft · needs you</p>
      <div className="max-w-bubble rounded-bubble rounded-br-tail border border-dashed border-border bg-card px-3.5 py-2">
        <p className="text-body">Couldn&rsquo;t draft a reply. The case is ready for you to write one.</p>
        <Button variant="text" onClick={onRetry} className="mt-1 gap-1 text-body-s [&_svg]:size-3.5">
          <RotateCw aria-hidden strokeWidth={1.75} />
          Retry drafting
        </Button>
      </div>
    </li>
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

/**
 * What the draft rests on. An outdated source is flagged here, next to the text it shaped. With sources,
 * the chip links to them in the context panel, the outdated one first.
 */
function SourcesChip({ sources, onShow }: { sources: Source[]; onShow: (sourceId: string) => void }) {
  const stale = sources.filter((s) => s.supersededBy);
  const names = sources.map((s) => `${s.title} ${s.version}`).join(", ");
  const chip =
    "inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-micro text-muted-foreground";

  if (sources.length === 0) return <p className={chip}>No help article or policy used</p>;

  return (
    <Button
      variant="outline"
      title="Show in Sources used"
      onClick={() => onShow((stale[0] ?? sources[0]).id)}
      className={`${chip} h-auto font-normal [&_svg]:size-3.5`}
    >
      {stale.length > 0 && <TriangleAlert aria-hidden className="shrink-0 text-risk-high" strokeWidth={1.75} />}
      <span className="truncate">Sources: {names}</span>
      {stale.length > 0 && <span className="shrink-0 text-risk-high">· outdated</span>}
    </Button>
  );
}
