"use client";

import { Clock } from "lucide-react";
import { formatCountdown, formatListTime, SLA_WARNING_MS } from "@/lib/clock";
import { isResolved, lastActivityAt } from "@/lib/lanes";
import type { Ticket } from "@/lib/types";
import { useDemoNow } from "@/lib/use-demo-now";

/** The row's timestamp. Answered tickets show when the reply went out; open ones watch their deadline. */
export function ListTime({ ticket }: { ticket: Ticket }) {
  const at = lastActivityAt(ticket);
  if (isResolved(ticket)) return <time dateTime={at}>{formatListTime(at)}</time>;
  return <DeadlineTime ticket={ticket} at={at} />;
}

/**
 * Under 5 minutes to the first-response deadline the timestamp becomes a countdown: terracotta, a
 * clock glyph and the word "left", so the warning never depends on colour. Only this span colours;
 * the row never does (brief 7.3).
 */
function DeadlineTime({ ticket, at }: { ticket: Ticket; at: string }) {
  const now = useDemoNow();
  const remaining = Date.parse(ticket.slaDueAt) - now;

  if (remaining >= SLA_WARNING_MS) return <time dateTime={at}>{formatListTime(at, now)}</time>;

  return (
    <span className="inline-flex items-center gap-1 text-risk-high">
      <Clock aria-hidden className="size-3.5" strokeWidth={1.75} />
      {remaining > 0 ? (
        <span>
          {formatCountdown(remaining)} left<span className="sr-only"> to first response</span>
        </span>
      ) : (
        <span>
          Overdue<span className="sr-only">: first response deadline passed</span>
        </span>
      )}
    </span>
  );
}
