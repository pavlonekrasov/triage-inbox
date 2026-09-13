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

## Step 3: thread

### Draft fill composited over card

```
Problem     The brief fills the draft bubble with --brand-wash, a 6% alpha; over the wallpaper its text contrast would change with every field behind it.
Decision    The draft fill is the wash composited over --card (the draft-fill utility), so the bubble is opaque and near-white.
Reasoning   An opaque bubble measures the same everywhere (muted text 5.53:1 Day, 6.50:1 Night), and near-white beside the tinted sent bubble adds a fill difference to the dashed edge and the "not sent" label.
Trade-off   The wallpaper does not show through the draft, so it reads slightly heavier than a customer bubble.
Validation  draft-vs-sent-25pct.png: at 360 px wide the white dashed draft and the tinted sent reply are still told apart.
```

### Status label above every outgoing bubble

```
Problem     Approving a draft (step 5) turns "Draft · not sent" into "Sent by you · 18:44 ✓✓"; if the two labels lived in different places, the proof of sending would jump.
Decision    Every outgoing bubble, draft or sent, carries its status line above the bubble, right-aligned; customer bubbles keep Telegram's in-bubble timestamp.
Reasoning   One slot for "what state is this reply in" means the approve transition changes a line of text in place, next to the bubble whose border and fill change with it.
Trade-off   Outgoing bubbles take one more line of height than in Telegram.
Validation  thread-t12-reopened-2x.png shows a sent reply and a draft with their labels in the same slot.
```

### The AI step log as one block

```
Problem     Five service-message pills per ticket, one per step, outweighed the customer's message they describe.
Decision    Consecutive steps render as one quiet block with a line per step. "sent" steps are left out: the sent bubble's label already records the send. Spot-check sampling appears as its own line after the reply.
Reasoning   One shape instead of five keeps the log as evidence you can read, not a column of chips competing for attention ("calm", brief 1).
Trade-off   Steps are no longer individually separable pills, so a future per-step action (open the retrieved policy) needs a link inside the block.
Validation  thread-t02-2x.png after the change; timeline.test.ts proves no "sent" step renders.
```

### One translation switch, on by default

```
Problem     Brief 7.4 asks for an "ES → EN" chip and brief 8.4 for an English gloss toggle; separate switches per bubble would multiply controls, and a specialist cannot approve Spanish they cannot read.
Decision    The header chip is the one switch (aria-pressed). It starts on and shows English under the customer's message, the sent reply and the draft, each labelled "Translated from Spanish" or "English gloss, not sent".
Reasoning   The original stays first and marked with its lang attribute as the evidence; the translation is what the decision rests on, so it is visible without a click.
Trade-off   Translated threads are about twice as tall.
Validation  thread-t07-translated-2x.png; translation-toggle-off reports 0 English blocks after one press.
```

### Snooze and spam refuse the cases that must not wait

```
Problem     The header menu offers Snooze and Mark spam; either one would take a person in distress or a safety report out of the queue.
Decision    Wellbeing and safety tickets cannot be snoozed or marked spam, privacy requests cannot be marked spam; the items stay in the menu, disabled, with the reason written under them. Snooze and spam elsewhere open the next conversation and offer Undo for 6 s.
Reasoning   A hidden option leaves the specialist guessing; a disabled one with its reason teaches the rule (brief 9.2, "never fails silently").
Trade-off   A genuinely spam message that trips the wellbeing classifier stays in Needs you until someone replies.
Validation  menu-blocked-t06-2x.png; desk-store.test.ts covers the blocks and the Undo round trip.
```

### Lane track uses the strong tint (correction to step 2)

```
Problem     Step 2 gave the lane track the light glass tint; at 900 px the "Auto-send paused" banner scrolled under it and showed through behind the tab labels.
Decision    The track uses --glass-tint-strong, as brief 3.2 requires for any glass that carries text.
Reasoning   The rule exists for this case: text on glass must not compete with text behind it.
Trade-off   The track refracts less of the list behind it.
Validation  thread-t21-narrow-900.png after the change.
```

## Step 4: pinned summary

### The routing display in the pinned card

```
Problem     A specialist deciding in three seconds needs route, category, confidence and the summary together, without opening anything (PRODUCT.md, "AI hidden behind a click").
Decision    Collapsed: route glyph with a headline naming what is needed ("Needs your decision", "Draft waiting for approval"), category path, confidence meter, summary, evidence problems. "Why this route" opens the reasons, the confidence note, hard-rule chips, the matrix row as a sentence, and the model score.
Reasoning   Brief 8.1's two reading depths. The matrix sentence checks rules in the order lib/route.ts does, so the explanation cannot disagree with the router.
Trade-off   The card takes 126 px of thread height collapsed and about 440 px open at 1440 × 900.
Validation  summary-t02-collapsed-2x.png, summary-t04-why-2x.png; summary.test.ts covers every matrix row.
```

### Confidence in words, a meter by shape

```
Problem     A percentage invites false precision (8.2), and a colour-coded meter fails greyscale and colour blindness (review gate 6).
Decision    The word leads (Sure, Likely, Unsure); three ink bars follow, filled solid or drawn as an outline. The model score appears once, small, after the confidence note inside "Why this route".
Reasoning   Confidence is not risk, so the meter borrows no risk hue ("risk is never decoration"); solid against outline survives greyscale.
Trade-off   Filled and empty bars differ by fill alone, which reads slower than colour; the word carries the level.
Validation  greyscale-summary-t04-why-2x.png.
```

### Two fields added to the contract

```
Problem     Brief 8.1 asks for reasons "with a check or warning glyph" and confidence "explained in words", but the TriageResult in brief 8 carries neither.
Decision    reasons[].caution?: boolean marks a reason that holds the case back from sending on its own; confidenceNote: string explains the level without naming it ("intent is clear; no error or screen is named").
Reasoning   Deriving either from label text would be guessing; a real agent can return both, and the type stays the seam where it plugs in (brief 14).
Trade-off   The contract differs from the brief's by two fields a model evaluation must also score.
Validation  summary.test.ts: auto-sent tickets carry no caution, every hard-rule ticket at least one, every note at most 14 words and no level word.
```

### Evidence problems on the collapsed card

```
Problem     Review gate 15 needs ticket 4's conflict and ticket 5's outdated policy in the pinned card; under "Why this route" they would be a click away at the moment of deciding.
Decision    "Sources disagree" and "Chat credit refunds v3 is outdated: v4 published 2 Sep" sit under the summary on the collapsed card, in terracotta with a warning triangle.
Reasoning   They decide whether the draft is usable at all, which is three-second information; the triangle and the words keep them readable without colour.
Trade-off   Ticket 2's flag repeats a clause of its own summary.
Validation  summary-t04-why-2x.png, summary-t05-stale-why-2x.png; summary.test.ts flags exactly these two and none on current, agreeing evidence.
```

### Source citations now, links in step 6

```
Problem     Brief 8.1 wants each reason's source to link to its highlighted row in the context panel, which arrives in step 6.
Decision    Each sourced reason shows a citation: title, version, updated date; a superseded version is struck through (not faded to 50%, which would fall below 4.5:1) beside "Newer version exists (v4, 2 Sep)". Evidence lines say what the source establishes, since the citation names it.
Reasoning   A link to a panel that does not exist yet would be a control that does nothing; the citation carries the audit value now.
Trade-off   Until step 6 the citation cannot be followed to the policy text.
Validation  tickets.test.ts: no evidence line repeats its source's title; summary-t05-stale-why-2x.png.
```

### Opening "Why this route" keeps the latest message in place

```
Problem     The card floats at the top of the thread, so opening it pushed the draft 218 px below the viewport when the thread sat at its latest message.
Decision    A ResizeObserver on the floating strip moves the scroll position by the strip's growth each frame, with browser scroll anchoring off so nothing corrects twice. Each conversation opens collapsed.
Reasoning   The draft is what "Why this route" explains, so it stays in view while the reasons open; Safari has no scroll anchoring, so the correction cannot rely on it.
Trade-off   With the thread scrolled to its top, the opening card covers the first messages instead of pushing them down.
Validation  expand-keeps-latest-message-in-view: draft bottom at 868 px before and after, 0 px from the end.
```

## Step 5: decision bar

### Approve opens the next case; Undo sits where the result is visible

```
Problem     Brief 9.1 says Approve opens the next ticket, and also that "the bubble itself shows Sent · Undo for 5 s"; once the next ticket opens, that bubble is off screen.
Decision    Approve sends optimistically and opens the next conversation at once, with focus on its row. Undo appears in the sent bubble when that conversation is on screen (the last case in a lane), otherwise in a pill directly above the decision bar ("Sent to Maya Ruiz · Undo"). Z undoes the latest send.
Reasoning   Approving a low-risk draft happens hundreds of times a shift, so it gets no wait (brief 2); sent-then-undo next to the action is the Gmail and Front pattern (brief 4.2), and Z is Gmail's undo key.
Trade-off   The draft-to-sent crossfade is seen only when a lane empties, after Retry, or on a follow-up; most approvals show the pill instead.
Validation  keyboard-A, keyboard-A-Z, keyboard-A-Z-A: t17 → t21 with focus on row-t21 → t17 with focus on row-t17 → t21. morph-midway: same element, fill at 0.35 after 90 ms.
```

### Approve belongs to drafts routed for approval, and nowhere else

```
Problem     Review gate 9 bans Approve on wellbeing, safety, privacy, conflict and injection cases; brief 9.1 still gives those cases a send path of their own.
Decision    One-action Approve exists only on approve_draft. Human-led cases get a primary that needs judgment first: choose Refund or Decline (t02), Take over conversation (t06), Acknowledge & open review (t03), or Edit & send reply, which opens the text in the composer (t04, t09, t12, t13). A on any of them explains itself above the bar.
Reasoning   "The human is the product": the send a person makes on a human-led case is always a separate, readable step, never a keystroke that accepts the AI's words.
Trade-off   Ticket 12 (reopened, money decision) could technically be approved under gate 9, but it takes the composer path too.
Validation  decision.test.ts and desk-store.test.ts: A never sends any guarded ticket in any state; approveBlocked is null exactly for approve_draft.
```

### No default outcome on a money decision

```
Problem     Ticket 2 has a refund draft and a decline draft; preselecting either one nudges a person toward the AI's first draft on a disputed charge.
Decision    Both drafts show in the thread until a person chooses. "Reply to send · Refund | Decline" sits in its own opaque pill directly above the bar, and the primary reads "Choose a reply to send" until then, and "Send decline reply" after.
Reasoning   Brief 9.1, "The human makes the judgment; the AI wrote both outcomes"; a default is a judgment. The choice sits outside the bar because three labelled decisions with key hints already fill 560 px.
Trade-off   The thread is two drafts taller until a choice is made, and the dock has two layers on this case.
Validation  bar-t02-variants-2x.png (bar 546 px, no overflow); bar-t02-decline-chosen-2x.png.
```

### One tick while leaving, two when delivered

```
Problem     A ✓✓ during the undo window would claim delivery for a reply that has not left, and a send can still fail.
Decision    Sent by you · 18:44 ✓ during the window and the 600 ms send; ✓✓ once delivered; "Not sent · Retry" in terracotta if the send fails, with the row back in its lane marked "Not sent:". Each tick draws in 160 ms, 60 ms after the bubble begins to change.
Reasoning   WhatsApp's grammar (one tick sent, two delivered) is already familiar, and it keeps the label true at every moment.
Trade-off   The brief's label shows ✓✓ at once; this one adds a second visible state.
Validation  sent-delivered-ticks: 2 paths after 6.2 s; send-failed-bubble-2x.png; send-failure-retry: failed → sent with 2 ticks.
```

### The composer is the decision bar, grown

```
Problem     Edit needs a composer (brief 9.1), and a fifth glass surface is ruled out (6.5).
Decision    Pressing Edit turns the decision bar's own glass into a 14 px-radius composer: "Editing AI draft" strip in violet, the text, Warmer · Shorter · Translate, and "Send edited reply" once the text changes. The draft bubble leaves the thread while it is in the composer; Esc discards and brings it back.
Reasoning   Telegram's edit mode (brief 4.1): the text moves into the composer, and the glass surface count stays at four.
Trade-off   While the composer is open, Approve and Escalate are one Esc away.
Validation  composer-t17-edit-2x.png; composer-escape-restores-draft: draft back, focus on row-t17.
```

### The AI chips are deterministic stand-ins

```
Problem     Live model calls are out of scope (brief 14), but Warmer · Shorter · Translate must do something honest.
Decision    Shorter drops the last sentence without a figure; Warmer adds one acknowledgment after the greeting unless the reply already thanks or apologises; Translate swaps the AI's wording with its English gloss. Each takes 600 ms and marks the text "Rewritten by AI · read it before sending". An English reply to a customer who wrote Spanish is held until translated back.
Reasoning   A chip that refuses in words ("The reply already thanks or reassures the customer") is better than one that invents text a fixture cannot back.
Trade-off   Rewrites are mechanical and cannot handle a person's own edits; Translate refuses edited text.
Validation  rewrite.test.ts keeps every rewrite of every draft within the voice rules (90 words, no "!", no em dash); composer-t07-translate: send held with the reason.
```

### Safety acknowledgments get no Edit button

```
Problem     Ticket 3's bar ("Acknowledge & open review", Edit draft, Escalate case, key hints) measured 573 px, over the 560 px cap, and its Edit could only ever refuse.
Decision    The safety bar shows the primary and Escalate; E still answers "The acknowledgment is fixed wording". Bar buttons use 14 px sides.
Reasoning   A control that can never act spends width on a refusal; the explanation stays one key away.
Trade-off   The three decisions are not in the same positions on this one case.
Validation  bar-fits-every-ticket-1440 and -900 open all 22 tickets and report no overflowing bar.
```

### Day terracotta at L 0.52

```
Problem     "Not sent" in terracotta over wallpaper field B measured 4.44:1 in Day.
Decision    Day --risk-high and --destructive move from oklch(0.53 0.15 35) to oklch(0.52 0.15 35).
Reasoning   WCAG 1.4.3; the smallest change that clears the pair, with hue and chroma untouched.
Trade-off   Terracotta is marginally darker everywhere in Day, including SLA countdowns.
Validation  /tokens: 41/41 pairs in both themes; "Not sent label on wallpaper field B" 4.62:1.
```
