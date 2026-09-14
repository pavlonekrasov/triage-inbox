import type { Metadata } from "next";
import { LiveDesk, SlideShell } from "@/components/slides/SlideShell";
import { TICKETS_BY_ID } from "@/data/tickets";

export const metadata: Metadata = { title: "Three cases" };

const cases = [
  { id: "t01", caption: "Clear intent, a confirmed App Store subscription and a current source. Low risk + Sure: sent automatically." },
  { id: "t02", caption: "A refund changes money, and the records disagree. A person chooses Refund or Decline before anything is sent." },
  { id: "t03", caption: "A safety report always needs a person. Open a Trust & Safety review; preserve the locked transcript. No AI verdict." },
];

export default function CasesPage() {
  return <SlideShell number="04" title="Three cases. The right amount of human judgment."
    description="The same inbox, from a simple cancellation question to a protected conduct review.">
    <div className="grid grid-cols-3 gap-8">
      {cases.map(({ id, caption }) => <figure key={id} className="min-w-0">
        <div className="h-[650px] overflow-hidden rounded-card border border-border">
          <LiveDesk ticket={id} label={`Mobile conversation with ${TICKETS_BY_ID.get(id)!.customer.name}`} />
        </div>
        <figcaption className="mt-3 text-body-s text-muted-foreground">{caption}</figcaption>
      </figure>)}
    </div>
  </SlideShell>;
}
