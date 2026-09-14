import type { Metadata } from "next";
import { ArrowDown, ArrowLeft, ArrowRight, CheckCheck, ClipboardCheck, FileSearch, MessageSquare, ShieldCheck, Undo2 } from "lucide-react";
import { RouteGlyph } from "@/components/inbox/RouteGlyph";
import { SlideShell } from "@/components/slides/SlideShell";
import { TICKETS_BY_ID } from "@/data/tickets";
import { formatDuration, formatPercent, TODAY } from "@/data/metrics";
import { UNDO_WINDOW_MS } from "@/lib/send";
import { routeFor } from "@/lib/route";
import { HARD_RULE_LABEL } from "@/lib/summary";

export const metadata: Metadata = { title: "Triage flow" };
const ticket = TICKETS_BY_ID.get("t02")!;
const route = routeFor(ticket.triage);
const iconProps = { "aria-hidden": true as const, size: 18, strokeWidth: 1.75 };

export default function FlowPage() {
  return <SlideShell number="02" title="From incoming message to an accountable reply."
    description="Follow Jordan Kim’s case. The agent gathers the facts; a hard rule keeps the decision with a person.">
    <main aria-label="Ticket routing flow" className="flex flex-1 flex-col gap-5">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1.2fr] items-stretch gap-5">
        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-title"><MessageSquare {...iconProps} />1. Message in</h2>
          <p className="mt-5 text-label">{ticket.customer.name}</p>
          <blockquote className="mt-2 rounded-bubble rounded-bl-tail bg-muted p-4 text-body">{ticket.messages.at(-1)!.body}</blockquote>
          <p className="mt-4 text-body-s text-muted-foreground">A billing dispute, not a cancellation how-to.</p>
        </section>
        <ArrowRight {...iconProps} className="self-center text-muted-foreground" />
        <section className="rounded-card border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-title"><FileSearch {...iconProps} />2. Prepare the case</h2>
          <ul className="mt-5 space-y-4 text-body-s">
            {ticket.triage.steps.filter(s => ["classified", "checked_account", "retrieved"].includes(s.kind)).map(s => <li key={s.kind}>{s.text}</li>)}
            <li>Assess risk: {ticket.triage.risk}. Confidence: {ticket.triage.confidence}.</li>
          </ul>
          <p className="mt-4 text-body-s text-muted-foreground">Evidence stays attached to the summary and draft.</p>
        </section>
        <ArrowRight {...iconProps} className="self-center text-muted-foreground" />
        <section data-flow-route={route} className="rounded-card border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-title"><ShieldCheck {...iconProps} />3. Apply the routing rules</h2>
          <p className="mt-4 text-body-s">Hard rules first, regardless of confidence.</p>
          <ul className="mt-3 space-y-2 text-body-s">
            <li className="flex gap-2"><RouteGlyph route="auto" />Low risk + Sure, no hard rule</li>
            <li className="flex gap-2"><RouteGlyph route="draft" />Medium risk, or any doubt</li>
            <li className="flex gap-2"><RouteGlyph route="you" />High risk, or any hard rule</li>
          </ul>
          <div className="mt-4 rounded-input bg-risk-high-wash p-3 text-body-s text-risk-high">
            <strong>Jordan → Needs you</strong>
            <p className="mt-1">{ticket.triage.hardRules.map(rule => HARD_RULE_LABEL[rule]).join(" · ")}</p>
          </div>
          <p className="mt-3 text-micro text-muted-foreground">If auto-send is paused, Auto waits as a draft.</p>
        </section>
      </div>
      <div className="flex justify-end pr-40"><ArrowDown {...iconProps} className="text-muted-foreground" /></div>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1.2fr] gap-5">
        <section className="order-5 rounded-card border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-title"><ClipboardCheck {...iconProps} />4. A person decides</h2>
          <p className="mt-4 text-body">Inspect the conflicting records. Choose {ticket.triage.drafts.map(d => d.variant).join(" or ")}.</p>
          <p className="mt-3 text-body-s text-muted-foreground">Edit the reply or escalate to Billing. Choosing an outcome alone never sends it.</p>
        </section>
        <ArrowLeft {...iconProps} className="order-4 self-center text-muted-foreground" />
        <section className="order-3 rounded-card border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-title"><Undo2 {...iconProps} />5. Undo, then sent</h2>
          <p className="mt-4 text-body">Send the chosen reply. Keep a {UNDO_WINDOW_MS / 1000}-second Undo window.</p>
          <p className="mt-3 flex items-center gap-2 text-body-s"><CheckCheck {...iconProps} />Sent by you, with an audit trail.</p>
          <p className="mt-3 text-body-s text-muted-foreground">Offline replies queue. Failed sends stay available to retry.</p>
        </section>
        <ArrowLeft {...iconProps} className="order-2 self-center text-muted-foreground" />
        <section className="order-1 rounded-card border border-border bg-card p-5">
          <h2 className="text-title">6. Measure quality together</h2>
          <dl className="mt-4 divide-y divide-border text-body-s">
            <div className="flex justify-between py-2"><dt>Auto-resolution</dt><dd className="tabular-nums">{formatPercent(TODAY.autoResolutionRate)}</dd></div>
            <div className="flex justify-between py-2"><dt>Reopened after auto</dt><dd className="tabular-nums">{formatPercent(TODAY.reopenRate)}</dd></div>
            <div className="flex justify-between py-2"><dt>Median first response</dt><dd className="tabular-nums">{formatDuration(TODAY.firstResponseMedianSeconds)}</dd></div>
          </dl>
          <p className="mt-3 text-micro text-muted-foreground">Spot-checks and Mark as wrong feed the quality review. The pair keeps automation accountable.</p>
        </section>
      </div>
    </main>
  </SlideShell>;
}
