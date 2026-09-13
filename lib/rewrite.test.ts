import { describe, expect, it } from "vitest";
import { TICKETS } from "@/data/tickets";
import { composerSendBlock, rewrite, sentences, type RewriteKind } from "./rewrite";

const drafts = TICKETS.flatMap((t) => t.triage.drafts);
const draft = (id: string) => {
  const d = drafts.find((x) => x.id === id);
  if (!d) throw new Error(`missing draft ${id}`);
  return d;
};
const words = (text: string) => text.trim().split(/\s+/).length;
const apply = (kind: RewriteKind, id: string, text?: string) => {
  const d = draft(id);
  return rewrite(kind, { text: text ?? d.body, language: d.language, draft: d });
};

describe("sentences", () => {
  it("keeps prices and versions inside their sentence", () => {
    expect(sentences("I refunded $39.99 today. Does policy v4.2 apply? Yes.")).toEqual([
      "I refunded $39.99 today.",
      "Does policy v4.2 apply?",
      "Yes.",
    ]);
  });
});

describe("rewrite", () => {
  it("shortens by dropping a sentence without figures, keeping the greeting and the amount", () => {
    const result = apply("shorter", "t02-refund");
    if (!("text" in result)) throw new Error(result.blocked);
    expect(words(result.text)).toBeLessThan(words(draft("t02-refund").body));
    expect(result.text).toMatch(/^Hi Jordan,/);
    expect(result.text).toContain("$39.99");
    expect(result.text).not.toContain("no further charges");
  });

  it("refuses to shorten a reply of two sentences", () => {
    expect(apply("shorter", "t19-draft")).toEqual({ blocked: "The reply is already two sentences or fewer." });
  });

  it("adds one acknowledgment after the greeting", () => {
    expect(apply("warmer", "t17-draft")).toMatchObject({
      text: expect.stringMatching(/^Hi Maya, thanks for bearing with us\. You can cancel/),
    });
  });

  it("refuses Warmer when the reply already thanks or reassures", () => {
    expect(apply("warmer", "t14-draft")).toHaveProperty("blocked");
    expect(apply("warmer", "t07-draft")).toHaveProperty("blocked");
  });

  it("translates the AI's wording both ways and leaves edited text alone", () => {
    const d = draft("t07-draft");
    expect(apply("translate", "t07-draft")).toEqual({ text: d.glossEn, language: "en" });
    expect(rewrite("translate", { text: d.glossEn ?? "", language: "en", draft: d })).toEqual({
      text: d.body,
      language: "es-MX",
    });
    expect(apply("translate", "t07-draft", `${d.body} Saludos.`)).toHaveProperty("blocked");
    expect(apply("translate", "t17-draft")).toHaveProperty("blocked");
  });

  it.each(drafts.map((d) => [d.id] as const))("keeps the support voice in every rewrite of %s", (id) => {
    for (const kind of ["warmer", "shorter", "translate"] as const) {
      const result = apply(kind, id);
      if (!("text" in result)) continue;
      expect(words(result.text)).toBeLessThanOrEqual(90);
      expect(result.text).not.toMatch(/[!—]/);
    }
  });
});

describe("composerSendBlock", () => {
  it("holds an empty reply, and an English reply to a customer who wrote in Spanish", () => {
    expect(composerSendBlock("  ", "en-US", "en-US")).toBe("Write a reply before sending.");
    expect(composerSendBlock("Hi Diego", "en", "es-MX")).toMatch(/^Translate the reply back to Spanish/);
    expect(composerSendBlock("Hola Diego", "es-MX", "es-MX")).toBeNull();
  });
});
