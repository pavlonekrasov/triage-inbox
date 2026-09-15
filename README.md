# Care Desk · concept

A clickable, high-fidelity prototype of a triage inbox for an AI support agent. The AI classifies,
checks the account, retrieves policy, assesses risk and routes each request; the specialist decides.
Fixtures stand in for the agent, typed as the `TriageResult` contract in [lib/types.ts](lib/types.ts).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Route | What it is |
|---|---|
| `/` | The inbox |
| `/tokens` | Colour roles in Day and Night shift with contrast measured in the browser, glass, type scale |
| `/slides/flow` | Six-stage ticket flow, using Jordan's fixture and the real routing rules |
| `/slides/cases` | Emma, Jordan and Camille in independent, interactive mobile desks |
| `/slides/safeguards` | Marcus's evidence beside Camille's escalation form |

The URL keeps the view, so a link reopens it: `/?lane=drafts&ticket=t07`. Add `&list=loading` or
`&list=empty` for those list states, `&draft=drafting` or `&draft=failed` for the opened conversation's
AI draft, `&viewer=ana` for a colleague viewing it, and `&net=offline` for the offline desk. The
prototype controls button at the right of the list footer switches the same states.

Below 1280 px the customer details open as a sheet; below 768 px the desk is a phone layout, where the
list is the first screen and a conversation slides in over it with a back chevron.

## Use it

| Key | Action |
|---|---|
| `J` / `K` | Next / previous conversation |
| `↓` / `↑`, `Home` / `End` | Move within the focused list |
| `1` `2` `3` | Needs you · Drafts · Auto-resolved |
| `A` | Approve & send the open draft (drafts routed for approval only; anywhere else it says why) |
| `E` | Edit the open draft in the composer; `Ctrl`/`⌘` + `Enter` sends, `Esc` discards |
| `H` | Escalate the case to a team |
| `Z` | Undo the last send, within 5 seconds |
| `]` | Show or hide customer details (a sheet below 1280 px) |
| `X` | Select or unselect the focused draft (Drafts only) |
| `⇧X` | Select every low-risk Sure draft |
| `A` in selection | Review the selected drafts; `A` again approves and sends them, with one Undo |
| `Esc` | Close the preview, then exit selection |
| `Ctrl` `K` / `⌘K` | Command palette: go to a conversation or lane, decide, escalate to a team, switch theme |
| `?` | Keyboard shortcuts |

The prototype controls in the list footer also set the fake send API to succeed, fail 1 in 20, or
fail every send, so the "Not sent · Retry" state is real, and take the desk offline, where replies
queue and send on reconnect. The browser's own offline and online events do the same.

The footer line "Today 68% auto · 1m 40s first response · 2.1% reopened" opens the quality sheet:
each metric with today's value, a 14-day sparkline and what moves it, with auto-resolution beside its
reopen rate. "Mark as wrong" on an automatic reply counts in it.

The customer details panel shows what the agent read: customer, subscription, billing timeline, sources
used, the advisor session on conduct reports, and previous contacts. The evidence flags on the summary
card and the source citations under "Why this route" open their row in the panel. Revealing a masked
email is logged in the thread.

## Delivery status

| Step | Scope | State |
|---|---|---|
| 1 | Token page | Done |
| 2 | List pane: lanes, rows, row states | Done |
| 3 | Thread: header pill, bubbles, service messages, draft bubble | Done |
| 4 | Pinned summary, both reading depths | Done |
| 5 | Decision bar: Approve with undo, Edit, Escalate | Done |
| 6 | Context panel | Done |
| 7 | Bulk approve, full keymap, command palette, shortcut sheet | Done |
| 8 | States catalogue, quality sheet, tablet and phone, Night shift, review gate | Done |
| 9 | Slide routes | Done |
| 10 | Slide screenshots | Done |

## Checks

```bash
npm test          # routing matrix, fixtures, accounts, decisions, rewrites, desk reducer
npm run typecheck
npm run lint
npm run build
npm run check:browser       # axe in Day/Night, sidebar motion and reduced motion
npm run audit:accessibility # Lighthouse accessibility in Day/Night
npm run capture:slides     # 12 final PNG exports, 1440 × 900 at 2×
node scripts/plans/make-step-8.mjs && node scripts/capture.mjs scripts/plans/step-8.json   # evidence screenshots, needs the dev server
```

Browser checks and captures need a running server and Chromium (Edge is detected on Windows).
Set `BROWSER_PATH` to use another Chromium executable and `CAPTURE_BASE_URL` to change the server
for the slide, review and Lighthouse scripts. Final images live in [docs/evidence/slides](docs/evidence/slides).
The slide routes use fixed 1440 × 900 canvases; the theme toggle or `?theme=night` switches their appearance.
The case presentation reuses the actual thread, summary, reply and decision components, omitting processing
logs and previewing one refund variant at a time. Choosing a preview does not send a reply.

Customer details now opens and closes over the existing 220 ms timing, remembers its resized width,
and returns focus to the toggle on close. Section bodies expand with their chevrons; reduced motion
disables these transitions. Normal resizing and conversation switching retain their direct response.

Design context lives in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md); every departure from
the brief is argued in [docs/rationale.md](docs/rationale.md), and screenshots are in
[docs/evidence](docs/evidence).
