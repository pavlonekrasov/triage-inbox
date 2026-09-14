// Regenerate the presentation exports from live routes, at 1440 × 900 CSS px and 2× density.
import { writeFileSync } from "node:fs";

const base = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const out = "docs/evidence/slides";
const strip = `document.querySelector('nextjs-portal')?.remove(); document.querySelector('[data-prototype-controls]')?.remove(); document.querySelector('[data-slide-controls]')?.setAttribute('hidden', ''); for (const f of document.querySelectorAll('iframe')) { f.contentDocument.querySelector('nextjs-portal')?.remove(); }`;
const framesReady = `[...document.querySelectorAll('iframe')].every(f => f.dataset.loaded === 'true' && f.contentDocument.querySelector('[data-glass=thread-header]') && !f.contentDocument.querySelector('[data-ssr]'))`;
const slideReady = `document.querySelector('[data-slide][data-ready=true]') && ${framesReady}`;
const deskReady = `!document.querySelector('[data-ssr]') && document.querySelector('[data-glass=thread-header]')`;
const check = `(() => { if (document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight) throw new Error('Export exceeds the slide bounds'); return { width: innerWidth, height: innerHeight, theme: document.documentElement.classList.contains('dark') ? 'night' : 'day' }; })()`;

const specs = [
  { name: "s2-flow", path: "/slides/flow", slide: true },
  { name: "s3-inbox", path: "/?ticket=t02" },
  { name: "s4-cases", path: "/slides/cases", slide: true, actions: [
    `for (const f of document.querySelectorAll('iframe')) f.contentDocument.querySelector('main > div').scrollTop = 0`,
  ] },
  { name: "s5-safeguards", path: "/slides/safeguards", slide: true, actions: [
    `(() => { const d = document.querySelector('[data-case=t04]').contentDocument; [...d.querySelectorAll('button')].find(b => b.textContent.includes('Why this route')).click(); })()`,
    `(() => { const d = document.querySelector('[data-case=t03]').contentDocument; [...d.querySelectorAll('button')].find(b => b.textContent.includes('Escalate case')).click(); })()`,
  ] },
  { name: "s5-metrics", path: "/?ticket=t02", actions: [`document.querySelector('[data-quality-trigger]').click()`] },
  { name: "s5-bulk-preview", path: "/?lane=drafts&ticket=t17", keys: ["Shift+X", "a"] },
];

const plan = ["day", "night"].flatMap(theme => specs.map(spec => ({
  name: `${spec.name}${theme === "night" ? "-night" : ""}`,
  url: base + spec.path,
  width: 1440, height: 900, scale: 2, theme,
  waitFor: spec.slide ? slideReady : deskReady,
  waitMs: 700,
  actions: [strip, "document.fonts.ready", ...(spec.actions ?? [])],
  keys: spec.keys,
  eval: check,
  out: `${out}/${spec.name}${theme === "night" ? "-night" : ""}.png`,
})));
writeFileSync("scripts/plans/slides.json", JSON.stringify(plan, null, 2) + "\n");
console.log(`Wrote ${plan.length} slide captures.`);
