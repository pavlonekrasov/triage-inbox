// Generates scripts/plans/step-8.json. Written as code so in-page expressions need no JSON escaping.
// Step 8: the states catalogue (brief 12), the quality sheet (13), tablet and phone (7.2), Night shift.
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "docs/evidence/step-8";
const base = "http://localhost:3000";
const ready = "!document.querySelector('[data-ssr]') && document.querySelector('main, [data-list-pane]')";
const strip = "document.querySelector('nextjs-portal')?.remove(); document.querySelector('[data-prototype-controls]')?.remove()";
const wait = (ms) => `new Promise(r => setTimeout(r, ${ms}))`;
const oneLine = (expr) => `(${expr} ?? '').split(String.fromCharCode(10)).join(' ')`;
const overflowX = "document.documentElement.scrollWidth > innerWidth";
/** Visible interactive elements smaller than 44 × 44 px (review gate 14). */
const smallTargets =
  "[...document.querySelectorAll('button, [role=tab], [role=option], a[href], [tabindex=\"0\"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && (r.width < 44 || r.height < 44); }).map((e) => (e.getAttribute('aria-label') || e.innerText || e.tagName).trim().slice(0, 32))";

const shot = (name, url, extra = {}) => ({
  name,
  url: base + url,
  width: 1440,
  height: 900,
  scale: 1,
  waitFor: ready,
  actions: [strip],
  ...extra,
});

/** The same shot in Day and in Night shift (brief 12: "every state above in .dark"). */
const dayAndNight = (name, url, extra = {}) => [
  shot(`${name}-2x`, url, { scale: 2, out: `${OUT}/${name}-2x.png`, ...extra }),
  shot(`night-${name}-2x`, url, { scale: 2, theme: "night", out: `${OUT}/night-${name}-2x.png`, ...extra }),
];

const phone = (name, url, extra = {}) => shot(name, url, { width: 375, height: 812, mobile: true, ...extra });

const openControls = "document.querySelector('[data-prototype-controls] button').click()";
const chooseControl = (label) =>
  `[...document.querySelectorAll('[data-prototype-controls] label')].find((l) => l.innerText.includes(${JSON.stringify(label)})).querySelector('input').click()`;
const click = (selector) => `document.querySelector(${JSON.stringify(selector)}).click()`;
const clickText = (text) => `[...document.querySelectorAll('button')].find((b) => b.innerText.includes(${JSON.stringify(text)})).click()`;

const barButtons = "[...(document.querySelector('[data-glass=decision-bar]')?.querySelectorAll('button') ?? [])].map((b) => b.innerText.trim())";

/** An earlier step's checks, re-run by name on today's desk, so they also cover ticket 23 and the new states. */
const reuse = (step, names) =>
  JSON.parse(readFileSync(`scripts/plans/${step}.json`, "utf8"))
    .filter((s) => names.includes(s.name))
    .map((s) => ({ ...s, name: `recheck-${s.name}`, out: undefined }));

const greyscale = "document.documentElement.style.filter = 'grayscale(1)'";

const plan = [
  /* 8a · States catalogue (brief 12) */
  ...dayAndNight("lane-empty", "/?lane=needs_you&list=empty", {
    selector: "[data-list-pane]",
    eval: `({ title: document.querySelector('[data-list-pane] h2')?.innerText, body: document.querySelector('[data-list-pane] h2 + p')?.innerText, action: ${oneLine("[...document.querySelectorAll('[data-list-pane] button')].find((b) => b.innerText.includes('spot-checks'))?.innerText")} })`,
  }),
  ...dayAndNight("loading", "/?lane=needs_you&list=loading", {
    selector: "[data-list-pane]",
    eval: "({ rowHeights: [...new Set([...document.querySelectorAll('#lane-panel *')].map((e) => Math.round(e.getBoundingClientRect().height)).filter((h) => h >= 60 && h <= 80))], spinner: !!document.querySelector('.animate-spin, [role=progressbar]'), busy: document.querySelector('#lane-panel')?.getAttribute('aria-busy') })",
  }),
  ...dayAndNight("drafting", "/?lane=drafts&ticket=t17&draft=drafting", {
    waitMs: 600,
    eval: `({ typing: !!document.querySelector('[data-drafting]'), dots: getComputedStyle(document.querySelector('[data-drafting] .animate-typing-dot')).animationName, draft: !!document.querySelector('[data-draft]'), bar: ${barButtons}, row: ${oneLine("document.querySelector('#row-t17 .truncate + span, #row-t17 span.truncate:last-of-type')?.innerText")} })`,
  }),
  shot("drafting-reduced-motion", "/?lane=drafts&ticket=t17&draft=drafting", {
    media: { "prefers-reduced-motion": "reduce" },
    eval: "(() => { const bubble = document.querySelector('[data-drafting] [role=status]'); const dots = bubble.querySelector('.animate-typing-dot').parentElement; const words = [...bubble.querySelectorAll('span')].find((s) => s.innerText === 'Drafting reply'); return { dotsShown: getComputedStyle(dots).display !== 'none', wordsShown: !!words && getComputedStyle(words).display !== 'none' }; })()",
  }),
  shot("drafting-refuses-a", "/?lane=drafts&ticket=t17&draft=drafting", {
    keys: ["a", "e"],
    eval: `({ notice: ${oneLine("document.querySelector('[data-dock] [role=status]')?.innerText")}, composer: !!document.querySelector('[data-composer]'), replies: document.querySelectorAll('[data-reply]').length })`,
  }),
  ...dayAndNight("draft-failed", "/?lane=drafts&ticket=t17&draft=failed", {
    waitMs: 600,
    eval: `({ lane: ${oneLine("document.querySelector('[role=tab][aria-selected=true]')?.innerText")}, inNeedsYou: !!document.querySelector('#row-t17'), bubble: ${oneLine("document.querySelector('[data-draft-failed]')?.innerText")}, primary: document.querySelector('[data-primary]')?.innerText, route: ${oneLine("document.querySelector('[data-glass=thread-header]')?.innerText")} })`,
  }),
  shot("draft-retry-arrives", "/?lane=drafts&ticket=t17&draft=failed", {
    actions: [strip, clickText("Retry drafting")],
    eval: `(async () => { const during = { typing: !!document.querySelector('[data-drafting]'), lane: ${oneLine("document.querySelector('[role=tab][aria-selected=true]')?.innerText")} }; await ${wait(2800)}; return { during, after: { draft: !!document.querySelector('[data-draft]'), primary: document.querySelector('[data-primary]')?.innerText } }; })()`,
  }),
  ...dayAndNight("send-failed", "/?lane=drafts&ticket=t17", {
    actions: [openControls, chooseControl("Fail every send"), strip],
    keys: ["a"],
    eval: `(async () => { await ${wait(6800)}; document.querySelector('#row-t17').click(); await ${wait(500)}; return { status: ${oneLine("document.querySelector('[data-reply]')?.querySelector('p')?.innerText")}, inDrafts: !!document.querySelector('#row-t17'), primary: document.querySelector('[data-primary]')?.innerText }; })()`,
  }),
  ...dayAndNight("sources-disagree", "/?lane=needs_you&ticket=t04", {
    eval: "({ panel: document.querySelector('[data-context-panel]')?.innerText.includes('Sources disagree'), restricted: document.querySelector('[data-context-panel]')?.innerText.includes('Restricted') })",
  }),
  ...dayAndNight("stale-source", "/?lane=drafts&ticket=t05", {
    eval: "({ panel: document.querySelector('[data-context-panel]')?.innerText.match(/Newer version[^\\n]*/)?.[0], chip: !!document.querySelector('[data-draft]')?.parentElement?.innerText.includes('outdated') })",
  }),
  ...dayAndNight("collision", "/?lane=drafts&ticket=t17&viewer=ana", {
    keys: ["a"],
    waitMs: 500,
    eval: `({ viewer: ${oneLine("document.querySelector('[data-viewer]')?.innerText")}, notice: ${oneLine("document.querySelector('[data-dock] [role=status]')?.innerText")}, sentYet: document.querySelectorAll('[data-reply]').length })`,
  }),
  shot("collision-second-a-sends", "/?lane=drafts&ticket=t17&viewer=ana", {
    keys: ["a", "a"],
    eval: "({ open: new URLSearchParams(location.search).get('ticket'), drafts: document.querySelector('[data-lane-tab=drafts]').innerText.replace(/[^0-9]/g, '') })",
  }),
  // A follow-up on an auto-resolved case stays on screen, so its queued bubble can be seen.
  ...dayAndNight("offline", "/?lane=auto_resolved&ticket=t01&net=offline", {
    actions: [strip, "document.querySelector('[data-primary]').click()"],
    keys: ["t", "h", "a", "n", "k", "s", "Control+Enter"],
    eval: `(async () => { await ${wait(5800)}; return { bar: ${oneLine("document.querySelector('[data-offline]')?.innerText")}, status: ${oneLine("[...document.querySelectorAll('[data-reply]')].at(-1)?.querySelector('p')?.innerText")} }; })()`,
  }),
  shot("offline-reconnect-sends", "/?lane=auto_resolved&ticket=t01&net=offline", {
    actions: [strip, "document.querySelector('[data-primary]').click()"],
    keys: ["t", "h", "a", "n", "k", "s", "Control+Enter"],
    eval: `(async () => { await ${wait(5800)}; window.dispatchEvent(new Event('online')); await ${wait(1200)}; return { bar: !!document.querySelector('[data-offline]'), notice: ${oneLine("document.querySelector('[data-list-pane] [role=status] p')?.innerText")}, status: [...document.querySelectorAll('[data-reply]')].at(-1)?.dataset.reply }; })()`,
  }),
  ...dayAndNight("long-complaint", "/?lane=needs_you&ticket=t23", {
    eval: "(() => { const li = document.querySelector('[data-long]'); li.scrollIntoView({ block: 'center' }); const p = li.querySelector('p[lang]'); return { lines: Math.round(p.clientHeight / parseFloat(getComputedStyle(p).lineHeight)), words: p.textContent.split(/\\s+/).length, toggle: li.querySelector('button')?.innerText }; })()",
  }),
  shot("long-complaint-expands", "/?lane=needs_you&ticket=t23", {
    actions: [strip, clickText("Show full message")],
    eval: "(() => { const p = document.querySelector('[data-long] p[lang]'); return { lines: Math.round(p.clientHeight / parseFloat(getComputedStyle(p).lineHeight)), toggle: document.querySelector('[data-long] button')?.innerText, expanded: document.querySelector('[data-long] button')?.getAttribute('aria-expanded') }; })()",
  }),
  ...dayAndNight("long-name", "/?lane=drafts&ticket=t21", {
    eval: "({ listTruncated: (() => { const s = document.querySelector('#row-t21 span.truncate'); return s.scrollWidth > s.clientWidth; })(), headerLines: (() => { const h = document.querySelector('[data-glass=thread-header] h2'); return Math.round(h.clientHeight / parseFloat(getComputedStyle(h).lineHeight)); })() })",
  }),

  /* 8b · Quality sheet (brief 13) */
  ...dayAndNight("quality-sheet", "/?lane=needs_you&ticket=t02", {
    actions: [strip, click("[data-quality-trigger]")],
    waitMs: 400,
    selector: "[data-quality-sheet]",
    eval: "(() => { const sheet = document.querySelector('[data-quality-sheet]'); const lines = [...sheet.querySelectorAll('polyline')]; return { pair: [...sheet.querySelectorAll('[data-quality-pair] [data-metric]')].map((e) => e.dataset.metric), rows: [...sheet.querySelectorAll('[data-metric]')].map((e) => e.dataset.metric), sparklines: lines.length, strokes: [...new Set(lines.map((l) => getComputedStyle(l).stroke))], mutedInk: getComputedStyle(sheet).color, clippedValues: [...sheet.querySelectorAll('.text-heading')].some((v) => v.scrollWidth > v.clientWidth) }; })()",
  }),
  shot("quality-sparkline-hover-2x", "/?lane=needs_you&ticket=t02", {
    scale: 2,
    actions: [strip, click("[data-quality-trigger]")],
    hover: "[data-metric=auto] svg",
    selector: "[data-metric=auto]",
    out: `${OUT}/quality-sparkline-hover-2x.png`,
    eval: "({ tooltip: [...document.querySelectorAll('[data-metric=auto] span[aria-hidden]')].map((s) => s.innerText).filter(Boolean), crosshair: !!document.querySelector('[data-metric=auto] svg line') })",
  }),
  shot("quality-table-2x", "/?lane=needs_you&ticket=t02", {
    scale: 2,
    actions: [strip, click("[data-quality-trigger]"), clickText("Show as a table")],
    selector: "[data-quality-sheet]",
    out: `${OUT}/quality-table-2x.png`,
    eval: "({ rows: document.querySelectorAll('[data-quality-sheet] tbody tr').length, columns: document.querySelectorAll('[data-quality-sheet] thead th').length })",
  }),
  shot("quality-counts-mark-as-wrong", "/?lane=auto_resolved&ticket=t01", {
    actions: [strip, clickText("Mark as wrong"), click("[data-quality-trigger]")],
    eval: "document.querySelector('[data-metric=reopen]')?.innerText.match(/\\d+ repl\\w+ marked wrong today/)?.[0]",
  }),

  /* 8c · Tablet (768 to 1279 px) and phone (under 768 px), brief 7.2 */
  ...[
    [1024, 768],
    [800, 900],
    [768, 1024],
  ].map(([width, height]) =>
    shot(`tablet-${width}-2x`, "/?lane=needs_you&ticket=t02", {
      width,
      height,
      scale: 2,
      out: `${OUT}/tablet-${width}-2x.png`,
      eval: `({ width: innerWidth, overflowX: ${overflowX}, list: Math.round(document.querySelector('[data-list-pane]').getBoundingClientRect().width), thread: Math.round(document.querySelector('main').getBoundingClientRect().width), panelOpen: !!document.querySelector('[data-context-panel]'), barOverflow: (() => { const b = document.querySelector('[data-glass=decision-bar]'); return b.scrollWidth > b.clientWidth + 1; })() })`,
    }),
  ),
  shot("tablet-details-sheet-2x", "/?lane=needs_you&ticket=t04", {
    width: 1024,
    height: 768,
    scale: 2,
    keys: ["]"],
    waitMs: 400,
    out: `${OUT}/tablet-details-sheet-2x.png`,
    eval: "({ sheet: !!document.querySelector('[data-context-panel]'), width: Math.round(document.querySelector('[data-context-panel]')?.getBoundingClientRect().width ?? 0) })",
  }),
  phone("phone-list-2x", "/?lane=needs_you", {
    scale: 2,
    out: `${OUT}/phone-list-2x.png`,
    eval: `({ overflowX: ${overflowX}, thread: !!document.querySelector('main'), rowHeight: Math.round(document.querySelector('[role=option]').getBoundingClientRect().height), smallTargets: ${smallTargets} })`,
  }),
  phone("phone-thread-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    out: `${OUT}/phone-thread-2x.png`,
    eval: `({ overflowX: ${overflowX}, listHidden: !!document.querySelector('[data-list-pane]')?.closest('[hidden]'), back: document.querySelector('[aria-label="Back to conversations"]')?.getBoundingClientRect().height, bar: ${barButtons}, barRows: new Set([...document.querySelector('[data-glass=decision-bar]').querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().top))).size, dockBottom: Math.round(innerHeight - document.querySelector('[data-glass=decision-bar]').getBoundingClientRect().bottom), smallTargets: ${smallTargets} })`,
  }),
  phone("phone-refund-decision-2x", "/?lane=needs_you&ticket=t02", {
    scale: 2,
    out: `${OUT}/phone-refund-decision-2x.png`,
    eval: `({ overflowX: ${overflowX}, bar: ${barButtons}, smallTargets: ${smallTargets} })`,
  }),
  phone("phone-back-to-list", "/?lane=drafts&ticket=t17", {
    actions: [strip, click('[aria-label="Back to conversations"]')],
    eval: "({ thread: !!document.querySelector('main'), listShown: !document.querySelector('[data-list-pane]').closest('[hidden]'), focus: document.activeElement?.id })",
  }),
  phone("phone-composer-2x", "/?lane=drafts&ticket=t17", {
    scale: 2,
    keys: ["e"],
    out: `${OUT}/phone-composer-2x.png`,
    eval: `({ overflowX: ${overflowX}, composer: !!document.querySelector('[data-composer]'), smallTargets: ${smallTargets} })`,
  }),
  phone("phone-bulk-preview-2x", "/?lane=drafts", {
    scale: 2,
    keys: ["Shift+X", "a"],
    waitMs: 500,
    out: `${OUT}/phone-bulk-preview-2x.png`,
    eval: `({ overflowX: ${overflowX}, items: document.querySelectorAll('[data-preview-item]').length, send: ${oneLine("document.querySelector('[data-bulk-send]')?.innerText")}, smallTargets: ${smallTargets} })`,
  }),
  phone("phone-palette-2x", "/?lane=needs_you&ticket=t02", {
    scale: 2,
    keys: ["Control+K"],
    waitMs: 400,
    out: `${OUT}/phone-palette-2x.png`,
    eval: "(() => { const r = document.querySelector('[data-command-palette]').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(innerWidth - r.right), itemHeights: [...new Set([...document.querySelectorAll('[cmdk-item]')].map((i) => Math.round(i.getBoundingClientRect().height)))] }; })()",
  }),
  phone("phone-quality-2x", "/?lane=needs_you", {
    scale: 2,
    actions: [strip, click("[data-quality-trigger]")],
    waitMs: 400,
    out: `${OUT}/phone-quality-2x.png`,
    eval: `(() => { const r = document.querySelector('[data-quality-sheet]').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(innerWidth - r.right), overflowX: ${overflowX}, sheetOverflowX: [...document.querySelectorAll('[data-quality-sheet] [data-metric]')].some((m) => m.scrollWidth > m.clientWidth + 1) }; })()`,
  }),
  phone("night-phone-thread-2x", "/?lane=needs_you&ticket=t06", {
    scale: 2,
    theme: "night",
    out: `${OUT}/night-phone-thread-2x.png`,
    eval: `({ overflowX: ${overflowX}, bar: ${barButtons} })`,
  }),

  /* 8e · Gates earlier steps evidenced, re-run on the step 8 desk (review gates 4, 6, 7 and 10, and the fit sweeps) */
  ...reuse("step-5", ["bar-fits-every-ticket-1440", "bar-fits-every-ticket-900", "keyboard-A", "keyboard-A-Z", "keyboard-A-Z-A"]),
  ...reuse("step-6", ["panel-fits-every-ticket-1440", "panel-fits-every-ticket-1280"]),
  ...dayAndNight("reduced-transparency", "/?lane=drafts&ticket=t17", {
    media: { "prefers-reduced-transparency": "reduce" },
    keys: ["Shift+X"],
    waitMs: 500,
    eval: "({ matches: matchMedia('(prefers-reduced-transparency: reduce)').matches, glass: [...document.querySelectorAll('[data-glass]')].map((e) => { const s = getComputedStyle(e); return e.dataset.glass + ': backdrop=' + s.backdropFilter + ' bg=' + s.backgroundColor; }) })",
  }),
  shot("draft-vs-sent-25pct", "/?lane=needs_you&ticket=t12", {
    scale: 0.25,
    out: `${OUT}/draft-vs-sent-25pct.png`,
    eval: "({ draft: !!document.querySelector('[data-draft]'), sent: document.querySelectorAll('[data-state=sent], li:has(> div.bg-bubble-out)').length })",
  }),
  shot("drafting-vs-sent-25pct", "/?lane=needs_you&ticket=t12&draft=drafting", {
    scale: 0.25,
    out: `${OUT}/drafting-vs-sent-25pct.png`,
    eval: "({ drafting: !!document.querySelector('[data-drafting]'), draft: !!document.querySelector('[data-draft]') })",
  }),
  ...[
    ["needs-you", "/?lane=needs_you&ticket=t02", "[data-list-pane]", []],
    ["decision-t02", "/?lane=needs_you&ticket=t02", "main", ["document.querySelector('input[value=t02-refund]').click()"]],
    ["drafting", "/?lane=drafts&ticket=t17&draft=drafting", null, []],
    ["draft-failed", "/?lane=drafts&ticket=t17&draft=failed", null, []],
    ["collision-offline", "/?lane=drafts&ticket=t17&viewer=ana&net=offline", null, []],
    ["quality-sheet", "/?lane=needs_you&ticket=t02", "[data-quality-sheet]", [click("[data-quality-trigger]")]],
  ].map(([name, url, selector, steps]) =>
    shot(`greyscale-${name}-2x`, url, {
      scale: 2,
      actions: [strip, ...steps, greyscale],
      ...(selector ? { selector } : {}),
      out: `${OUT}/greyscale-${name}-2x.png`,
    }),
  ),
  phone("bulk-preview-scrim", "/?lane=drafts", {
    keys: ["Shift+X", "a"],
    waitMs: 500,
    eval: `(async () => { const scrim = document.querySelector('[data-bulk-scrim]'); await ${wait(300)}; const shown = getComputedStyle(scrim).opacity; scrim.click(); await ${wait(400)}; return { shown, previewOpenAfterTap: document.querySelector('[data-bulk-preview]')?.closest('[data-open]')?.dataset.open, stillSelecting: !!document.querySelector('[data-glass=bulk-bar]'), scrimAfterTap: getComputedStyle(scrim).opacity }; })()`,
  }),
];

writeFileSync("scripts/plans/step-8.json", `${JSON.stringify(plan, null, 2)}\n`);
console.log(`wrote ${plan.length} shots to scripts/plans/step-8.json`);
