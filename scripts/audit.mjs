// Lighthouse in both themes, using the capture browser so Windows cleanup cannot discard a report.
import lighthouse from "lighthouse";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { launch, connect, evaluate } from "./capture.mjs";

const base = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const directory = "docs/evidence/step-8";
const browser = await launch();
let failed = false;
try {
  await mkdir(directory, { recursive: true });
  const target = await (await fetch(`http://127.0.0.1:${browser.port}/json/new?${base}`, { method: "PUT" })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: base });
  await loaded;
  for (const theme of ["day", "night"]) {
    await evaluate(cdp, `localStorage.setItem('care-desk-theme', '${theme}')`);
    const result = await lighthouse(`${base}/?ticket=t02`, {
      port: browser.port,
      output: "json",
      onlyCategories: ["accessibility"],
      disableStorageReset: true,
      formFactor: "desktop",
      screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
    });
    await writeFile(`${directory}/lighthouse-${theme}.json`, result.report);
    const score = result.lhr.categories.accessibility.score * 100;
    if (score < 95 || result.lhr.runtimeError) failed = true;
    console.log(`${theme}: Lighthouse accessibility ${score}/100`);
  }
  cdp.close();
} finally {
  browser.child.kill();
  await sleep(500);
  await rm(browser.profile, { recursive: true, force: true }).catch(() => {});
}
process.exitCode = failed ? 1 : 0;
