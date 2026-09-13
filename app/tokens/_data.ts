export type ContrastPair = {
  label: string;
  /** Foreground token. */
  fg: string;
  /** Background tokens, bottom layer first. The first must be opaque. */
  bg: string[];
  /** 4.5 for text, 3 for glyphs and the focus ring, null for a value shown for information only. */
  min: 4.5 | 3 | null;
};

export const contrastPairs: ContrastPair[] = [
  { label: "Ink on canvas", fg: "--foreground", bg: ["--background"], min: 4.5 },
  { label: "Muted text on list pane", fg: "--muted-foreground", bg: ["--sidebar"], min: 4.5 },
  { label: "Muted text on selected row", fg: "--muted-foreground", bg: ["--sidebar", "--accent"], min: 4.5 },
  { label: "Muted text on canvas", fg: "--muted-foreground", bg: ["--background"], min: 4.5 },
  { label: "Muted text on card", fg: "--muted-foreground", bg: ["--card"], min: 4.5 },
  { label: "Muted text on muted chip", fg: "--muted-foreground", bg: ["--muted"], min: 4.5 },
  { label: "Label on primary button", fg: "--primary-foreground", bg: ["--primary"], min: 4.5 },
  { label: "Ink on sent bubble", fg: "--foreground", bg: ["--bubble-out"], min: 4.5 },
  { label: "Violet on draft wash", fg: "--brand", bg: ["--card", "--brand-wash"], min: 4.5 },
  { label: "Violet draft label on wallpaper field A", fg: "--brand", bg: ["--field-a"], min: 4.5 },
  { label: "Violet draft label on wallpaper field B", fg: "--brand", bg: ["--field-b"], min: 4.5 },
  { label: "Ink in draft bubble over wallpaper", fg: "--foreground", bg: ["--field-b", "--brand-wash"], min: 4.5 },
  { label: "Sage on sage wash", fg: "--risk-low", bg: ["--card", "--risk-low-wash"], min: 4.5 },
  { label: "Amber ink on amber wash", fg: "--risk-mid-ink", bg: ["--card", "--risk-mid-wash"], min: 4.5 },
  { label: "Terracotta on terracotta wash", fg: "--risk-high", bg: ["--card", "--risk-high-wash"], min: 4.5 },
  { label: "SLA countdown on list pane", fg: "--risk-high", bg: ["--sidebar"], min: 4.5 },
  { label: "Sources disagree on card", fg: "--risk-high", bg: ["--card"], min: 4.5 },
  { label: "Destructive on card", fg: "--destructive", bg: ["--card"], min: 4.5 },
  { label: "Ink on strong glass over field A", fg: "--foreground", bg: ["--field-a", "--glass-tint-strong"], min: 4.5 },
  { label: "Ink on strong glass over field C", fg: "--foreground", bg: ["--field-c", "--glass-tint-strong"], min: 4.5 },
  { label: "Muted on light glass over field A", fg: "--muted-foreground", bg: ["--field-a", "--glass-tint"], min: 4.5 },
  { label: "Muted on light glass over field C", fg: "--muted-foreground", bg: ["--field-c", "--glass-tint"], min: 4.5 },
  { label: "Auto glyph on list pane", fg: "--risk-low", bg: ["--sidebar"], min: 3 },
  { label: "Draft glyph ring on list pane", fg: "--risk-mid-ink", bg: ["--sidebar"], min: 3 },
  { label: "Draft glyph pen on amber fill", fg: "--on-risk-mid", bg: ["--risk-mid"], min: 3 },
  { label: "You glyph on list pane", fg: "--risk-high", bg: ["--sidebar"], min: 3 },
  { label: "Focus ring on canvas", fg: "--ring", bg: ["--background"], min: 3 },
  { label: "Focus ring on list pane", fg: "--ring", bg: ["--sidebar"], min: 3 },
  { label: "Focus ring on card", fg: "--ring", bg: ["--card"], min: 3 },
  { label: "Amber fill on list pane (hue only; the ring carries the edge)", fg: "--risk-mid", bg: ["--sidebar"], min: null },
];
