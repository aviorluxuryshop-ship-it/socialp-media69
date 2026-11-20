// Screenshot of the inside view and of every region frame. node scripts/regions.mjs <outDir> [w] [h] [mobile]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require('playwright')); } catch { ({ chromium, devices } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, w = '960', h = '540', mobile = ''] = process.argv;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = mobile ? await browser.newContext({ ...devices['iPhone 13'] }) : await browser.newContext({ viewport: { width: Number(w), height: Number(h) } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:5173/?t=14:00&fast&q=medium&msaa=0', { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 300000 });
const idle = async () => {
  await page.waitForFunction(() => window.__app.director.mode !== 'flying', null, { timeout: 240000, polling: 500 });
  await page.waitForTimeout(2000);
};
await page.evaluate(() => window.__picker.start());
await idle();
// stop the slow turn so the shot is the arrival pose
await page.evaluate(() => (window.__app.director.controls.autoRotate = false));
await page.waitForTimeout(800);
console.log('labels', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.region-label:not(.off)')].map((l) => l.querySelector('b').textContent))));
await page.screenshot({ path: `${out}/inside.png` });
// turn to face Batı to check the labels there
await page.evaluate(() => {
  const d = window.__app.director;
  d.seatLook(false);
  d.applyPose({ position: d.camera.position.clone(), target: d.camera.position.clone().add({ x: 0, y: -0.15, z: 1 }), fov: d.camera.fov });
  d.seatLook(true);
});
await page.waitForTimeout(1500);
console.log('labels facing Batı', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.region-label:not(.off)')].map((l) => l.querySelector('b').textContent))));
await page.screenshot({ path: `${out}/inside-bati.png` });
const ids = await page.evaluate(() => window.__picker.regions.map((r) => r.id));
for (const id of ids) {
  await page.evaluate((id) => window.__picker.chooseRegion(window.__picker.regions.find((r) => r.id === id)), id);
  await idle();
  await page.screenshot({ path: `${out}/region-${id}.png` });
  console.log('region', id);
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
