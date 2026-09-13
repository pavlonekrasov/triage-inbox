# Rationale

Every place this build departs from the brief, or makes a call the brief left open, in the five-line
format from brief section 17. Grouped by delivery step.

## Step 1: tokens

### Sage lightness

```
Problem     Sage text on its own 12% wash is a risk label the specialist must read; the brief's L 0.52 measured 4.50:1, exactly the threshold.
Decision    --risk-low moves from oklch(0.52 0.09 155) to oklch(0.50 0.09 155); hue and chroma are unchanged.
Reasoning   WCAG 1.4.3 needs 4.5:1, and browsers blend alpha in 8-bit sRGB, so a pair at 4.50 can land below it after rounding.
Trade-off   Sage is 0.02 L darker, slightly heavier next to terracotta; the three risk hues still separate by hue and glyph.
Validation  /tokens measures 4.86:1 on the wash and 5.28:1 as a glyph on the list pane (docs/evidence/step-1/contrast.png).
```

### Draft glyph edge

```
Problem     The brief gives the Draft glyph an amber fill (oklch 0.72 0.13 75), which measures 2.31:1 on the list pane; a glyph needs 3:1 (WCAG 1.4.11).
Decision    Keep the fill for hue, add a 1px amber-ink inset ring for the square's edge, and draw the pen in ink.
Reasoning   Shape coding (6.6) only works if the shape's boundary is visible; the ring measures 5.62:1 and the pen 7.06:1 on the fill.
Trade-off   The square gains a darker outline, so it reads slightly heavier than the stroke-only circle and hand.
Validation  Greyscale column on /tokens shows circle, square, hand and heart as distinct shapes (route-glyphs-2x.png).
```

### Night shift destructive and focus ring

```
Problem     The brief's .dark block never redefines --destructive or --ring, so Night inherited Day values: destructive 3.10:1 on card, ring 3.52:1.
Decision    Night --destructive = Night terracotta oklch(0.72 0.13 35); Night --ring = oklch(0.70 0.10 285).
Reasoning   Failed-send text must meet 4.5:1, and a ring 0.52 above the 3:1 floor disappears under a laptop's glare at night.
Trade-off   The Night ring is lighter than the Day ring, so the two themes' focus states are not the same colour.
Validation  /tokens Night column: destructive 6.76:1 on card, ring 6.46:1 on card and 7.04:1 on canvas.
```

### Derived washes

```
Problem     The brief writes each wash as a literal Day colour, so Night shift washes would tint dark surfaces with Day hues.
Decision    Washes are relative colour: oklch(from var(--role) l c h / alpha), declared on every theme scope.
Reasoning   One rule ("a wash is its role at a fixed alpha") holds in both themes, and Night washes follow Night hues without a second list.
Trade-off   Relative colour syntax needs Chrome 119, Safari 18 or Firefox 128; older browsers drop the wash.
Validation  Night column: violet on draft wash 6.85:1, sage 6.47:1, amber 6.76:1, terracotta 5.65:1.
```

### Night avatar, glass shadow and sheen

```
Problem     The brief specifies avatar colours, the glass shadow and the sheen for Day only; on an L 0.17 ground the Day values either glare or vanish.
Decision    Night avatar lightness 0.34 / 0.90; Night glass shadow in black at 0.2 and 0.4; Night sheen at 0.07, the Day sheen-to-highlight ratio applied to Night's highlight.
Reasoning   Each Night value keeps a Day relationship (a ratio or a legibility target) rather than inventing a new look.
Trade-off   Night glass reads mainly by its edge; the shadow is visible but softer than in Day.
Validation  glass-2x.png Night column; avatar initials stay legible on the tinted circle.
```

### Button labels in specimens

```
Problem     Review gate 12 requires verb plus object on every button; the brief names two actions "Edit" and "Escalate".
Decision    Labels read "Edit draft" and "Escalate case"; the primary still changes with the route ("Approve & send", "Escalate to Billing").
Reasoning   A single verb does not say what it acts on when a thread holds both a customer message and a draft.
Trade-off   Two more words in a 560px decision bar.
Validation  The decision bar specimen fits at 1440px with the primary at flex width (glass-2x.png).
```

### bencho.dev as a craft reference

```
Problem     The brief sets values but not the finish that makes a component read as shipped; the user named bencho.dev as the bar.
Decision    Adopt its tonal separation (surfaces one lightness step apart, no borders at rest), concentric corners, and weight-led hierarchy at 13px. Reject its overshooting springs, dark default and muted-text value.
Reasoning   Its measured card anatomy (28px radius, 6% light fill, 12px gutters, no shadow) matches the brief's flat-content rule; its curves (y up to 1.7) conflict with the ban on bounce, and its muted text measures about 3.6:1.
Trade-off   Controls feel firmer than bencho's, since no motion overshoots.
Validation  DESIGN.md names the adopted rules; later steps are checked against them in the same screenshots.
```

## Step 2: list pane

### Stale source raises risk instead of forcing a person

```
Problem     Brief 11 puts ticket 5 (retrieved policy v3, v4 exists) in Drafts, but brief 8.3 says any hard rule, stale_source included, forces human_led.
Decision    The agent reports staleness through the source (supersededBy) and raises risk to medium; hardRules stays empty, so the matrix routes it to a draft.
Reasoning   The matrix stays exceptionless ("any hard rule forces a person"), and a stale help article needs a second look, not a full human-led case.
Trade-off   stale_source remains in the HardRule type but no fixture uses it; a real agent must be told not to emit it for this case.
Validation  data/tickets.test.ts checks every fixture's route against routeFor, and ticket 5's source points at a registered v4.
```

### Open lanes sort by deadline

```
Problem     A chat list sorts newest first, which puts the oldest waiting case, the one closest to breaching, at the bottom of a 150-row queue.
Decision    Needs you and Drafts sort by first-response deadline, soonest first, under the pinned wellbeing and safety rows; Auto-resolved stays newest first.
Reasoning   The four questions start with "how risky is it"; a deadline is risk the specialist can act on, while Auto-resolved is history, where recency is the convention.
Trade-off   Timestamps in open lanes are not in chronological order, which a Telegram user does not expect.
Validation  inbox-needs-you-2x.png: Jordan (4:29 left) sits directly under the two pinned rows.
```

### Language chip only for non-English

```
Problem     Brief 7.3 puts a language chip on line one; with most customers writing in English, an EN chip on nearly every row answers none of the four questions.
Decision    The chip appears only when the customer wrote in another language (ES, PT); the thread header still shows the language for every ticket.
Reasoning   A chip that differs from the default is the signal; a chip that never varies is noise at 13px density (Linear's inbox shows exceptions, not defaults).
Trade-off   A specialist cannot confirm "English" from the list; they infer it from the absence of a chip.
Validation  drafts-lane-2x.png: only Diego Ramírez carries a chip in a lane of 11.
```

### Lane thumb width is a named motion exception

```
Problem     The sliding thumb must resize between lanes of different label widths, and brief 3.1 limits motion to transform, opacity and filter.
Decision    The thumb's x moves by transform; its width animates on the same spring (stiffness 520, damping 42, mass 1).
Reasoning   The thumb is an absolutely positioned leaf, so a width change never reflows the tabs or the list; scaleX would stretch its rounded ends.
Trade-off   Width is a layout property, so each frame runs layout for one element.
Validation  With prefers-reduced-motion the thumb moves instantly; the spring's damping ratio is 0.92, under 0.1% overshoot.
```

### Selection only in Drafts, with an explanation elsewhere

```
Problem     X enters selection mode, but Needs you holds only human-led cases and Auto-resolved holds sent replies: there is nothing to bulk-approve in either.
Decision    Selection mode exists only in Drafts. X or ⇧X in another lane shows a 4-second notice under the lane track saying why, and the reducer refuses any ticket canBulkSelect rejects.
Reasoning   A shortcut that does nothing fails silently (brief 9.2); the guard lives in one function so click, X and ⇧X cannot disagree (review gate 9).
Trade-off   A specialist who wants to tick cases in Needs you for a future bulk action cannot.
Validation  selection-blocked-notice-2x.png shows the notice; route.test.ts proves every no-approval rule refuses bulk selection.
```

### Selection bar replaces the title bar

```
Problem     Selection mode needs a count, a way out and a way to select the Sure drafts, in a 360px pane.
Decision    As in Telegram's edit mode, the title bar becomes "6 selected", "Select 6 Sure drafts" and an Exit selection icon button; the glass bulk bar with Approve arrives in step 7 with sending.
Reasoning   Reusing the familiar edit-mode header meets "familiar beats clever"; no Approve button ships before there is a send pipeline behind it.
Trade-off   Until step 7, selection has no action to take, only a count.
Validation  selection-mode-2x.png.
```
