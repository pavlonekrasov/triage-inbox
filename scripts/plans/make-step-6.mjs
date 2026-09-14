// Generates scripts/plans/step-6.json. Written as code so in-page expressions need no JSON escaping.
import { writeFileSync } from "node:fs";

const OUT = "docs/evidence/step-6";
const base = "http://localhost:3000";
const ready = "!document.querySelector('[data-ssr]') && document.querySelector('[data-context-panel]')";
const strip = "document.querySelector('nextjs-portal')?.remove(); document.querySelector('[data-prototype-controls]')?.remove()";
const wait = (ms) => `new Promise(r => setTimeout(r, ${ms}))`;
const rowCheck = (target) =>
  `(() => { const row = document.querySelector('[data-context-target="${target}"]'); const s = row.closest('.overflow-y-auto').getBoundingClientRect(); const r = row.getBoundingClientRect(); const flash = row.querySelector('[data-flash]'); return { inView: r.top >= s.top - 1 && r.bottom <= s.bottom + 1, focused: document.activeElement === row, flash: { running: flash.getAnimations().length, opacity: getComputedStyle(flash).opacity } }; })()`;

const sweep = `(async () => {
  const problems = []; let checked = 0;
  for (const lane of ['needs_you', 'drafts', 'auto_resolved']) {
    document.querySelector('[data-lane-tab=' + lane + ']').click(); await ${wait(200)};
    for (const row of [...document.querySelectorAll('[role=option]')]) {
      row.click(); await ${wait(120)}; checked++;
      const panel = document.querySelector('[data-context-panel]');
      if (!panel) { problems.push(row.id + ' no panel'); continue; }
      const body = panel.querySelector('.overflow-y-auto');
      if (body.scrollWidth > body.clientWidth + 1) problems.push(row.id + ' panel overflows ' + body.scrollWidth + '/' + body.clientWidth);
      const records = [...panel.querySelectorAll('[data-conflict-record]')].map(e => e.getBoundingClientRect());
      if (records.length && (records.length !== 2 || Math.abs(records[0].top - records[1].top) > 1)) problems.push(row.id + ' conflict records not side by side');
      const main = document.querySelector('main').getBoundingClientRect();
      for (const el of document.querySelectorAll('[data-glass=decision-bar], [data-variant-choice]')) {
        const r = el.getBoundingClientRect();
        if (el.scrollWidth > el.clientWidth + 1 || r.left < main.left || r.right > main.right) problems.push(row.id + ' bar ' + Math.round(r.width) + ' in main ' + Math.round(main.width));
      }
    }
  }
  return { checked, threadWidth: Math.round(document.querySelector('main').getBoundingClientRect().width), panelWidth: Math.round(document.querySelector('[data-context-panel]').getBoundingClientRect().width), problems };
})()`;

const shot = (name, ticket, lane, extra = {}) => ({
  name,
  url: `${base}/?lane=${lane}&ticket=${ticket}`,
  width: 1440,
  height: 900,
  scale: 2,
  waitFor: ready,
  actions: [strip],
  ...extra,
});

const plan = [
  shot("inbox-t04-panel-2x", "t04", "needs_you", {
    out: `${OUT}/inbox-t04-panel-2x.png`,
    eval: "({ glass: [...document.querySelectorAll('[data-glass]')].map(e => e.dataset.glass), blurOutsideGlass: [...document.querySelectorAll('body *')].filter(e => !e.closest('[data-glass]') && getComputedStyle(e).backdropFilter !== 'none').length, panelWidth: Math.round(document.querySelector('[data-context-panel]').getBoundingClientRect().width), kbdShown: getComputedStyle(document.querySelector('[data-glass=decision-bar] kbd')).display })",
  }),
  shot("panel-t04-conflict-2x", "t04", "needs_you", { height: 1500, out: `${OUT}/panel-t04-conflict-2x.png`, selector: "[data-context-section=billing]" }),
  shot("panel-t05-stale-2x", "t05", "drafts", { height: 1500, out: `${OUT}/panel-t05-stale-2x.png`, selector: "[data-context-section=sources]" }),
  shot("panel-t03-advisor-2x", "t03", "needs_you", {
    height: 1500,
    out: `${OUT}/panel-t03-advisor-2x.png`,
    selector: "[data-context-section=advisor]",
    eval: "({ restricted: document.querySelectorAll('[data-context-panel] [data-restricted]').length, advisorText: document.querySelector('[data-context-section=advisor]').innerText.split(String.fromCharCode(10)).join(' | ') })",
  }),
  shot("panel-t12-reopened-2x", "t12", "needs_you", { height: 1500, out: `${OUT}/panel-t12-reopened-2x.png`, selector: "[data-context-section=contacts]" }),
  shot("pinned-t05-citation-2x", "t05", "drafts", {
    actions: [strip, "document.querySelector('[data-pinned-summary] button[aria-expanded]').click()", wait(400)],
    out: `${OUT}/pinned-t05-citation-2x.png`,
    selector: "[data-pinned-summary]",
  }),
  shot("flag-t04-link", "t04", "needs_you", {
    scale: 1,
    actions: [strip, "document.querySelector('[data-flag=source_conflict] button').click()", wait(1200)],
    eval: rowCheck("billing-conflict"),
  }),
  shot("flag-t04-midflash-2x", "t04", "needs_you", {
    actions: [strip, "document.querySelector('[data-flag=source_conflict] button').click()"],
    waitMs: 120,
    out: `${OUT}/flag-t04-midflash-2x.png`,
    selector: "[data-context-panel]",
    eval: rowCheck("billing-conflict"),
  }),
  shot("citation-t05-reduced-motion", "t05", "drafts", {
    scale: 1,
    media: { "prefers-reduced-motion": "reduce" },
    actions: [strip, "document.querySelector('[data-pinned-summary] button[aria-expanded]').click()", wait(300), "document.querySelector('[data-source=src-credits-v3]').click()", wait(300)],
    eval: rowCheck("source:src-credits-v3"),
  }),
  shot("reveal-email-logged-2x", "t02", "needs_you", {
    actions: [strip, "[...document.querySelectorAll('[data-context-panel] button')].find(b => b.innerText === 'Reveal').click()", wait(400)],
    out: `${OUT}/reveal-email-logged-2x.png`,
    eval: "({ emailShown: document.querySelector('[data-context-panel]').innerText.includes('jordan.kim@example.com'), logged: document.querySelector('main ol').innerText.includes('Email address revealed by you') })",
  }),
  shot("key-bracket-hides", "t04", "needs_you", { scale: 1, keys: ["]"], waitMs: 300, eval: "({ panel: !!document.querySelector('[data-context-panel]') })" }),
  shot("key-bracket-shows-again", "t04", "needs_you", { scale: 1, keys: ["]", "]"], waitMs: 300, eval: "({ panel: !!document.querySelector('[data-context-panel]') })" }),
  shot("sheet-900-2x", "t04", "needs_you", {
    width: 900,
    waitFor: "!document.querySelector('[data-ssr]')",
    actions: [strip, "document.querySelector('[aria-label=\"Customer details\"]').click()"],
    waitMs: 700,
    out: `${OUT}/sheet-900-2x.png`,
    eval: "(() => { const d = document.querySelector('[data-slot=sheet-content]'); return { opacity: getComputedStyle(d).opacity, width: Math.round(d.getBoundingClientRect().width), blur: getComputedStyle(document.querySelector('[data-slot=sheet-overlay]')).backdropFilter }; })()",
  }),
  shot("night-inbox-t04-panel-2x", "t04", "needs_you", { theme: "night", out: `${OUT}/night-inbox-t04-panel-2x.png` }),
  shot("panel-fits-every-ticket-1440", "t02", "needs_you", { scale: 1, eval: sweep }),
  shot("panel-fits-every-ticket-1280", "t02", "needs_you", { scale: 1, width: 1280, eval: sweep }),
];

writeFileSync("scripts/plans/step-6.json", `${JSON.stringify(plan, null, 2)}\n`);
console.log(`wrote ${plan.length} shots`);
