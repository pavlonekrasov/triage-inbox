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

## Step 5 fixes

### One button component

```
Problem     Buttons came from four places: PillButton, a shadcn Button nobody on the desk used, UndoButton, and hand-rolled <button> elements for Retry, notice actions, the language chip and reason chips, each restating focus and press styles.
Decision    components/controls/Button.tsx is the only button. Variants: primary, ghost, outline, text (a word inside a sentence, such as Retry) and undo (the text button that draws its 5 s window). Base UI triggers render it through their render prop. The lane tabs and list rows stay native elements because they are tab and option widgets, not buttons.
Reasoning   One set of focus, hover, press and aria-disabled rules means a refused action looks and behaves the same everywhere (brief 9.2).
Trade-off   The undo variant carries behaviour (its countdown), so it is not purely a style.
Validation  grep finds no other button component; the only native <button> elements left are in LaneSwitcher (role=tab) and TicketRow (role=option).
```

### A follow-up never erases the reply before it

```
Problem     A follow-up replaced the delivered reply in state; undoing the follow-up then deleted both, and the case went back to Drafts as if it had never been answered.
Decision    Each sent reply keeps the delivered reply it follows. The thread shows all of them in order; Undo and a failed send affect only the latest; a follow-up waits until the reply before it is delivered.
Reasoning   A sent message is a record the customer already has; the desk must never show less than the customer received.
Trade-off   The Follow up button refuses for up to 5.6 s after a send.
Validation  desk-store.test.ts "follow-ups keep what was already sent": two replies in order, Undo leaves the first delivered, a failed follow-up keeps the case answered.
```

### An escalated case refuses every decision

```
Problem     An escalated case stays open when it was the last in its lane. Its bar was hidden, but A, E and H still sent the draft, opened the composer or reopened Escalate.
Decision    The bar becomes "With Billing · escalated by you at 18:44", and A, E, H or the composer's send explain "This case is with Billing now, so there is nothing to decide here."
Reasoning   A refused shortcut says why (brief 9.2); a case handed to a team must not also get a reply from this desk.
Trade-off   Undo escalation stays in the 6 s notice only, as the popover promises.
Validation  desk-store.test.ts: approve, decide, openComposer and setEscalateOpen on an escalated t17 send nothing and explain.
```

### Unsent edits are kept per conversation

```
Problem     The desk held one composer. Starting an edit on a second conversation dropped the first one's unsent text without a word.
Decision    Each conversation keeps its own composer until it is sent or discarded, as Telegram keeps a draft per chat.
Reasoning   Losing typed text silently is the costliest kind of edit error; the specialist moves between cases constantly.
Trade-off   An abandoned edit waits on its case until Esc discards it.
Validation  desk-store.test.ts "keeps an unsent edit on one conversation while the specialist edits another".
```

### Shortcuts work from radios and checkboxes

```
Problem     Focus on the Refund/Decline radio made A, E and H do nothing, because every <input> counted as a text field.
Decision    Shortcuts are skipped only in text-entry fields, selects and contenteditable; radios, checkboxes and buttons pass keys through.
Reasoning   A letter pressed on a radio types nothing, so it can only mean the shortcut; brief 9.2 forbids silent failure.
Trade-off   None found: radios and checkboxes use arrows and Space, which the keymap does not bind.
Validation  In the browser, clicking Refund then pressing A shows "Approve is off for this decision. Choose Refund or Decline, then send it."
```

## Step 6: context panel

### A third pane on the desk, a sheet below it

```
Problem     The specialist has to check the AI's evidence (billing records, sources, history) without leaving the conversation, and three panes need 1,220 px at their minimum widths.
Decision    From 1280 px the panel is a third resizable pane, 340 px (300 to 420), open by default. Below 1280 px it is a right sheet, closed by default. The header pill's panel button and ] show or hide it in both.
Reasoning   Telegram Web's info panel and its ] key (brief 7.1, 7.2); a pane that is always one key away stays out of the reading path.
Trade-off   At 1280 to 1440 px the thread column narrows to roughly 520 to 680 px while the panel is open.
Validation  inbox-t04-panel-2x.png; key-bracket-toggle: ] hides the panel, ] again shows it; sheet-900-2x.png: 384 px sheet, opacity 1, no backdrop-filter.
```

### Records that disagree sit side by side, in the customer's time

```
Problem     Ticket 4's whole case is a time zone: the App Store logged 3 Sep 23:58 Pacific, payments renewed at 4 Sep 07:02 UTC. A list of UTC timestamps hides that the customer is right about "the 3rd".
Decision    The billing timeline is in the customer's zone, named once at the top ("Pacific"). The two disagreeing records are grouped into one terracotta-washed entry, "Sources disagree · 4 minutes apart", as two cards side by side, each with its system, the normalised time, and the UTC original underneath, then one sentence saying what disagrees.
Reasoning   Brief 7.5 asks for exactly this; side by side makes the 4-minute gap a comparison instead of arithmetic. Zone names are written in code, not taken from Intl, so server and browser render the same text.
Trade-off   In 131 px cards the label and amount take two lines each.
Validation  accounts.test.ts: ticket 4 renders 3 Sep 23:58 / 4 Sep 06:58 UTC and 4 Sep 00:02 / 4 Sep 07:02 UTC, 4 minutes apart; panel-t04-conflict-2x.png; /tokens "Ink on the sources-disagree wash" 14.85:1 Day.
```

### Outdated sources: the strike line at 50%, not the text

```
Problem     Brief 7.5 says a superseded source is "struck through at 50%"; text at 50% opacity measures under 4.5:1, which review gate 2 forbids.
Decision    The title keeps muted ink (4.5:1 or better) with a line-through drawn at 50% of the ink colour, a warning glyph, and "Newer version exists (v4, 2 Sep)" in terracotta beneath. The section header reads "1 outdated" with the glyph. The pinned card's citation uses the same treatment.
Reasoning   Gate 2 is a measurement and the brief's 50% is a styling instruction; the struck line still reads as "no longer valid" while the words stay legible.
Trade-off   The superseded title is less faded than the brief's picture.
Validation  panel-t05-stale-2x.png; context.test.ts sourcesStatus for ticket 5 is "1 outdated" with risk.
```

### Restricted fields are shown, and a revealed email is logged

```
Problem     A field the agent may not read could be hidden, but then the specialist cannot tell "not on record" from "not permitted".
Decision    Restricted fields (birth details, payment card, transcript content, reading content) show a lock, "Restricted" and the reason in a line underneath. The email is masked to its first letter and domain; Reveal shows it and adds "Email address revealed by you" to the thread, once.
Reasoning   Brief 7.5: knowing a field exists but is restricted is part of trusting the system; a logged reveal is the helpdesk convention for personal data.
Trade-off   Every section carries one or two rows that give no data.
Validation  panel-t03-advisor-2x.png shows the transcript locked and no advisor verdict; desk-store.test.ts "logs the first email reveal in the thread, once".
```

### Evidence links to its row, which flashes

```
Problem     The pinned card says "Sources disagree" and cites "Refund policy v4"; the specialist should reach the record behind each claim in one action (review gate 15).
Decision    Evidence flags on the collapsed card and source citations under "Why this route" are text buttons. Each opens the panel (or the sheet), expands the section, scrolls the row into view, moves focus to it, and flashes an ink wash that fades over 600 ms with ease-in. Under reduced motion there is no flash, and the focus ring marks the row.
Reasoning   A claim linked to its evidence is "evidence, not belief"; moving focus keeps keyboard and screen-reader users on the same row the eye goes to.
Trade-off   Following a link takes keyboard focus out of the thread; J and K still work from the panel.
Validation  flag-t04-link: row in view and focused after 1.2 s; citation-t05-reduced-motion: row focused, flash hidden. The first capture found an ease-out flash at 1% opacity after 150 ms, hence ease-in.
```

### Key hints need a 640 px thread column

```
Problem     With the panel open at 1280 px the thread column is 578 px, and ticket 2's decision bar with its key hints needed more than the 530 px left inside the dock's padding.
Decision    Key hints show from 1280 px, as before, and also only while the thread column is at least 640 px wide (a container query on the thread).
Reasoning   Brief 9.2 ties hints to room on screen; the thread's own width is the room that matters once a third pane takes 340 px.
Trade-off   At 1280 to 1339 px with the panel open, hints are hidden; aria-keyshortcuts and the ? sheet in step 7 still name every key.
Validation  panel-fits-every-ticket-1280: 22 tickets, no problems; inbox-t04-panel-2x at 1440: hints shown; step 5 bar-fits sweeps at 1440 and 900 still report no overflow.
```

## Step 6 fixes

### A panel row request is handled once

```
Problem     Following a citation left the request in state, so hiding and showing the panel replayed the flash and pulled keyboard focus back into the row; each conversation's details also opened at the previous one's scroll position.
Decision    The panel marks a request done after it moves focus and flashes the row; opening another conversation drops any request. The panel is keyed by conversation, so it opens at the top. The flash is a Web Animation on a wash that is always present, so nothing re-renders to run it.
Reasoning   Focus moves only in answer to an action (WCAG 3.2.1); a replayed flash points at nothing the specialist asked for.
Trade-off   The 600 ms and ease-in now live in the component instead of a CSS token.
Validation  audit a: after ] ] focus stays where it was and no flash runs; audit c: the next conversation's panel is at scrollTop 0; desk-store.test.ts "context panel requests".
```

### Focus is never dropped to the page

```
Problem     Reveal removed its own button and the panel's close button removed itself, both leaving focus on <body>; ] opened the sheet but could not close it, because dialogs swallow shortcuts.
Decision    After Reveal, focus moves to the revealed address. Hiding the panel with focus inside it hands focus to the header's panel button. ] passes through the customer details sheet, and only that shortcut.
Reasoning   A keyboard user must never have to find their place again (WCAG 2.4.3); the key that opens a panel should close it.
Trade-off   None found.
Validation  audit e: focus on "jordan.kim@example.com"; audit g: focus on the header's "Customer details" button; audit f: ] closes the sheet.
```

### Smaller fixes

```
Problem     The sheet measured 281 px on a 375 px phone; the dialog backdrop still carried a named black and a backdrop blur outside Glass.tsx; the "Sources:" chip under drafts looked like the other citations but did nothing.
Decision    The sheet is min(22rem, 100vw); the backdrop uses an ink wash with no blur; the chip opens its source in the panel, the outdated one first.
Reasoning   Review gates 1 and 3; a chip that names a source behaves like every other citation.
Trade-off   None found.
Validation  audit h: 352 px at 375 px; audit j: the chip on ticket 5 focuses "Chat credit refunds v3" in the panel.
```

## Step 7: bulk approval, keymap, command palette, shortcut sheet

### Bulk approval is review, then send

```
Problem     Brief 9.2 names the bulk bar "Approve 6 drafts" and also says bulk approval must never mean approving unread text; a button that says Approve but opens a preview does not name what happens (review gate 12).
Decision    In selection the bulk bar reads "Review 6 drafts". It opens a preview above the bar with each reply's first two lines and a control to take any one out; only then does the bar read "Approve & send 6 replies". A does each step, Esc steps back. The reducer refuses to send unless the preview was open, and re-checks bulk eligibility per ticket at the moment of sending.
Reasoning   The label names what happens next at each step; "the human is the product": a person reads what goes out, even in bulk.
Trade-off   Bulk approval is two key presses instead of one, and the first label departs from the brief's wording.
Validation  bulk-preview-2x.png: 6 items, nothing sent yet; bulk-take-one-out: 5 left and "Approve & send 5 replies"; desk-store.test.ts: bulkApprove without the preview opens it, and a forged selection sends only t05 and t17.
```

### One toast and one Undo for a bulk send

```
Problem     Six replies sent together have no single bubble to put Undo on (brief 9.3).
Decision    The replies share a batch. One toast under the lane track, "6 replies sent · Undo", carries the 5 s countdown and lasts as long as the window. Undo from the toast, Z or the palette takes back the whole batch and puts the selection back as it was. Each reply still commits and sends on its own; failures are counted in one notice.
Reasoning   The toast sits next to the list the rows left from; putting the selection back lets the specialist take one draft out and send again.
Trade-off   A reply in the batch cannot be undone alone from the toast.
Validation  bulk-sent-toast-2x.png; bulk-undo-with-z: Drafts back to 11, "6 selected", focus on row-t19; delivered-after-window: the toast is gone once the window closes.
```

### The command palette acts on the open conversation and teaches the keys

```
Problem     Brief 9.2 asks for ⌘K with "Go to ticket", "Escalate to…" and "Switch theme".
Decision    Ctrl K or ⌘K opens an opaque palette: the open conversation's decision, Edit draft, "Escalate to <team>" for each team with the AI's suggestion first, customer details; every lane and visible conversation; Undo the last send, theme and the shortcut sheet. Each command shows its key. A command runs after the palette has closed, so focus lands where the command puts it. Ctrl K works from text fields and closes the palette again.
Reasoning   Linear's and Slack's palette grammar; showing keys beside commands is how a palette teaches the keymap.
Trade-off   cmdk's vim bindings (Ctrl J / Ctrl K to move) are off, because Ctrl K belongs to the desk.
Validation  palette-go-to-marcus: t04 open with focus on row-t04; palette-escalate-to-privacy-2x.png: Privacy preselected and focused; palette-toggle-with-ctrl-k: closed; palette-reduced-motion: no scale.
```

### The shortcut sheet is drawn from the keymap

```
Problem     A hand-written shortcut list drifts from the keys the desk actually binds.
Decision    ? opens a sheet rendered from KEYMAP plus the keys local to the list, selection and composer; ? or Esc closes it. Dialogs let through only the key that opened them: ? for this sheet, ] for customer details.
Reasoning   One table for the listener and the sheet; a toggle key that closes what it opened is the Telegram Web and Gmail behaviour.
Trade-off   Labels must be short enough for the sheet, so the keymap carries display text.
Validation  shortcut-sheet-2x.png: 7 sections, 20 rows; shortcut-sheet-closes-with-question-mark; shortcuts.test.ts: every combination is bound once.
```

### A scrim token instead of a blurred backdrop

```
Problem     shadcn's dialog backdrop blurred the page and used a named black: backdrop-filter outside the four glass surfaces (gate 3), a colour outside the tokens (gate 1), and an ink wash would lighten Night shift instead of dimming it.
Decision    --scrim is a token per theme: ink at 16% in Day, black at 50% in Night. The palette, the shortcut sheet, dialogs and sheets all use it, with no blur.
Reasoning   A dimmed desk says "the page is behind this" without making a fifth glass surface.
Trade-off   The desk behind a dialog stays readable, which is less focusing than a blur.
Validation  palette-open-2x.png: backdrop-filter none; night-palette-2x.png.
```

## Step 8: states catalogue, quality sheet, tablet and phone, Night shift

### Every state opens from a URL and from the prototype controls

```
Problem     Brief 12: a state that is not built ships broken, and drafting, a failed draft, a colleague on the same case and a lost connection cannot be reached by clicking through fixtures.
Decision    Each is desk state with a URL parameter (draft=drafting|failed, viewer=ana, net=offline) and a switch in the prototype controls beside the send API. Offline also follows the browser's own online and offline events.
Reasoning   A capture plan opens a state by URL, as list=loading has since step 2, so every screenshot in this step regenerates from scripts/plans/make-step-8.mjs.
Trade-off   The prototype controls grew from two groups to five; they stay in the list footer and are stripped from every screenshot.
Validation  step-8 capture: 12 states in Day and in Night; desk-store.states.test.ts: 15 cases; 273 tests pass.
```

### Drafting offers Escalate only; a failed draft falls to Needs you

```
Problem     Brief 12: while the AI drafts, the bar offers only Escalate; a failed draft leaves a case with nothing to approve.
Decision    Drafting puts a typing indicator in the draft treatment where the draft will appear, and A and E say why they do nothing. A failed draft drops the violet, reads "Couldn't draft a reply. The case is ready for you to write one." with Retry drafting, and moves the case to Needs you: the row, the header glyph and the pinned card all say You, and the primary is Write a reply. Retry brings an open case back to Drafts while the new draft generates.
Reasoning   The lane follows what a person has to do, and route is never read from one channel alone (standing order 4): card, row and header agree.
Trade-off   A retried case changes lanes twice; the open conversation moves with it, so it never leaves the screen.
Validation  draft-failed-2x: Needs you 9, "Needs your decision", "Write a reply"; draft-retry-arrives: typing in Drafts, then Approve & send after 2.4 s; drafting-reduced-motion: dots hidden, "Drafting reply" shown.
```

### A colleague on the case makes a send ask once, inline

```
Problem     Brief 12: when another specialist has the ticket open, the header shows them and Approve confirms inline.
Decision    The header pill shows Ana's avatar with "Ana is viewing" (the avatar alone on a phone, the words kept for screen readers). The first send from the bar, A, the palette or the composer puts "Ana is viewing this conversation too. Send anyway?" above the bar; "Send reply anyway" or the same action again sends. Opening another conversation or the notice timing out withdraws the question, and a viewed draft stays out of bulk selection.
Reasoning   Feedback sits next to its trigger (brief 9.1), and one more key press costs less than a modal's context switch.
Trade-off   Two quick presses of A still send: it is a speed bump for a collision, not a lock.
Validation  collision-2x: question shown, no reply sent; collision-second-a-sends: next conversation open, Drafts 10; states tests: withdrawn on activate and on timeout.
```

### Offline, a reply reads Queued and sends on reconnect

```
Problem     Brief 12: offline, Approve queues and the bubble reads "Queued"; a reply labelled "Sent by you" that cannot leave the desk is untrue.
Decision    A 32 px bar under the list header reads "Offline · actions will send when you reconnect". Decisions still work. From its undo window on, an offline reply reads "Queued" with a clock in place of ticks, leaves its lane like a sent one, and sends when the desk reconnects, with one notice for the count.
Reasoning   The label names what has happened so far; WhatsApp draws a clock for a message that has not left the phone.
Trade-off   The case leaves its lane before delivery, as it does online; a send that then fails puts it back.
Validation  offline-2x: "Queued · 18:44"; offline-reconnect-sends: bar gone, "Back online. 1 queued reply is sending.", then sent.
```

### A 23rd fixture carries the long complaint

```
Problem     Brief 11 fixes 22 tickets; brief 12 asks for a 1,200-word complaint, and none of the 22 messages is that long.
Decision    Ticket 23, Harriet Okafor: an annual renewal charged after she asked to switch plans, 1,176 words, Human-led for a money decision. The bubble clamps at 12 lines measured at its rendered width, with "Show full message" and "Collapse message"; screen readers get the whole text. The 48-character name stays on ticket 21.
Reasoning   Lengthening a seed message would change one of the brief's examples; a new ticket leaves all 22 as written.
Trade-off   Needs you holds 8 instead of 7, so lane counts in the step 2 to 7 evidence are one lower than the desk today.
Validation  long-complaint-2x: 12 lines; long-complaint-expands: 86 lines; long-name-2x: truncated in the list, 2 lines in the header; tickets.test.ts: 1,150 to 1,300 words.
```

### The quality sheet pairs automation with its cost

```
Problem     Brief 13: rows rather than hero numbers, auto-resolution directly beside the reopen rate, chart colours from the ink ramp only.
Decision    The footer line opens a sheet. "Automation and its cost" holds auto-resolution and reopened-or-escalated-after-auto in one bordered block; first response, resolution time and satisfaction follow; refund and cancellation rates wait collapsed as downstream signals, not targets. Each row has today's value, the 14-day change in words, one line on what moves it, and a sparkline: a 2 px muted-ink line, today as an 8 px ink dot with a 2 px surface ring. A crosshair and the arrow keys read each day, "Show as a table" lists every value, and Mark as wrong adds to the reopen row.
Reasoning   A counter-metric in the same block cannot be screenshotted without its pair; the table view means no number is reachable only by hover.
Trade-off   The sparklines have no axes, so their scale is relative; the change in words carries the size of the trend.
Validation  quality-sheet-2x: pair [auto, reopen], 5 sparklines, one stroke colour per theme; quality-table-2x: 14 rows; quality-counts-mark-as-wrong: "4 replies marked wrong today"; /tokens: sparkline line 6.00:1 Day, 7.06:1 Night.
```

### Phone: Telegram's push, 44 px targets, safe-area padding

```
Problem     Brief 7.2 and gate 14: below 768 px the list is the root and a thread pushes over it, with 44 px targets, safe-area padding and no sideways scroll at 375 px.
Decision    The list stays mounted under the pushed thread, so Back returns to the same scroll position with focus on the row. The thread slides in from the right over 220 ms on the entrance curve, and appears in place under reduced motion. The header pill gains a back chevron and keeps the name, the route glyph and two controls; the local time and an English chip move to the details. Every button, lane tab, palette row and menu item is 44 px tall, and the dock pads with env(safe-area-inset-bottom) under viewport-fit=cover.
Reasoning   Telegram for iOS is the named convention, and keeping the list mounted is how its Back returns to the same place.
Trade-off   Back is instant rather than a slide out, and a phone header shows less at once than the desktop pill.
Validation  phone-list-2x, phone-thread-2x, phone-composer-2x, phone-bulk-preview-2x: no sideways scroll, no target under 44 px; phone-back-to-list: focus on row-t17; phone-long-name-2x: the name wraps by word.
```

### Tablet: smaller minimums, and a bar that wraps by thread width

```
Problem     Brief 7.1's 320 / 520 px minimums are for three panes: at 768 px they needed 840 px, and in a 447 px thread ticket 2's three labelled decisions overflowed the pill.
Decision    From 768 to 1279 px the list and thread keep minimums of 280 / 440 px. The decision bar reads its thread column's container width: under 36rem it docks as a card, the primary on its own row and the other decisions sharing the second, on a phone and on a narrow tablet alike.
Reasoning   The bar lives in the thread column beside a resizable list, so the column's width is the constraint, and a viewport breakpoint cannot see it.
Trade-off   From 768 to about 900 px the bar is two rows tall and covers more of the thread.
Validation  tablet-768-2x and tablet-800-2x: no overflow of the page or the bar; tablet-details-sheet-2x: details in a 351 px sheet.
```

### Night shift

```
Problem     Brief 12: every state in .dark, and every new colour pair measured.
Decision    Each state screenshot has a night- twin from the same plan. Five new pairs join /tokens: the violet Drafting prefix on the list pane and on a selected row, the typing dots on the draft wash, and the sparkline line and today's dot on the sheet.
Reasoning   Night values come from the same tokens, so a pair measured on /tokens holds wherever it is used.
Trade-off   Night doubles the evidence to regenerate; the plan does both in one run.
Validation  night-*-2x: 12 states including the quality sheet; /tokens: 47 of 47 graded pairs pass in Day and in Night, the new pairs 5.08 to 17.78:1.
```

### Review gate (brief 18), scored at the end of step 8

```
1   Pass     No hex, HSL, RGB or arbitrary colour utility in app, components, lib or data (grep).
2   Pass     /tokens: 47 of 47 graded pairs at or above their minimum in Day and in Night; tokens-contrast-2x.png.
3   Pass     backdrop-filter appears only in components/glass/Glass.tsx, on thread-header, decision-bar, lane-track and bulk-bar.
4   Pass     reduced-transparency-2x and night-: all four glass surfaces report backdrop none and an opaque tint, in Day and in Night.
5   Pass     drafting-reduced-motion: dots hidden, words shown; the phone push translates by 100% × --motion, which is 0 under reduced motion.
6   Pass     greyscale-*-2x (list, t02 decision, drafting, draft failed, collision with offline, quality sheet): route reads by glyph shape and every state by a word.
7   Pass     draft-vs-sent-25pct and drafting-vs-sent-25pct: the draft and the drafting slot stay distinct from sent bubbles at 25%.
8   Pass     route.test.ts: a hard rule forces human_led at confidence sure.
9   Pass     decision.test.ts, tickets.test.ts: t02, t03, t04, t06, t09 and t13 refuse A in every state and bulk selection; drafting and viewed drafts are also held out of bulk.
10  Pass     recheck-keyboard-A-Z-A: A opens t21 with focus on its row, Z restores t17 and its draft, A again sends. recheck-bar-fits and recheck-panel-fits sweeps: 23 of 23 tickets, no overflow.
11  Pass     J/K selection and the 120 ms thread swap did not change in step 8.
12  Pass     New labels: Retry drafting, Send reply anyway, Show full message, Collapse message, Show as a table, Show sparklines, Show downstream signals, Open the quality view, Back to conversations, Write a reply.
13  Pass     Every state in brief 12 has a Day and a Night screenshot in docs/evidence/step-8.
14  Pass     phone-*-2x at 375 px: no target under 44 px, no sideways scroll; the dock pads with env(safe-area-inset-bottom).
15  Pass     sources-disagree-2x and stale-source-2x: flags in the pinned card, rows in the panel.
16  Pass     quality-sheet-2x: auto-resolution and reopen share one block.
17  Partial  axe-core on 10 inbox views (Day, Night, drafting, draft failed, collision with offline, long content, quality sheet, tablet, phone list, phone thread): 0 serious or critical. On /tokens axe flags the "Aa" specimens of the pairs shown for information only. Lighthouse is not installed and was not run.
18  Pass     Banned-word grep: three uses fixed in step 8; "smooth" remains only as the scroll-behavior value it names.
```
