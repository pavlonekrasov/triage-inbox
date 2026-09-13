import { Check } from "lucide-react";
import { Glass } from "@/components/glass/Glass";
import { RouteGlyph } from "@/components/inbox/RouteGlyph";
import { avatarStyle, initials } from "@/lib/avatar";

/**
 * The four surfaces allowed to be glass (6.5), over the thread wallpaper. These are static specimens
 * of the material, not the working controls, so they render as non-interactive spans.
 */
export function GlassSpecimen() {
  return (
    <div className="wallpaper flex flex-col items-center gap-5 rounded-card border border-border px-4 py-6">
      <Glass surface="thread-header" className="flex max-w-full items-center gap-2.5 py-1.5 pr-4 pl-1.5">
        <span
          className="avatar-tint inline-flex size-7 shrink-0 items-center justify-center rounded-full text-micro"
          style={avatarStyle("cus_jordan_kim")}
        >
          {initials("Jordan Kim")}
        </span>
        <span className="text-title">Jordan Kim</span>
        <span className="rounded-full bg-muted px-1.5 text-micro text-muted-foreground">EN</span>
        <span className="text-micro text-muted-foreground tabular-nums">18:42 local</span>
        <RouteGlyph route="you" />
      </Glass>

      <Glass surface="lane-track" tint="light" className="flex items-center gap-0.5 p-1">
        <span className="rounded-full bg-primary px-3 py-1.5 text-label text-primary-foreground">
          Needs you <span className="tabular-nums">7</span>
        </span>
        <span className="rounded-full px-3 py-1.5 text-label">
          Drafts <span className="text-muted-foreground tabular-nums">12</span>
        </span>
        <span className="rounded-full px-3 py-1.5 text-label">Auto-resolved</span>
      </Glass>

      <Glass surface="decision-bar" className="flex w-full max-w-140 items-center gap-1 p-1.5">
        <span className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-label text-primary-foreground">
          <Check aria-hidden className="size-4.5" strokeWidth={1.75} />
          Approve &amp; send
        </span>
        <span className="inline-flex h-10 items-center rounded-full px-4 text-label">Edit draft</span>
        <span className="inline-flex h-10 items-center rounded-full px-4 text-label">Escalate case</span>
      </Glass>

      <Glass surface="bulk-bar" className="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
        <span className="text-label tabular-nums">6 selected</span>
        <span className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-label text-primary-foreground">
          Approve 6 drafts
        </span>
      </Glass>
    </div>
  );
}
