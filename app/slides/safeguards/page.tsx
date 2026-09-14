import type { Metadata } from "next";
import { LiveDesk, SlideShell } from "@/components/slides/SlideShell";

export const metadata: Metadata = { title: "Safeguards" };

export default function SafeguardsPage() {
  return <SlideShell number="05" title="Evidence before action. A protected handoff when it matters."
    description="Conflicting records stop automation. Conduct reports go to Trust & Safety with the evidence preserved.">
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8">
      <figure className="min-w-0">
        <div className="h-[650px] overflow-hidden rounded-card border border-border">
          <LiveDesk ticket="t04" threadOnly label="Marcus Webb: conflicting sources and routing evidence" />
        </div>
        <figcaption className="mt-3 text-body-s text-muted-foreground">Marcus Webb · inspect both timestamps and the hard rules before deciding.</figcaption>
      </figure>
      <figure className="min-w-0">
        <div className="h-[650px] overflow-hidden rounded-card border border-border">
          <LiveDesk ticket="t03" threadOnly label="Camille Laurent: protected escalation to Trust and Safety" />
        </div>
        <figcaption className="mt-3 text-body-s text-muted-foreground">Camille Laurent · the team, reasons and handoff note remain under human control.</figcaption>
      </figure>
    </div>
  </SlideShell>;
}
