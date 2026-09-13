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
`&list=empty` for those list states, or use **Show prototype controls** at the bottom right.

## Use it

| Key | Action |
|---|---|
| `J` / `K` | Next / previous conversation |
| `↓` / `↑`, `Home` / `End` | Move within the focused list |
| `1` `2` `3` | Needs you · Drafts · Auto-resolved |
| `X` | Select or unselect the focused draft (Drafts only) |
| `⇧X` | Select every low-risk Sure draft |
| `Esc` | Exit selection |

## Delivery status

| Step | Scope | State |
|---|---|---|
| 1 | Token page | Done |
| 2 | List pane: lanes, rows, row states | Done |
| 3 | Thread: header pill, bubbles, service messages, draft bubble | Next |
| 4 | Pinned summary, both reading depths | |
| 5 | Decision bar: Approve with undo, Edit, Escalate | |
| 6 | Context panel | |
| 7 | Bulk approve, full keymap, command palette, shortcut sheet | |
| 8 | States catalogue, responsive, Night shift pass | |
| 9 | Slide routes | |
| 10 | Slide screenshots | |

## Checks

```bash
npm test          # routing matrix and fixture contract
npm run typecheck
npm run lint
node scripts/capture.mjs scripts/plans/step-2.json   # evidence screenshots, needs the dev server
```

Design context lives in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md); every departure from
the brief is argued in [docs/rationale.md](docs/rationale.md), and screenshots are in
[docs/evidence](docs/evidence).
