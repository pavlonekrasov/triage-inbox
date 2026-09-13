import { isEnglish, languageName } from "./language";
import type { TriageResult } from "./types";

/*
 * Stand-ins for the composer's AI chips, Warmer · Shorter · Translate (brief 9.1). Live model calls
 * are out of scope for the prototype (brief 14), so each chip is a deterministic rewrite that keeps
 * the support voice (8.4): no exclamation marks, no em dashes, 90 words at most.
 */

type Draft = TriageResult["drafts"][number];
export type RewriteKind = "warmer" | "shorter" | "translate";
export type Rewrite = { text: string; language: string } | { blocked: string };

/** Sentences end at . or ? followed by a space, so "$39.99" and "v4" stay whole. */
export const sentences = (text: string) => text.trim().split(/(?<=[.?])\s+/).filter(Boolean);

const GREETING = /^((?:Hi|Hello|Hola|Olá),?\s+[^,.]+[,.]\s*)/;
const ACKNOWLEDGES = /\b(thank|thanks|sorry|gracias|lo siento|obrigad)/i;
const WARM_OPENER: Record<string, string> = {
  en: "thanks for bearing with us.",
  es: "gracias por tu paciencia.",
  pt: "obrigado pela paciência.",
};

function warmer(text: string, language: string): Rewrite {
  if (ACKNOWLEDGES.test(text)) return { blocked: "The reply already thanks or reassures the customer." };
  const opener = WARM_OPENER[language.slice(0, 2)];
  const match = text.match(GREETING);
  if (!opener || !match) return { blocked: "Warmer needs the reply to open with a greeting." };
  const rest = text.slice(match[1].length);
  return { text: `${match[1]}${opener} ${rest.charAt(0).toUpperCase()}${rest.slice(1)}`, language };
}

/** Drops the last sentence that carries no number or date, else the last sentence. Keeps the greeting. */
function shorter(text: string, language: string): Rewrite {
  const parts = sentences(text);
  if (parts.length <= 2) return { blocked: "The reply is already two sentences or fewer." };
  const candidates = parts.map((s, i) => ({ s, i })).filter(({ s, i }) => i > 0 && !/\d/.test(s));
  const drop = candidates.at(-1)?.i ?? parts.length - 1;
  return { text: parts.filter((_, i) => i !== drop).join(" "), language };
}

/** Swaps the AI's wording between the customer's language and its English gloss. */
function translate(text: string, language: string, draft: Draft | null): Rewrite {
  if (!draft?.glossEn || isEnglish(draft.language)) {
    return { blocked: "The customer writes in English, so there is nothing to translate." };
  }
  if (text === draft.body) return { text: draft.glossEn, language: "en" };
  if (text === draft.glossEn) return { text: draft.body, language: draft.language };
  return {
    blocked: `Translate works on the AI's wording. Your edits stay as you wrote them, in ${languageName(language)}.`,
  };
}

export function rewrite(kind: RewriteKind, { text, language, draft }: { text: string; language: string; draft: Draft | null }): Rewrite {
  switch (kind) {
    case "warmer":
      return warmer(text, language);
    case "shorter":
      return shorter(text, language);
    case "translate":
      return translate(text, language, draft);
  }
}

/**
 * Why the composer's text cannot be sent as it stands, or null. An English reply to a customer who
 * wrote in another language is held until it is translated back.
 */
export function composerSendBlock(text: string, language: string, customerLanguage: string): string | null {
  if (!text.trim()) return "Write a reply before sending.";
  if (isEnglish(language) && !isEnglish(customerLanguage)) {
    return `Translate the reply back to ${languageName(customerLanguage)} before sending. The customer wrote in ${languageName(customerLanguage)}.`;
  }
  return null;
}
