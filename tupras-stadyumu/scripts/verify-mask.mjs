// STEP 04 check: mask ↔ seat data agreement. node scripts/verify-mask.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const cases = [
  ['uzun', ['427', '104', '113', 'VIP', '409']],
  ['kale', ['VIP', '416', '408', '106', 'L074']],
  ['vip', ['427', '401', '120', '122']],
  ['ustten', ['416', '104', '422']],
];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
let bad = 0;
for (const [view, blocks] of cases) {
  await page.goto(`http://127.0.0.1:5173/?view=${view}&t=13:00&q=high`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 240000 });
  await page.waitForTimeout(800);
  for (const code of blocks) {
    const r = await page.evaluate((code) => {
      const app = window.__app;
      const b = app.stadium.layout.blocks.find((x) => x.code === code);
      return app.selection.verify(b.index);
    }, code);
    // seats whose centre is not hidden by other geometry
    const unoccluded = r.own + r.sameBlock + r.ownTerrace;
    const match = unoccluded ? r.own / unoccluded : 1;
    const purity = r.maskPixels ? r.maskPixelsInBlock / r.maskPixels : 1;
    // far away seats are ~2 px wide: a sample may land on the same block's next seat — still the right block
    const sameBlockRate = unoccluded ? (r.own + r.sameBlock) / unoccluded : 1;
    const terraceRate = unoccluded ? r.ownTerrace / unoccluded : 0;
    const ok = purity === 1 && (unoccluded < 30 || (sameBlockRate >= 0.9 && terraceRate < 0.1));
    if (!ok) bad++;
    console.log(`${view.padEnd(6)} ${code.padEnd(5)} seats in frame ${String(r.onScreen).padStart(5)} · visible ${String(unoccluded).padStart(5)} · exact seat id ${(match * 100).toFixed(1)}% · neighbour ${r.sameBlock} · on own terrace ${r.ownTerrace} · hidden ${r.other} · mask purity ${(purity * 100).toFixed(2)}% ${ok ? '' : '  <-- CHECK'}`);
  }
}
await browser.close();
console.log(bad ? `${bad} case(s) need attention` : 'mask matches the seat data');
process.exit(bad ? 1 : 0);
