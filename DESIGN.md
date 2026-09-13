---
name: Care Desk
description: Triage inbox concept for an AI support agent. The AI prepares each case; a person decides.
colors:
  ink: "oklch(0.21 0.02 285)"
  ink-button: "oklch(0.25 0.035 285)"
  canvas: "oklch(0.985 0.003 285)"
  list-pane: "oklch(0.972 0.005 285)"
  card: "oklch(1 0 0)"
  muted-chip: "oklch(0.955 0.006 285)"
  muted-ink: "oklch(0.5 0.02 285)"
  hairline: "oklch(0.21 0.02 285 / 0.1)"
  hover-wash: "oklch(0.21 0.02 285 / 0.06)"
  focus-ring: "oklch(0.55 0.1 285)"
  sent-bubble: "oklch(0.94 0.025 285)"
  machine-violet: "oklch(0.5 0.12 290)"
  sage: "oklch(0.5 0.09 155)"
  amber-fill: "oklch(0.72 0.13 75)"
  amber-ink: "oklch(0.5 0.1 70)"
  terracotta: "oklch(0.53 0.15 35)"
  field-amber: "oklch(0.93 0.035 42)"
  field-neutral: "oklch(0.92 0.03 285)"
  field-teal: "oklch(0.94 0.03 196)"
  night-canvas: "oklch(0.17 0.02 280)"
  night-list-pane: "oklch(0.19 0.021 280)"
  night-card: "oklch(0.215 0.022 280)"
  night-ink: "oklch(0.95 0.008 285)"
  night-muted-ink: "oklch(0.72 0.02 285)"
  night-ink-button: "oklch(0.93 0.012 285)"
  night-focus-ring: "oklch(0.7 0.1 285)"
  night-sent-bubble: "oklch(0.3 0.04 285)"
  night-machine-violet: "oklch(0.74 0.11 290)"
  night-sage: "oklch(0.74 0.1 155)"
  night-amber: "oklch(0.8 0.12 80)"
  night-terracotta: "oklch(0.72 0.13 35)"
typography:
  micro:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.125rem"
  body-s:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.375rem"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.625rem"
    letterSpacing: "-0.01em"
  reference:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
rounded:
  glyph: "4px"
  tail: "6px"
  input: "10px"
  card: "14px"
  bubble: "18px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink-button}"
    textColor: "{colors.canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.hover-wash}"
  chip-language:
    backgroundColor: "{colors.muted-chip}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.micro}"
    rounded: "{rounded.pill}"
    padding: "0 6px"
  list-row:
    backgroundColor: "{colors.list-pane}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0 12px"
    height: "72px"
  list-row-selected:
    backgroundColor: "{colors.hover-wash}"
  bubble-customer:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "8px 14px"
  bubble-sent:
    backgroundColor: "{colors.sent-bubble}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "8px 14px"
  bubble-draft:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.bubble}"
    padding: "8px 14px"
  pinned-summary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
---

# Design System: Care Desk

## 1. Overview

**Creative North Star: "The Prepared Case"**

Care Desk is a messaging inbox where the AI's work arrives as artefacts a specialist can inspect: a pinned summary, service messages recording each step, a draft bubble that looks unmistakably unsent. The surface is built for an eight-hour shift through 150 to 400 conversations, so the system spends its visual budget on the moment of decision and keeps everything else quiet. Colour is scarce on purpose. Ink carries action, one violet marks machine-written text nobody has approved, and three risk hues appear only where risk is the subject.

Density follows Linear's inbox: 13px list type, single-line meta, glyphs instead of coloured pills. Structure follows Telegram and Front: list, thread, context panel. Component craft follows bencho.dev: surfaces separate by tonal steps rather than borders, nested corners stay concentric, and controls answer a press physically. The spiritual register of the product is carried by soft forms and a cool indigo neutral, never by iconography.

This system rejects the astrology category reflex (saturated purple on a cosmic dark gradient, stars, glow, crystal balls), the "AI dashboard" with KPI heroes and gradient cards, AI hidden behind a click, red "HIGH RISK" banners, and glassmorphism as a default material on content.

**Key Characteristics:**

- Light "Day" theme by default, a fully specified "Night shift" theme for the evening half of the shift.
- OKLCH end to end; tinted neutrals at hue 285, chroma 0.003 to 0.012.
- One family, Geist, at fixed rem sizes; hierarchy by weight and position before size.
- Flat opaque content; glass only on the four floating control surfaces.
- Motion gated by frequency: hundreds-per-shift actions are instant.

## 2. Colors: The Restrained Desk Palette

Tinted neutrals do almost all the work; four hues each hold exactly one job.

### Primary

- **Desk Ink** (oklch(0.21 0.02 285)): text and icons. Its button variant (oklch(0.25 0.035 285)) is the primary action, which always names what will happen: "Approve & send", "Send refund reply", "Take over conversation". Links and focus speak in ink, not a separate bright blue.

### Secondary

- **Machine Violet** (oklch(0.5 0.12 290)): marks content the machine wrote that a human has not approved. The draft bubble's dashed edge (35% alpha), its wash (6% alpha) and its "Draft · not sent · written by AI" label. Nothing else is violet.

### Tertiary

- **Sage** (oklch(0.5 0.09 155)): Auto route, low risk.
- **Amber** (fill oklch(0.72 0.13 75), ink oklch(0.5 0.1 70)): Approve-draft route, medium risk. The fill is for the glyph only.
- **Terracotta** (oklch(0.53 0.15 35)): Human-led route, high risk, SLA countdowns under five minutes, "Sources disagree". Deliberately not an alarm red.

### Neutral

- **Canvas** (oklch(0.985 0.003 285)): the thread ground, under three static wallpaper fields in the Weightless hues (amber 42, neutral 285, teal 196 at wash lightness).
- **List Pane** (oklch(0.972 0.005 285)): one tonal step below the canvas, so the panes separate without a heavy border.
- **Card** (oklch(1 0 0)): bubbles, panel sections, popovers, the command palette.
- **Muted Ink** (oklch(0.5 0.02 285)): previews, meta, service messages. 5.52:1 on the list pane, 4.87:1 on a selected row.
- **Hairline** (ink at 10%): pane dividers and the customer bubble edge. **Hover Wash** (ink at 6%): row hover and selection.

### Named Rules

**The One Job Rule.** Violet means "machine-written, not yet approved". If an element is not an unapproved AI artefact, it is not violet.

**The Risk-Only Rule.** Sage, amber and terracotta appear only on elements about risk or route. Charts use the ink ramp. A pass/fail badge that is not about customer risk is ink with a glyph.

**The Glyph Ring Rule.** The amber fill measures 2.31:1 on the list pane, below the 3:1 a glyph needs. The Draft square takes its edge from a 1px amber-ink ring (5.62:1) and draws its pen in ink (7.06:1 on the fill).

**The Derived Wash Rule.** A wash is its role's own colour at a fixed alpha (violet 6%, sage and terracotta 12%, amber 16%), written with relative colour syntax, so Night shift derives its washes from Night hues automatically.

**The Boundary Rule.** Tokens are authored in OKLCH. Tailwind's Lightning CSS pass ships each plain token as a hex fallback followed by `lab()`, the same colour in another space; relative-colour tokens ship as `oklch(from ...)`. Contrast is measured on what ships, in the browser, never on the source.

## 3. Typography

**Display Font:** none. A tool has no display type.
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono, for order IDs and transaction references only

**Character:** One grotesque at three weights. The product reads like a well-set operations ledger: small, even, and exact about numbers.

### Hierarchy

- **Heading** (600, 20px, 26px, -0.01em): empty states and the quality sheet.
- **Title** (600, 17px, 24px, -0.01em): the thread header name and sheet titles.
- **Body** (400, 15px, 22px): the reading surfaces: bubbles, the pinned summary, drafts. Bubble text caps at 62ch.
- **Body-s** (400, 13px, 18px): list previews and context panel values.
- **Label** (500, 13px, 18px): list names, section titles, badges.
- **Micro** (500, 12px, 16px): service messages, meta, keyboard hints.

### Named Rules

**The Tabular Rule.** Every timestamp, amount, count and SLA timer uses tabular numerals, so digits never shift as they tick.

**The Weight Before Size Rule.** Within the list and the panel, hierarchy comes from 400 against 500 and from position. A selected row sets its name in 600; it does not grow.

## 4. Elevation

Tonal layering, not shadows. Canvas, list pane and card are three lightness steps (0.985, 0.972, 1.0 in Day; 0.17, 0.19, 0.215 in Night shift). Opaque surfaces carry no shadow, or a 1px hairline where a step alone is too faint. Depth is reserved for the layer that floats: the four glass surfaces.

### Shadow Vocabulary

- **Glass cast, Day** (`box-shadow: 0 1px 1px oklch(0.16 0.02 285 / 0.05), 0 8px 24px -8px oklch(0.16 0.02 285 / 0.18)`): under the thread header pill, decision bar, lane switcher track and bulk bar.
- **Glass cast, Night shift** (`box-shadow: 0 1px 1px oklch(0 0 0 / 0.2), 0 12px 28px -10px oklch(0 0 0 / 0.4)`): the same surfaces; a hue-285 shadow at 18% disappears on an L 0.17 ground.
- **Glass bevel** (`inset 0 1px 0` highlight, `inset 0 -1px 0` shaded rim, `inset 0 0 0 0.5px` sheen ring): the material's edge. On a near-blank ground, glass reads by this edge, not by refraction.

### Named Rules

**The Four Surfaces Rule.** Glass exists on exactly four surfaces: thread header pill, decision bar, lane switcher track, bulk action bar. Bubbles, the pinned summary, the context panel, popovers and the command palette are opaque. A fifth glass surface needs a written answer to which of the four questions it serves.

**The Radius Bound Rule.** Every backdrop-filter is bounded by border-radius, never clip-path or a mask, and is written only in `components/glass/Glass.tsx`. Under reduced transparency the tint is opaque and the blur is none.

## 5. Components

### Buttons

- **Shape:** fully round pills (9999px). Inside a glass bar, buttons keep concentric corners with their container.
- **Primary:** ink fill, canvas-coloured label (15.45:1), 40px tall in the decision bar. The label is verb plus object and changes with the route.
- **Hover / Focus:** hover is a background-colour wash over 150ms, only on fine pointers. Focus is a 2px ring at 3:1 or better on every ground. Press scales to 0.97 over 100ms; under reduced motion the press scale is 1.
- **Ghost:** ink label on transparent; used for Edit draft and Escalate case beside the primary.

### Chips

- **Style:** muted fill, muted ink, 12px, fully round. Language codes (`ES`, `ES → EN`), hard-rule chips (`Money decision`, `Sources disagree`), source chips under a draft.
- **State:** hard-rule chips carry a glyph and a label; they never rely on colour.

### Cards / Containers

- **Corner Style:** 14px for the pinned summary and context panel sections; 18px bubbles with a 6px tail corner on the sender's side.
- **Background:** card white on the canvas or wallpaper; list rows sit directly on the list pane.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px hairline on customer bubbles and panel sections only.
- **Internal Padding:** 8px by 14px in bubbles, 12px by 16px in the pinned summary.

### Inputs / Fields

- **Style:** 10px radius, input hairline (ink at 14%), card fill.
- **Focus:** 2px focus ring; no glow.
- **Edit composer:** Telegram's edit mode. An "Editing AI draft" strip quotes the draft above the field, with Warmer, Shorter and Translate chips.

### Navigation

- **Lane switcher:** the portfolio's sliding tabs on a light glass track. One ink thumb slides and resizes on select, never on hover, on a spring of stiffness 520, damping 42, mass 1, with no visible overshoot. Labels are 13px medium; counts are tabular. Under reduced motion the thumb moves instantly.

### List Row (signature)

72px tall, 12px horizontal padding, 44px avatar, text column at 68px, separator inset to 68px. Line one: name (label), language chip, timestamp right (micro, tabular), which becomes a terracotta countdown with a clock glyph under five minutes of SLA. Line two: category glyph and the AI one-line summary. Right column: the route glyph. Selection via J and K is instant, with no transition.

### Draft and Sent Bubbles (signature)

The draft is the costliest error surface, so it is unmistakable at 25% scale: violet wash, 1px dashed violet edge, a "Draft · not sent · written by AI" label above it, and a sources chip below. On approval the dash turns solid and the fill crossfades to the sent-bubble tone over 180ms; the label becomes "Sent by you · 18:44" with double ticks drawn over 160ms.

### Route Glyphs

Shape-coded at 16px in lists and 18px in the decision bar, stroke 1.75: circle-check for Auto, a pen in a 4px-radius square for Draft, a hand for You, heart-handshake for Wellbeing. Each has a text label, visible or screen-reader-only.

## 6. Do's and Don'ts

### Do:

- **Do** author every colour in OKLCH and measure every text pair at 4.5:1 and every glyph and focus ring at 3:1, in the browser, in both themes.
- **Do** separate surfaces with a tonal step (canvas 0.985, list pane 0.972, card 1.0) before reaching for a border.
- **Do** keep nested corners concentric: an inner radius is the outer radius minus the padding between them.
- **Do** give every button a verb and an object that say what will happen.
- **Do** make every animated rule inherit `--motion` and `--press-scale`, so reduced motion is one token flip.
- **Do** show confidence in words and a three-step meter (Sure, Likely, Unsure); the raw model score appears only inside "Why this route".

### Don't:

- **Don't** use saturated purple on a cosmic dark gradient, stars, glow or a crystal ball. The spiritual register is carried by softness and hue, not iconography.
- **Don't** build an "AI dashboard": no KPI hero, no chart grid, no gradient cards on the home screen.
- **Don't** hide the AI behind a click the way a summary popover or an empty Copilot panel does. Route, risk, confidence and evidence appear together at the moment of decision.
- **Don't** use red "HIGH RISK" banners, colour-only status, or percentages in the scan path.
- **Don't** use glassmorphism as a default: no glass beyond the four surfaces, and no clip-path or mask on any glass element.
- **Don't** open a modal for Escalate or Edit. Popover and in-place first.
- **Don't** use side-stripe `border-left` accents on rows or cards, gradient text, uppercase tracked eyebrows, or em dashes in UI copy.
- **Don't** animate the wallpaper, sequence the page load, stagger list entrances, or use bounce and elastic curves. bencho.dev's overshooting springs suit a component showcase, not a tool used hundreds of times a shift.
- **Don't** offer auto-send, Approve or bulk-select on wellbeing, safety, privacy, source-conflict or instruction-in-message tickets, not even behind a setting.
- **Don't** show an AI verdict about whether an advisor violated policy, anywhere.
- **Don't** add a display typeface, a second sans, or emoji in product chrome.
- **Don't** write hex, HSL, RGB or named colours in source, or Tailwind arbitrary colour values.
