"use client";

import { FileCheck, HandHeart, Pencil, Reply, Send, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { KeyHint } from "@/components/controls/KeyHint";
import { PillButton } from "@/components/controls/PillButton";
import { useDesk, type Composer } from "@/components/desk/desk-store";
import { Glass } from "@/components/glass/Glass";
import { WELLBEING_TEMPLATE } from "@/data/templates";
import { isEnglish, languageName } from "@/lib/language";
import { composerSendBlock, rewrite, type RewriteKind } from "@/lib/rewrite";
import { SEND_LATENCY_MS } from "@/lib/send";
import type { Ticket, TriageResult } from "@/lib/types";
import { readDemoNow } from "@/lib/use-demo-now";
import { cn } from "@/lib/utils";

const CHIPS: { kind: RewriteKind; label: string }[] = [
  { kind: "warmer", label: "Warmer" },
  { kind: "shorter", label: "Shorter" },
  { kind: "translate", label: "Translate" },
];

type Strip = { icon: LucideIcon; ai: boolean; title: string; detail: string };

function stripFor(composer: Composer, ticket: Ticket, draft: TriageResult["drafts"][number] | null): Strip {
  const firstName = ticket.customer.name.split(" ")[0];
  switch (composer.mode) {
    case "edit":
      return draft && composer.original === draft.body
        ? {
            icon: Pencil,
            ai: true,
            title: draft.variant && ticket.triage.drafts.length > 1 ? `Editing AI draft · ${draft.variant}` : "Editing AI draft",
            detail: draft.body,
          }
        : { icon: Pencil, ai: false, title: "Editing your unsent reply", detail: composer.original };
    case "take-over":
      return {
        icon: HandHeart,
        ai: false,
        title: "You took over from the AI",
        detail: `Nothing is sent until you send it. Reviewed template: ${WELLBEING_TEMPLATE.title}`,
      };
    case "follow-up":
      return { icon: Reply, ai: false, title: `Follow-up to ${firstName}`, detail: "The earlier reply stays as it was sent." };
    case "write":
      return { icon: Pencil, ai: false, title: `Reply to ${firstName}`, detail: "Written by you. Nothing is sent until you send it." };
  }
}

/**
 * Telegram's edit mode (brief 4.1, 9.1): the decision bar grows into a composer with a strip naming
 * what is being edited, the text, and the AI chips Warmer · Shorter · Translate. It is the same glass
 * surface as the bar, so the count of four holds. Esc discards; Ctrl or ⌘ with Enter sends.
 */
export function EditComposer({ ticket, composer }: { ticket: Ticket; composer: Composer }) {
  const { state, dispatch } = useDesk();
  const field = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState<{ kind: RewriteKind; text: string; language: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Focus the text with the caret at the end, as Telegram does when an edit opens.
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  // The stand-in model answers after the same 600 ms a send takes.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      setPending(null);
      dispatch({ type: "composerRewrite", text: pending.text, language: pending.language });
    }, SEND_LATENCY_MS);
    return () => clearTimeout(timer);
  }, [pending, dispatch]);

  const firstName = ticket.customer.name.split(" ")[0];
  const draft = ticket.triage.drafts.find((d) => d.id === composer.draftId) ?? null;
  const customerLanguage = ticket.triage.language;
  const edited = composer.text.trim() !== composer.original.trim();
  const sendBlock = composerSendBlock(composer.text, composer.language, customerLanguage);
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const sendLabel =
    composer.mode === "follow-up" ? "Send follow-up" : composer.mode === "edit" && edited ? "Send edited reply" : "Send reply";
  const strip = stripFor(composer, ticket, draft);
  const StripIcon = strip.icon;
  const translateTarget = isEnglish(composer.language) ? languageName(customerLanguage) : "English";
  const gloss = state.showTranslation && draft?.glossEn && composer.text === draft.body ? draft.glossEn : null;
  const status = pending
    ? { text: pending.kind === "translate" ? `Translating into ${translateTarget}` : `Rewriting the reply ${pending.kind}`, ai: true }
    : hint
      ? { text: hint, ai: false }
      : composer.rewritten
        ? { text: "Rewritten by AI · read it before sending", ai: true }
        : null;

  const applyRewrite = (kind: RewriteKind) => {
    if (pending) return;
    const result = rewrite(kind, { text: composer.text, language: composer.language, draft });
    if ("blocked" in result) return setHint(result.blocked);
    setHint(null);
    setPending({ kind, ...result });
  };

  const send = () => {
    if (sendBlock) return setHint(sendBlock);
    dispatch({ type: "sendComposer", now: readDemoNow(), wall: Date.now() });
  };

  const insertTemplate = () => {
    if (composer.text.trim()) return setHint("The template fills an empty reply only. Clear the text to use it.");
    setHint(null);
    dispatch({ type: "composerInput", text: WELLBEING_TEMPLATE.body(firstName) });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dispatch({ type: "closeComposer" });
    } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send();
    }
  };

  return (
    <Glass
      surface="decision-bar"
      shape="card"
      role="group"
      aria-label={strip.title}
      data-composer={composer.mode}
      className="pointer-events-auto flex w-full max-w-140 animate-rise-in flex-col gap-2 p-2"
    >
      <div className="flex items-start gap-2.5 pt-1 pl-2">
        <StripIcon aria-hidden className={cn("mt-px size-4.5 shrink-0", strip.ai && "text-brand")} strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-label", strip.ai && "text-brand")}>{strip.title}</p>
          <p className="truncate text-micro text-muted-foreground">{strip.detail}</p>
        </div>
        <PillButton
          iconOnly
          aria-label={composer.mode === "edit" ? "Discard edits and close" : "Close the composer"}
          title="Close (Esc)"
          onClick={() => dispatch({ type: "closeComposer" })}
        >
          <X aria-hidden strokeWidth={1.75} />
        </PillButton>
      </div>

      <textarea
        ref={field}
        value={composer.text}
        lang={composer.language}
        readOnly={pending !== null}
        aria-busy={pending !== null || undefined}
        aria-label={`Reply to ${ticket.customer.name}`}
        placeholder={composer.mode === "take-over" ? `Write to ${firstName} in your own words` : `Write to ${firstName}`}
        onChange={(event) => {
          setHint(null);
          dispatch({ type: "composerInput", text: event.target.value });
        }}
        onKeyDown={onKeyDown}
        className="field-sizing-content max-h-[40dvh] min-h-24 w-full resize-none rounded-input border border-border bg-card px-3 py-2 text-body outline-none placeholder:text-muted-foreground read-only:text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-solid focus-visible:outline-ring"
      />

      {gloss && (
        <p lang="en" className="line-clamp-3 rounded-input bg-muted px-3 py-2 text-body-s text-muted-foreground">
          <span className="font-medium text-foreground">English gloss, not sent: </span>
          {gloss}
        </p>
      )}

      <p role="status" aria-live="polite" className={status ? cn("px-2 text-micro", status.ai && "text-brand") : "sr-only"}>
        {status?.text}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 pl-1">
        {composer.mode === "edit" &&
          draft &&
          CHIPS.filter((chip) => chip.kind !== "translate" || !isEnglish(customerLanguage)).map((chip) => (
            <PillButton
              key={chip.kind}
              variant="outline"
              data-chip={chip.kind}
              aria-busy={pending?.kind === chip.kind || undefined}
              aria-disabled={pending !== null && pending.kind !== chip.kind ? true : undefined}
              aria-label={chip.kind === "translate" ? `Translate the reply into ${translateTarget}` : `Make the reply ${chip.kind}`}
              onClick={() => applyRewrite(chip.kind)}
            >
              {chip.label}
            </PillButton>
          ))}
        {composer.mode === "take-over" && (
          <PillButton variant="outline" title={WELLBEING_TEMPLATE.reviewed} onClick={insertTemplate}>
            <FileCheck aria-hidden strokeWidth={1.75} />
            Insert reviewed template
          </PillButton>
        )}
        <PillButton
          variant="primary"
          size="md"
          className="ml-auto [&_svg]:size-4.5"
          aria-disabled={sendBlock || pending ? true : undefined}
          aria-keyshortcuts={mac ? "Meta+Enter" : "Control+Enter"}
          onClick={send}
        >
          <Send aria-hidden strokeWidth={1.75} />
          {sendLabel}
          <KeyHint onPrimary>{mac ? "⌘↵" : "Ctrl ↵"}</KeyHint>
        </PillButton>
      </div>
    </Glass>
  );
}
