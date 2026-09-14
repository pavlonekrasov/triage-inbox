import { writeFileSync } from "node:fs";

const base = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const ready = "!document.querySelector('[data-ssr]') && document.querySelector('[data-glass=thread-header], [data-slide][data-ready=true]') && [...document.querySelectorAll('iframe')].every(f => f.dataset.loaded === 'true' && f.contentDocument.querySelector('[data-glass=thread-header]'))";
const strip = "document.querySelector('nextjs-portal')?.remove()";
const audit = `(async () => {
  const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] } });
  const violations = result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) }));
  if (violations.some(v => ['serious', 'critical'].includes(v.impact))) throw new Error(JSON.stringify(violations));
  return { violations, passes: result.passes.length };
})()`;
const motion = `(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const rail = document.querySelector('[data-context-rail]');
  const toggle = document.querySelector('[data-context-toggle]');
  const width = () => Math.round(rail.getBoundingClientRect().width);
  const initial = width();
  document.querySelector('[aria-label="Hide customer details"]').click();
  await delay(50);
  const closing = width();
  const closeAnimations = rail.getAnimations().map(a => a.effect.getTiming().duration);
  await delay(300);
  const closed = width();
  const focusReturned = document.activeElement === toggle;
  const inert = rail.inert;
  toggle.click();
  await delay(50);
  const opening = width();
  await delay(300);
  const restored = width();
  toggle.click(); await delay(60); toggle.click(); await delay(350);
  const reversed = width();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (closed > 1 || Math.abs(restored-initial)>2 || Math.abs(reversed-initial)>2 || !inert) throw new Error('Sidebar did not restore its width/state');
  if (!reduced && !(closing > 0 && closing < initial && opening > 0 && opening < initial && closeAnimations.length)) throw new Error('Sidebar snapped rather than animating: '+JSON.stringify({initial,closing,opening,closeAnimations}));
  if (reduced && (closing !== closed || closeAnimations.length)) throw new Error('Reduced motion still animates');
  return {initial,closing,closed,opening,restored,reversed,focusReturned,inert,reduced,closeAnimations};
})()`;
const section = `(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const root = document.querySelector('[data-context-section=customer]');
  const button = root.querySelector('button');
  const height = () => Math.round(root.getBoundingClientRect().height);
  const before = height();
  button.click(); await delay(60); const during = height();
  await delay(300); const closed = height();
  button.click(); await delay(350); const after = height();
  if (!(during > closed && during < before) || Math.abs(after-before)>2) throw new Error('Section expansion is not animated or did not restore: '+JSON.stringify({before,during,closed,after}));
  return {before,during,closed,after};
})()`;

const plan = ["day", "night"].flatMap(theme => [
  ...[
    ["inbox", "/?ticket=t02"], ["drafting", "/?ticket=t17&draft=drafting"],
    ["draft-failed", "/?ticket=t17&draft=failed"], ["collision-offline", "/?ticket=t17&viewer=ana&net=offline"],
    ["phone", "/?ticket=t02", 375], ["tablet", "/?ticket=t02", 800],
    ["quality", "/?ticket=t02", 1440, ["document.querySelector('[data-quality-trigger]').click()"]],
    ["flow", "/slides/flow"], ["cases", "/slides/cases"],
  ].map(([name, path, width=1440, actions=[]]) => ({
    name: `axe-${name}-${theme}`, url: base + path, width, height: 900, theme, waitFor: ready,
    actions: [strip, ...actions], scripts: ["node_modules/axe-core/axe.min.js"], eval: audit,
    report: `docs/evidence/step-8/axe-${name}-${theme}.json`,
  })),
  { name: `sidebar-motion-${theme}`, url: base+"/?ticket=t02", theme, waitFor: ready, eval: motion, report: `docs/evidence/step-8/sidebar-motion-${theme}.json` },
  { name: `section-motion-${theme}`, url: base+"/?ticket=t02", theme, waitFor: ready, eval: section, report: `docs/evidence/step-8/section-motion-${theme}.json` },
  { name: `sidebar-reduced-${theme}`, url: base+"/?ticket=t02", theme, waitFor: ready, media: {"prefers-reduced-motion":"reduce"}, eval: motion, report: `docs/evidence/step-8/sidebar-reduced-${theme}.json` },
]);
writeFileSync("scripts/plans/review.json", JSON.stringify(plan, null, 2)+"\n");
