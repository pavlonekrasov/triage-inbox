// Generates scripts/plans/step-7.json. Written as code so in-page expressions need no JSON escaping.
import { writeFileSync } from "node:fs";

const OUT = "docs/evidence/step-7";
const base = "http://localhost:3000";
const ready = "!document.querySelector('[data-ssr]') && document.querySelector('main')";
const strip = "document.querySelector('nextjs-portal')?.remove(); document.querySelector('[data-prototype-controls]')?.remove()";
const wait = (ms) => `new Promise(r => setTimeout(r, ${ms}))`;
const active =
  "(() => { const a = document.activeElement; return a === document.body ? 'body' : (a.id || a.getAttribute('aria-label') || a.tagName); })()";
const draftsCount = "document.querySelector('[data-lane-tab=drafts]').innerText.replace(/[^0-9]/g, '')";
const listNotice = "(document.querySelector('[data-list-pane] [role=status]')?.innerText ?? '').split(String.fromCharCode(10)).join(' ')";

const shot = (name, url, extra) => ({
  name,
  url: base + url,
  width: 1440,
  height: 900,
  scale: 1,
  waitFor: ready,
  actions: [strip],
  ...extra,
});

const plan = [
  shot("bulk-selected-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    keys: ["Shift+X"],
    waitMs: 400,
    out: `${OUT}/bulk-selected-2x.png`,
    selector: "[data-list-pane]",
    eval: `({ glass: [...document.querySelectorAll('[data-glass]')].map(e => e.dataset.glass), header: document.querySelector('[data-list-pane] header').innerText, bar: document.querySelector('[data-glass=bulk-bar]').innerText.split(String.fromCharCode(10)).join(' '), barOverflow: (() => { const b = document.querySelector('[data-glass=bulk-bar]'); return b.scrollWidth > b.clientWidth + 1; })() })`,
  }),
  shot("bulk-preview-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    keys: ["Shift+X", "a"],
    waitMs: 500,
    out: `${OUT}/bulk-preview-2x.png`,
    selector: "[data-list-pane]",
    eval: `({ sentYet: document.querySelectorAll('[data-reply]').length, previewItems: [...document.querySelectorAll('[data-preview-item]')].map(e => e.dataset.previewItem), everyItemHasText: [...document.querySelectorAll('[data-preview-item]')].every(e => e.querySelector('p + p')?.innerText.length > 20), send: document.querySelector('[data-bulk-send]')?.innerText.split(String.fromCharCode(10)).join(' '), barOverflow: (() => { const b = document.querySelector('[data-glass=bulk-bar]'); return b.scrollWidth > b.clientWidth + 1; })() })`,
  }),
  shot("bulk-take-one-out", "/?lane=drafts&ticket=t17", {
    keys: ["Shift+X", "a"],
    actions: [strip],
    waitMs: 400,
    eval: `(async () => { document.querySelector('[data-preview-item] button').click(); await ${wait(300)}; return { left: document.querySelectorAll('[data-preview-item]').length, send: document.querySelector('[data-bulk-send]')?.innerText.split(String.fromCharCode(10)).join(' ') }; })()`,
  }),
  shot("bulk-sent-toast-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    keys: ["Shift+X", "a", "a"],
    waitMs: 600,
    out: `${OUT}/bulk-sent-toast-2x.png`,
    selector: "[data-list-pane]",
    eval: `({ notice: ${listNotice}, drafts: ${draftsCount}, selectionClosed: !document.querySelector('[data-glass=bulk-bar]'), focus: ${active}, pillAboveBar: !!document.querySelector('[data-dock]')?.innerText.includes('Sent to') })`,
  }),
  shot("bulk-undo-with-z", "/?lane=drafts&ticket=t17", {
    keys: ["Shift+X", "a", "a", "z"],
    waitMs: 500,
    eval: `({ drafts: ${draftsCount}, header: document.querySelector('[data-list-pane] header').innerText, focus: ${active} })`,
  }),
  shot("bulk-delivered-after-window", "/?lane=drafts&ticket=t17", {
    keys: ["Shift+X", "a", "a"],
    // The capture waits before key presses, so the window is waited out inside the expression.
    eval: `(async () => { await ${wait(5600)}; return { drafts: ${draftsCount}, notice: ${listNotice}, delivered: [...document.querySelectorAll('[data-list-pane] [role=option]')].length }; })()`,
  }),
  shot("bulk-escape-steps-back", "/?lane=drafts&ticket=t17", {
    keys: ["Shift+X", "a", "Escape"],
    waitMs: 400,
    eval: `({ previewOpen: document.querySelector('[data-bulk-preview]')?.closest('[data-open]')?.dataset.open, stillSelecting: !!document.querySelector('[data-glass=bulk-bar]') })`,
  }),
  shot("select-refused-in-needs-you", "/?lane=needs_you&ticket=t02", {
    keys: ["x"],
    waitMs: 300,
    eval: `({ notice: ${listNotice}, selecting: !!document.querySelector('[data-glass=bulk-bar]') })`,
  }),
  shot("palette-open-2x", "/?lane=needs_you&ticket=t04", {
    scale: 2,
    keys: ["Control+K"],
    waitMs: 500,
    out: `${OUT}/palette-open-2x.png`,
    eval: `({ open: !!document.querySelector('[data-command-palette]'), focus: document.activeElement.getAttribute('cmdk-input') !== null, groups: [...document.querySelectorAll('[cmdk-group-heading]')].map(e => e.innerText), backdropFilter: getComputedStyle(document.querySelector('[data-command-palette]')).backdropFilter })`,
  }),
  shot("palette-go-to-marcus", "/?lane=drafts&ticket=t17", {
    keys: ["Control+K", "m", "a", "r", "c", "u", "s", "Enter"],
    waitMs: 600,
    eval: `({ ticket: new URLSearchParams(location.search).get('ticket'), lane: new URLSearchParams(location.search).get('lane'), focus: ${active}, paletteClosed: !document.querySelector('[data-command-palette]') })`,
  }),
  shot("palette-escalate-to-privacy-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    keys: ["Control+K", "p", "r", "i", "v", "a", "c", "y", "Enter"],
    waitMs: 700,
    out: `${OUT}/palette-escalate-to-privacy-2x.png`,
    eval: `({ popover: !!document.querySelector('[data-escalate-popover]'), checkedTeam: document.querySelector('[data-escalate-popover] input[type=radio]:checked')?.value, focus: document.activeElement.value ?? ${active} })`,
  }),
  shot("palette-toggle-with-ctrl-k", "/?lane=needs_you&ticket=t04", {
    keys: ["Control+K", "Control+K"],
    eval: `(async () => { await ${wait(600)}; return { open: !!document.querySelector('[data-command-palette]') }; })()`,
  }),
  shot("palette-reduced-motion", "/?lane=needs_you&ticket=t04", {
    media: { "prefers-reduced-motion": "reduce" },
    keys: ["Control+K"],
    waitMs: 20,
    eval: `(() => { const p = document.querySelector('[data-command-palette]'); return { scale: getComputedStyle(p).scale }; })()`,
  }),
  shot("shortcut-sheet-2x", "/?lane=needs_you&ticket=t04", {
    scale: 2,
    keys: ["Shift+?"],
    waitMs: 500,
    out: `${OUT}/shortcut-sheet-2x.png`,
    eval: `({ open: !!document.querySelector('[data-shortcut-sheet]'), sections: [...document.querySelectorAll('[data-shortcut-sheet] h3')].map(e => e.innerText), rows: document.querySelectorAll('[data-shortcut-sheet] dt').length })`,
  }),
  shot("shortcut-sheet-closes-with-question-mark", "/?lane=needs_you&ticket=t04", {
    keys: ["Shift+?", "Shift+?"],
    eval: `(async () => { await ${wait(600)}; return { open: !!document.querySelector('[data-shortcut-sheet]') }; })()`,
  }),
  shot("night-palette-2x", "/?lane=needs_you&ticket=t02", {
    scale: 2,
    theme: "night",
    keys: ["Control+K"],
    waitMs: 500,
    out: `${OUT}/night-palette-2x.png`,
  }),
  shot("night-bulk-preview-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    theme: "night",
    keys: ["Shift+X", "a"],
    waitMs: 500,
    out: `${OUT}/night-bulk-preview-2x.png`,
    selector: "[data-list-pane]",
  }),
];

writeFileSync("scripts/plans/step-7.json", `${JSON.stringify(plan, null, 2)}\n`);
console.log(`wrote ${plan.length} shots`);
