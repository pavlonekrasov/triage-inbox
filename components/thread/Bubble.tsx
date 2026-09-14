"use client";

import { CheckCheck } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/controls/Button";
import { formatClockTime } from "@/lib/clock";
import { languageName } from "@/lib/language";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Shorter than this, a message cannot reach 12 lines even at phone width, so it is never measured. */
const CLAMP_MIN_CHARS = 400;

type BubbleProps = {
  message: Message;
  customerName: string;
  /** The ticket's language, for the lang attribute and the "Translated from" label. */
  language: string;
  showTranslation: boolean;
};

/**
 * Customer bubbles sit left on the card surface with a hairline; the tail corner is bottom left.
 * Long content (brief 12): a message past 12 lines collapses with "Show full message". Overflow is
 * measured at the width the bubble renders at, so the cut is 12 lines on a phone and on a monitor.
 * Screen readers get the whole message either way; the clamp is visual.
 */
export function CustomerBubble({ message, customerName, language, showTranslation }: BubbleProps) {
  const time = formatClockTime(message.at);
  const translation = showTranslation ? message.translationEn : undefined;
  const text = useRef<HTMLParagraphElement>(null);
  const long = message.body.length >= CLAMP_MIN_CHARS;
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = text.current;
    if (!el || !long || expanded) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [long, expanded]);

  const collapsible = long && (overflows || expanded);

  return (
    <li data-long={collapsible || undefined} className="flex flex-col items-start pr-12">
      <div className="relative max-w-bubble rounded-bubble rounded-bl-tail border border-border bg-card px-3.5 py-2">
        <p className="sr-only">
          {customerName} at {time}:
        </p>
        <p
          ref={text}
          lang={language}
          className={cn("text-body break-words whitespace-pre-wrap", long && !expanded && "line-clamp-12")}
        >
          {message.body}
          {/* Reserves room for the timestamp on the last line, the way Telegram tucks it in. */}
          {!translation && !collapsible && <TimeSpacer />}
        </p>
        {collapsible && (
          <p className="mt-1 pr-12">
            <Button variant="text" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)} className="text-body-s">
              {expanded ? "Collapse message" : "Show full message"}
            </Button>
          </p>
        )}
        {translation && (
          <Translation text={translation} label={`Translated from ${languageName(language)}`} withSpacer />
        )}
        <time
          aria-hidden
          dateTime={message.at}
          className="absolute right-3 bottom-1.5 text-micro text-muted-foreground tabular-nums"
        >
          {time}
        </time>
      </div>
    </li>
  );
}

/**
 * A reply that went out. Its status label sits above the bubble, in the same slot the draft label
 * uses, so approving a draft (step 5) changes one line in place instead of moving it.
 */
export function SentBubble({ message, language, showTranslation }: Omit<BubbleProps, "customerName">) {
  const time = formatClockTime(message.at);
  const translation = showTranslation ? message.translationEn : undefined;

  return (
    <li className="flex flex-col items-end gap-1 pl-12">
      <p className="flex items-center gap-1 text-micro text-muted-foreground tabular-nums">
        {message.author === "auto" ? "Sent automatically" : "Sent by you"} · <time dateTime={message.at}>{time}</time>
        <CheckCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
        <span className="sr-only">, delivered</span>
      </p>
      <div className="max-w-bubble rounded-bubble rounded-br-tail bg-bubble-out px-3.5 py-2">
        <p lang={language} className="text-body break-words whitespace-pre-wrap">
          {message.body}
        </p>
        {translation && <Translation text={translation} label={`Translated from ${languageName(language)}`} />}
      </div>
    </li>
  );
}

export function Translation({ text, label, withSpacer = false }: { text: string; label: string; withSpacer?: boolean }) {
  return (
    <div className="mt-2 border-t border-border pt-2">
      <p className="text-micro text-muted-foreground">{label}</p>
      <p lang="en" className="text-body break-words whitespace-pre-wrap">
        {text}
        {withSpacer && <TimeSpacer />}
      </p>
    </div>
  );
}

const TimeSpacer = () => <span aria-hidden className="inline-block w-12" />;
