import { TriangleAlert } from "lucide-react";
import type { TimelineDraft } from "@/lib/timeline";
import type { Source } from "@/lib/types";
import { Translation } from "./Bubble";

type DraftBubbleProps = {
  draft: TimelineDraft;
  variantCount: number;
  sources: Source[];
  showTranslation: boolean;
};

/**
 * An unsent reply the AI wrote. Sending a draft by accident is the costliest error in this tool, so
 * the draft differs from a sent reply on three channels that survive a 25% thumbnail: a dashed violet
 * edge (a sent reply has none), a near-white fill (a sent reply is tinted), and the words "not sent".
 */
export function DraftBubble({ draft, variantCount, sources, showTranslation }: DraftBubbleProps) {
  const label = variantCount > 1 && draft.variant ? `Draft · ${draft.variant} · not sent · written by AI` : "Draft · not sent · written by AI";
  const gloss = showTranslation ? draft.glossEn : undefined;

  return (
    <li data-draft={draft.id} className="flex flex-col items-end gap-1 pl-12">
      <p className="text-micro text-brand">{label}</p>
      <div className="draft-fill max-w-bubble rounded-bubble rounded-br-tail border border-dashed border-brand-edge px-3.5 py-2">
        <p lang={draft.language} className="text-body break-words whitespace-pre-wrap">
          {draft.body}
        </p>
        {gloss && <Translation text={gloss} label="English gloss, not sent" />}
      </div>
      <SourcesChip sources={sources} />
    </li>
  );
}

/** What the draft rests on. An outdated source is flagged here, next to the text it shaped. */
function SourcesChip({ sources }: { sources: Source[] }) {
  const stale = sources.filter((s) => s.supersededBy);
  const names = sources.map((s) => `${s.title} ${s.version}`).join(", ");

  return (
    <p className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-micro text-muted-foreground">
      {stale.length > 0 && <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-risk-high" strokeWidth={1.75} />}
      <span className="truncate">{sources.length > 0 ? `Sources: ${names}` : "No help article or policy used"}</span>
      {stale.length > 0 && <span className="shrink-0 text-risk-high">· outdated</span>}
    </p>
  );
}
