#!/usr/bin/env node
// Evidence capture over the Chrome DevTools Protocol, with no dependencies. Drives headless Edge or
// Chrome with emulated media features (reduced motion, reduced transparency, contrast), a saved
// theme, a device scale factor, an optional element clip, and an optional in-page expression whose
// result is printed. The in-app preview cannot emulate media features, so review gates 4 and 5 are
// checked here.
//
// Usage: node scripts/capture.mjs <plan.json>
//
// A plan is an array of shots:
// {
//   "name": "glass-reduced-transparency",
//   "url": "http://localhost:3000/tokens",
//   "out": "docs/evidence/step-1/glass-reduced-transparency.png",   (omit to only evaluate)
//   "width": 1440, "height": 900, "scale": 2, "mobile": false,
//   "theme": "day" | "night",
//   "media": { "prefers-reduced-transparency": "reduce" },
//   "selector": "section[aria-labelledby=contrast]",                  (clip to this element)
//   "fullPage": false,
//   "waitFor": "!document.querySelector('[data-ssr]')",               (poll until truthy: hydration)
//   "waitMs": 300,                                                    (extra settle time after waitFor)
//   "actions": ["document.querySelector('button').click()"],          (run in order before capture)
//   "keys": ["j", "Shift+X", "Escape"],                               (real key presses, after actions)
//   "hover": "#row-t04",                                              (move the pointer to its centre)
//   "eval": "document.title"                                          (printed after input)
// }

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BROWSERS = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);

async function launch() {
  const executable = BROWSERS.find((path) => existsSync(path));
  if (!executable) throw new Error("No Chromium browser found. Set BROWSER_PATH.");
  const profile = await mkdtemp(join(tmpdir(), "care-desk-capture-"));
  const child = spawn(
    executable,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${profile}`,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const portFile = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 150; i++) {
    if (existsSync(portFile)) {
      const [port] = (await readFile(portFile, "utf8")).split("\n");
      if (port) return { port: Number(port), child, profile };
    }
    await sleep(100);
  }
  child.kill();
  throw new Error("The browser did not open a DevTools port within 15 s.");
}

function connect(wsUrl) {
  return new Promise((resolveConnection, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    const listeners = new Map();
    let nextId = 1;

    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const { res, rej } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) rej(new Error(message.error.message));
        else res(message.result);
      } else if (message.method) {
        for (const listener of listeners.get(message.method) ?? []) listener(message.params);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      resolveConnection({
        send: (method, params = {}) =>
          new Promise((res, rej) => {
            const id = nextId++;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params }));
          }),
        once: (method) =>
          new Promise((res) => {
            const set = listeners.get(method) ?? new Set();
            const listener = (params) => {
              set.delete(listener);
              res(params);
            };
            set.add(listener);
            listeners.set(method, set);
          }),
        close: () => ws.close(),
      }),
    );
  });
}

async function evaluate(cdp, expression) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

async function waitFor(cdp, expression, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, `Boolean(${expression})`)) return;
    await sleep(100);
  }
  throw new Error(`waitFor timed out after ${timeoutMs} ms: ${expression}`);
}

// [code, keyCode, text]. Enter and Space carry text: Chromium activates a focused button from the
// keypress that text generates, so a text-less Enter never clicks.
const NAMED_KEYS = {
  Escape: ["Escape", 27],
  Enter: ["Enter", 13, "\r"],
  Space: ["Space", 32, " "],
  Tab: ["Tab", 9],
  ArrowDown: ["ArrowDown", 40],
  ArrowUp: ["ArrowUp", 38],
  ArrowLeft: ["ArrowLeft", 37],
  ArrowRight: ["ArrowRight", 39],
  Home: ["Home", 36],
  End: ["End", 35],
};

/** A trusted key press through the input pipeline, so :focus-visible and real listeners respond. */
async function pressKey(cdp, combo) {
  const parts = combo.split("+");
  const name = parts.pop();
  const modifiers =
    (parts.includes("Alt") ? 1 : 0) |
    (parts.includes("Control") ? 2 : 0) |
    (parts.includes("Meta") ? 4 : 0) |
    (parts.includes("Shift") ? 8 : 0);
  let key = name;
  let code;
  let keyCode;
  let text;
  if (NAMED_KEYS[name]) {
    [code, keyCode, text] = NAMED_KEYS[name];
    if (name === "Space") key = " ";
  } else if (/^[a-z]$/i.test(name)) {
    const upper = name.toUpperCase();
    key = modifiers & 8 ? upper : name.toLowerCase();
    code = `Key${upper}`;
    keyCode = upper.charCodeAt(0);
    text = key;
  } else if (/^\d$/.test(name)) {
    code = `Digit${name}`;
    keyCode = name.charCodeAt(0);
    text = name;
  } else if (name === "]") {
    key = "]";
    code = "BracketRight";
    keyCode = 221;
    text = "]";
  } else {
    throw new Error(`Unsupported key: ${combo}`);
  }
  const base = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, modifiers };
  await cdp.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", text, ...base });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}

async function shoot(port, shot) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  const width = shot.width ?? 1440;
  const height = shot.height ?? 900;

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  // Background targets report no document focus, which drops key events and :focus-visible.
  await cdp.send("Page.bringToFront");
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: shot.scale ?? 1,
    mobile: Boolean(shot.mobile),
  });
  if (shot.mobile) await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

  const features = Object.entries(shot.media ?? {}).map(([name, value]) => ({ name, value }));
  if (features.length) await cdp.send("Emulation.setEmulatedMedia", { features });

  // Seed the saved theme before any page script runs, so the head script paints it on the first frame.
  const theme = shot.theme === "night" ? "night" : "day";
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try{localStorage.setItem("care-desk-theme","${theme}")}catch(e){}`,
  });

  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: shot.url });
  await loaded;
  if (shot.waitFor) await waitFor(cdp, shot.waitFor);
  await sleep(shot.waitMs ?? (shot.waitFor ? 300 : 1500));

  for (const action of shot.actions ?? []) {
    await evaluate(cdp, action);
    await sleep(shot.actionWaitMs ?? 400);
  }

  for (const key of shot.keys ?? []) {
    await pressKey(cdp, key);
    await sleep(shot.keyWaitMs ?? 250);
  }

  if (shot.hover) {
    const point = await evaluate(
      cdp,
      `(() => {
        const el = document.querySelector(${JSON.stringify(shot.hover)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`,
    );
    if (!point) throw new Error(`[${shot.name}] hover target not found: ${shot.hover}`);
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await sleep(400);
  }

  if (shot.eval) {
    const value = await evaluate(cdp, shot.eval);
    console.log(`[${shot.name}] ${typeof value === "string" ? value : JSON.stringify(value, null, 1)}`);
  }

  if (shot.out) {
    let clip;
    if (shot.selector) {
      const box = await evaluate(
        cdp,
        `(() => {
          const el = document.querySelector(${JSON.stringify(shot.selector)});
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
        })()`,
      );
      if (!box) throw new Error(`[${shot.name}] selector not found: ${shot.selector}`);
      clip = { ...box, scale: 1 };
    } else if (shot.fullPage) {
      const fullHeight = await evaluate(cdp, "document.documentElement.scrollHeight");
      clip = { x: 0, y: 0, width, height: fullHeight, scale: 1 };
    }
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      ...(clip ? { clip, captureBeyondViewport: true } : {}),
    });
    await mkdir(dirname(resolve(shot.out)), { recursive: true });
    await writeFile(shot.out, Buffer.from(data, "base64"));
    console.log(`[${shot.name}] wrote ${shot.out}`);
  }

  cdp.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
}

const planPath = process.argv[2];
if (!planPath) {
  console.error("Usage: node scripts/capture.mjs <plan.json>");
  process.exit(1);
}

const plan = JSON.parse(await readFile(planPath, "utf8"));
const browser = await launch();
let failed = false;
try {
  for (const shot of plan) {
    try {
      await shoot(browser.port, shot);
    } catch (error) {
      failed = true;
      console.error(`[${shot.name}] failed: ${error.message}`);
    }
  }
} finally {
  browser.child.kill();
  await sleep(500);
  await rm(browser.profile, { recursive: true, force: true }).catch(() => {});
}
process.exit(failed ? 1 : 0);
