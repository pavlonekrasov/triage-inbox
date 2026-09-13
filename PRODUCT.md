# Product

## Register

product

## Users

Nebula support specialists working an 8-hour shift through a queue of 150 to 400 conversations, on a laptop or an external monitor. The shift covers US hours from Europe, so half of it happens in a lit office by day and half at home after dark. They skim fast and read carefully only where money or wellbeing is involved. They are accountable for every message sent in Nebula's name.

Every screen answers four questions: what happened, how risky is it, what has the AI already done, and what do you need from me. The specialist should be able to decide whether to accept the AI's work in about three seconds, and verify why in about thirty.

Nebula is OBRIO's spiritual guidance app: horoscopes, tarot, birth charts, live chat with psychic advisors. Customers often write about money, relationships or distress, and public complaints cluster around unexpected charges and refused refunds, so billing and refund cases are the highest-stakes screens.

## Product Purpose

Care Desk is the control surface of an AI support triage agent. Each incoming request is understood, enriched with account and policy context, risk-assessed, and routed to one of three automation levels:

- **Auto-send**: low risk, high confidence, no hard rule hit. The reply is sent and sampled for spot-checks.
- **Approve draft**: medium risk, or low risk with any doubt. A drafted reply waits for Approve, Edit or Escalate.
- **Human-led**: high risk or any hard rule (money decision, safety complaint, privacy, wellbeing, conflicting data). The AI prepares the case; the human decides.

Thesis: AI handles repetitive processing. Humans handle judgment. The interface exists so a person can trust, inspect and control the AI instead of accepting its output blindly.

Success means: someone fluent in Telegram, WhatsApp, Linear or Front acts within ten seconds without a tour; no draft is ever sent by accident; the auto-resolution rate is always read next to the reopen rate that checks it.

This build is a clickable high-fidelity prototype for a five-slide proposal, presented unbranded as "Care Desk · concept". There are no live model calls; typed fixtures in the shape of the agent's output stand in for it.

## Brand Personality

Grounded, warm, exact.

The voice follows Nebula's public support register ("Turn doubt into clarity") without the consumer app's mysticism: first name, one sentence of acknowledgment, the fact, the action, the next step. It never promises a spiritual outcome and never blames the customer. Emotional states are named in words, not flashed in colour. Low visual noise is a functional requirement: people sit in this tool for eight hours, often reading about distress.

References, and the specific thing taken from each:

- **Telegram and WhatsApp**: the chat list row, folder chips, service-message pills, edit-mode multi-select with a floating bar, the "Editing" composer strip.
- **Linear inbox**: a dense list that stays quiet at 13px, with status glyphs instead of coloured pills.
- **Front and Gorgias**: timeline events inline between messages, and "Resolved · Undo".
- **Co–Star**: monochrome editorial restraint. **Noom**: soft forms and generous line height.
- **bencho.dev**: component craft. Surfaces separate by tonal steps instead of borders, nested radii stay concentric, and controls answer a press with a physical response.

## Anti-references

- **The astrology category reflex**: saturated purple on a cosmic dark gradient, stars, glow, crystal balls (Moonly, Tolan). It sells mystery in the consumer app and costs clarity in a support tool.
- **The "AI dashboard"**: KPI hero numbers, chart walls, gradient cards on the home screen.
- **AI hidden behind a click**: Gorgias's summary popover, Featurebase's empty Copilot panel, Front's floating draft window. None of them shows route, risk, confidence and evidence together at the moment of decision.
- **Alarm styling**: red "HIGH RISK" banners, colour-only status, percentages such as 97.4% in the scan path.
- **Glassmorphism as a default material** on content.

## Design Principles

1. **The human is the product.** Every element answers what happened, how risky it is, what the AI already did, or what it needs from the specialist. An element that answers none of these is deleted.
2. **Familiar beats clever.** Messaging and helpdesk conventions are reused on purpose and given a triage meaning. Strangeness is allowed only where it carries meaning a convention cannot.
3. **Risk is never decoration.** Route and risk speak through shape, label and position first, colour second.
4. **Machine work looks unapproved until a human approves it.** A draft and a sent reply are distinguishable at thumbnail size, because sending a draft by accident is the costliest error in this tool.
5. **Frequency decides motion.** What happens hundreds of times a shift is instant; what happens rarely may move.

## Accessibility & Inclusion

- WCAG 2.2 AA in both Day and Night shift: text at 4.5:1, glyphs and the focus ring at 3:1, measured in the browser.
- Keyboard first, pointer equal, screen reader complete. Every decision has a key, and a disabled shortcut explains itself instead of failing silently.
- Routes are shape-coded so they survive colour blindness and greyscale print.
- `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast: more` each have a defined path in the token layer.
- Touch targets of at least 44 × 44 px on mobile, with safe-area padding.
- Lighthouse accessibility of at least 95 and zero serious axe issues on the inbox.
