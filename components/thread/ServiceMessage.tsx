import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * WhatsApp's service message: a centred, quiet pill in the timeline. Here it records what the AI did
 * (brief 5), and it separates days. The fill is opaque so its text measures the same over every
 * part of the wallpaper.
 */
export function ServicePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "max-w-md rounded-card bg-secondary px-2.5 py-0.5 text-center text-micro text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Consecutive AI steps share one quiet block, like WhatsApp's stacked system notices: one shape
 * instead of five keeps the log from outweighing the customer's own message (brief 1, "calm").
 */
export function ServiceGroup({ label, lines }: { label: string; lines: string[] }) {
  return (
    <li className="flex justify-center" aria-label={label}>
      <div className="flex max-w-md flex-col gap-0.5 rounded-card bg-secondary px-3 py-1.5 text-center text-micro text-muted-foreground">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </li>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <li className="flex justify-center py-1">
      <ServicePill className="text-foreground">{label}</ServicePill>
    </li>
  );
}
