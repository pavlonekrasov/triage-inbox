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
