// Usage: node scripts/shot.mjs <out.png> "<query string>" [width] [height] [waitMs]
// Headless Chromium with SwiftShader WebGL; waits until the app reports ready.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, qs = '', w = '1280', h = '720', wait = '2500'] = process.argv;
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
const url = `http://127.0.0.1:5173/?${qs}`;
const t0 = Date.now();
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
try {
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 240000 });
} catch (e) {
  logs.push('[timeout] app not ready');
}
const tReady = Date.now() - t0;
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out });
const dbg = await page.evaluate(() => document.getElementById('debug')?.textContent ?? '');
console.log(`ready in ${tReady} ms`);
console.log(dbg);
for (const l of logs.slice(0, 30)) console.log(l);
await browser.close();
