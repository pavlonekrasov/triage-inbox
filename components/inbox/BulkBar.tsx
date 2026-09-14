"use client";

import { ChevronDown, ListChecks, Send, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/controls/Button";
import { KeyHint } from "@/components/controls/KeyHint";
import { hiddenIds, rowsFor, useDesk } from "@/components/desk/desk-store";
import { Glass } from "@/components/glass/Glass";
import { readDemoNow } from "@/lib/use-demo-now";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Glass surface 4 of 4 (brief 6.5), floating at the bottom of the list pane in selection mode. Bulk
 * approval never means approving unread text (9.2), so it takes two steps: "Review 6 drafts" opens a
 * preview above the bar with the first two lines of every reply, where any one can be taken out, and
 * only then does the bar offer "Approve & send 6 replies". A does each step; Esc closes the preview,
 * then selection.
 */
export function BulkBar() {
  const { state, dispatch } = useDesk();
  const previewId = useId();
  if (!state.editMode || state.lane !== "drafts") return null;

  const selected = rowsFor(state.listState, "drafts", hiddenIds(state)).filter((t) => state.checked.includes(t.id));
  const count = selected.length;
  const open = state.bulkPreview && count > 0;

  return (
    <div data-bulk className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex flex-col gap-2 px-3 pb-3">
      {/* grid-template-rows 0fr → 1fr over 220 ms: the pinned summary's named exception (brief 10). */}
      <div
        id={previewId}
        data-open={open}
        inert={!open}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-(--dur-ui) ease-(--ease-soft) data-[open=true]:grid-rows-[1fr] motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          <section
            aria-label="Replies to send"
            data-bulk-preview
            className="pointer-events-auto rounded-card border border-border bg-card"
          >
            <p className="px-3 pt-2.5 pb-1 text-label">Read before sending · {plural(count, "reply", "replies")}</p>
            <ul className="max-h-[min(20rem,45dvh)] overflow-y-auto overscroll-contain pb-1.5">
              {selected.map((ticket) => {
                const draft = ticket.triage.drafts[0];
                return (
                  <li key={ticket.id} data-preview-item={ticket.id} className="flex items-start gap-1 py-1.5 pr-1.5 pl-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label">{ticket.customer.name}</p>
                      {draft && (
                        <p lang={draft.language} className="line-clamp-2 text-body-s text-muted-foreground">
                          {draft.body}
                        </p>
                      )}
                    </div>
                    <Button
                      iconOnly
                      aria-label={`Take ${ticket.customer.name} out of this send`}
                      title="Take out of this send"
                      onClick={() => dispatch({ type: "toggleCheck", id: ticket.id })}
                    >
                      <X aria-hidden strokeWidth={1.75} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      <Glass surface="bulk-bar" role="group" aria-label="Bulk approval" className="pointer-events-auto flex items-center gap-1 p-1.5">
        {open ? (
          <>
            <Button
              variant="primary"
              size="md"
              data-bulk-send
              aria-keyshortcuts="A"
              className="min-w-0 flex-1 px-3.5 [&_svg]:size-4.5"
              onClick={() => dispatch({ type: "bulkApprove", now: readDemoNow(), wall: Date.now() })}
            >
              <Send aria-hidden strokeWidth={1.75} />
              Approve & send {plural(count, "reply", "replies")}
              <KeyHint scope="page" onPrimary>
                A
              </KeyHint>
            </Button>
            <Button
              size="md"
              iconOnly
              aria-label="Close the preview"
              aria-keyshortcuts="Escape"
              title="Close the preview (Esc)"
              onClick={() => dispatch({ type: "setBulkPreview", open: false })}
              className="[&_svg]:size-4.5"
            >
              <ChevronDown aria-hidden strokeWidth={1.75} />
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="md"
            data-bulk-review
            aria-expanded={false}
            aria-controls={previewId}
            aria-disabled={count === 0 || undefined}
            aria-keyshortcuts="A"
            className="min-w-0 flex-1 px-3.5 [&_svg]:size-4.5"
            onClick={() => dispatch({ type: "setBulkPreview", open: true })}
          >
            <ListChecks aria-hidden strokeWidth={1.75} />
            {count === 0 ? "Select drafts to review" : `Review ${plural(count, "draft", "drafts")}`}
            <KeyHint scope="page" onPrimary>
              A
            </KeyHint>
          </Button>
        )}
      </Glass>
    </div>
  );
}
