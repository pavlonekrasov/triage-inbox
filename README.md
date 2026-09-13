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

The URL keeps the view, so a link reopens it: `/?lane=drafts&ticket=t07`. Add `&list=loading` or
`&list=empty` for those list states, or use the prototype controls button at the right of the list footer.

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
| `X` | Select or unselect the focused draft (Drafts only) |
| `⇧X` | Select every low-risk Sure draft |
| `Esc` | Exit selection |

The prototype controls in the list footer also set the fake send API to succeed, fail 1 in 20, or
fail every send, so the "Not sent · Retry" state is real.

## Delivery status

| Step | Scope | State |
|---|---|---|
| 1 | Token page | Done |
| 2 | List pane: lanes, rows, row states | Done |
| 3 | Thread: header pill, bubbles, service messages, draft bubble | Done |
| 4 | Pinned summary, both reading depths | Done |
| 5 | Decision bar: Approve with undo, Edit, Escalate | Done |
| 6 | Context panel | Next |
| 7 | Bulk approve, full keymap, command palette, shortcut sheet | |
| 8 | States catalogue, responsive, Night shift pass | |
| 9 | Slide routes | |
| 10 | Slide screenshots | |

## Checks

```bash
npm test          # routing matrix, fixtures, decisions, rewrites, desk reducer
npm run typecheck
npm run lint
node scripts/capture.mjs scripts/plans/step-5.json   # evidence screenshots, needs the dev server
```

Design context lives in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md); every departure from
the brief is argued in [docs/rationale.md](docs/rationale.md), and screenshots are in
[docs/evidence](docs/evidence).
