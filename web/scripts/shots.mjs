/**
 * QA screenshots via headless Chrome over the DevTools Protocol.
 *
 * The in-app browser pane cannot composite frames under viewport emulation, so
 * desktop and mobile reviews are captured here instead. Dev-only tooling.
 *
 * Usage: node scripts/shots.mjs <url> <outPrefix> <width> <height> [fullPage] [scrollSteps]
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url, outPrefix, wArg, hArg, fullArg, stepsArg] = process.argv;
const width = Number(wArg) || 1440;
const height = Number(hArg) || 900;
const fullPage = fullArg === 'full';
const steps = Number(stepsArg) || 0;

const userDir = path.join(os.tmpdir(), `sp-shot-${Date.now()}`);
const port = 9222 + Math.floor(Math.random() * 500);

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    `--window-size=${width},${height}`,
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not expose a debugging endpoint');
}

const ws = new WebSocket(await endpoint());
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', rej, { once: true });
});

let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((resolve) => {
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
}

const { result: targetInfo } = await send('Target.createTarget', { url: 'about:blank' });
const { result: attached } = await send('Target.attachToTarget', {
  targetId: targetInfo.targetId,
  flatten: true,
});
const session = attached.sessionId;

await send('Page.enable', {}, session);
await send('Runtime.enable', {}, session);
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 768,
}, session);
// Explicitly opt into motion so the QA pass sees the real animation work even
// when the host machine has OS-level reduce-motion enabled.
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
}, session);

await send('Page.navigate', { url }, session);
await sleep(4500);

async function shoot(name) {
  const { result } = await send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: fullPage, ...(fullPage ? { optimizeForSpeed: false } : {}) },
    session,
  );
  await writeFile(`${outPrefix}-${name}.png`, Buffer.from(result.data, 'base64'));
  console.log(`  ${outPrefix}-${name}.png`);
}

if (steps > 0) {
  for (let i = 0; i <= steps; i++) {
    await send(
      'Runtime.evaluate',
      { expression: `window.scrollTo(0, ${i} * innerHeight * 0.9)`, awaitPromise: false },
      session,
    );
    await sleep(1400);
    await shoot(String(i).padStart(2, '0'));
  }
} else {
  await shoot('view');
}

const { result: diag } = await send(
  'Runtime.evaluate',
  {
    expression: `JSON.stringify({vw:innerWidth,scrollW:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,jsMotion:document.documentElement.classList.contains('js-motion'),docH:document.body.scrollHeight})`,
    returnByValue: true,
  },
  session,
);
console.log('  diag:', diag.result.value);

ws.close();
chrome.kill();
await sleep(600);
await rm(userDir, { recursive: true, force: true }).catch(() => {});
