// Day/night check: renders one view across the day, then jumps the clock and
// records how the atmosphere glides to the new time (no hard cut).
// node scripts/daynight.mjs <outDir> [view] [w] [h]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, view = 'dis', w = '640', h = '360'] = process.argv;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
await page.goto(`http://127.0.0.1:5173/?view=${view}&t=12:00&q=medium&msaa=0`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 240000 });
const state = () =>
  page.evaluate(() => {
    const a = window.__app;
    const f = a.atmosphere.factors;
    return {
      label: a.time.label,
      sunAlt: +a.time.sun.altitude.toFixed(2),
      smoothAlt: +f.altitude.toFixed(2),
      night: +f.night.toFixed(3),
      lights: +f.lights.toFixed(3),
      exposure: +a.engine.renderer.toneMappingExposure.toFixed(3),
      flood: +(a.atmosphere.floods[0]?.intensity ?? 0).toFixed(3),
    };
  });
// 1) sweep: one frame per time of day (smoothing skipped by waiting)
const times = ['06:00', '07:45', '08:30', '12:00', '15:30', '17:15', '17:45', '18:15', '19:00', '22:30'];
for (const t of times) {
  const [hh, mm] = t.split(':').map(Number);
  await page.evaluate((m) => window.__app.clock.setOverride(m), hh * 60 + mm);
  await page.waitForFunction(() => {
    const a = window.__app;
    return Math.abs(a.atmosphere.factors.altitude - a.time.sun.altitude) < 0.2;
  }, null, { timeout: 240000, polling: 500 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${view}_${t.replace(':', '')}.png` });
  console.log('sweep', JSON.stringify(await state()));
}
// 2) live transition: jump 12:00 → 21:00 and sample the glide
await page.evaluate(() => window.__app.clock.setOverride(12 * 60));
await page.waitForFunction(() => Math.abs(window.__app.atmosphere.factors.altitude - window.__app.time.sun.altitude) < 0.2, null, { timeout: 240000, polling: 500 });
await page.evaluate(() => window.__app.clock.setOverride(21 * 60));
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(700);
  console.log('glide', i, JSON.stringify(await state()));
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
