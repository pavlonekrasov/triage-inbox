import { CheckCheck } from "lucide-react";

const LAYERS = [
  { className: "bg-sidebar", name: "List pane", token: "--sidebar" },
  { className: "bg-background", name: "Canvas", token: "--background" },
  { className: "bg-card", name: "Card", token: "--card" },
] as const;

function Bubbles() {
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-bubble self-start rounded-bubble rounded-bl-tail border border-border bg-card px-3.5 py-2">
        I cancelled yesterday but was still charged $39.99. I want my money back.
      </p>
      <div className="flex flex-col items-end gap-1 self-end">
        <span className="text-micro text-brand">Draft · not sent · written by AI</span>
        <p className="max-w-bubble rounded-bubble rounded-br-tail border border-dashed border-brand-edge bg-brand-wash px-3.5 py-2">
          Hi Jordan, I can see the charge on 13 Sep, the day after you cancelled.
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 self-end">
        <p className="max-w-bubble rounded-bubble rounded-br-tail bg-bubble-out px-3.5 py-2">
          Hi Jordan, I can see the charge on 13 Sep, the day after you cancelled.
        </p>
        <span className="inline-flex items-center gap-1 text-micro text-muted-foreground">
          Sent by you · <span className="tabular-nums">18:44</span>
          <CheckCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

export function SurfaceSpecimen() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 overflow-hidden rounded-card border border-border">
        {LAYERS.map((layer) => (
          <div key={layer.token} className={`${layer.className} flex flex-col gap-0.5 p-3`}>
            <span className="text-label">{layer.name}</span>
            <span className="font-mono text-micro text-muted-foreground">{layer.token}</span>
          </div>
        ))}
      </div>

      <div className="wallpaper rounded-card border border-border p-4">
        <Bubbles />
      </div>

      <div className="flex items-start gap-4">
        <div className="wallpaper shrink-0 overflow-hidden rounded-md border border-border p-4" style={{ zoom: 0.25 }}>
          <Bubbles />
        </div>
        <p className="text-body-s text-muted-foreground">
          The same thread at 25% scale. The dashed violet edge and label keep the draft distinct from the
          sent reply at thumbnail size (review gate 7).
        </p>
      </div>
    </div>
  );
}
