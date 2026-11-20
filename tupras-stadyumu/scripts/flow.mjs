// End-to-end seat picking flow with real clicks / taps.
// node scripts/flow.mjs <outDir> [width] [height] [mobile] [region]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require('playwright')); } catch { ({ chromium, devices } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, w = '1280', h = '720', mobile = '', regionId = 'DOGU-lower'] = process.argv;
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
  await page.waitForTimeout(2500);
};
let n = 0;
const shot = async (name) => { await page.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name}.png` }); console.log('shot', name); };
const tap = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(300); };
const press = async (x, y) => (mobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
const flight = () => page.evaluate(() => +(window.__app.director.flight?.duration ?? 0).toFixed(2));

await page.waitForTimeout(1200);
const buttons = await page.evaluate(() => [...document.querySelectorAll('.intro button')].map((b) => b.textContent.trim()));
console.log('intro buttons', JSON.stringify(buttons));
await shot('intro');

// 1) one button → into the stadium
await tap('.intro [data-act="start"]');
console.log('enter flight', await flight(), 's');
await idle();
await page.waitForTimeout(1500);
const labels = await page.evaluate(() => [...document.querySelectorAll('.region-label:not(.off)')].map((l) => l.querySelector('b').textContent));
console.log('labels on screen', JSON.stringify(labels), 'auto-turn', await page.evaluate(() => window.__app.director.controls.autoRotate));
await shot('inside-regions');

// 2) a region: hover its card, then choose it
await page.evaluate((id) => document.querySelector(`.region-card[data-region="${id}"]`).dispatchEvent(new PointerEvent('pointerenter')), regionId);
await page.waitForTimeout(1500);
await shot('region-hover');
await tap(`.region-card[data-region="${regionId}"]`);
console.log('region flight', await flight(), 's');
await idle();
await shot('region');

// 3) a seat in 3D: a free seat near the middle of the anchor block, projected to the screen
const target = await page.evaluate(() => {
  const a = window.__app;
  const p = window.__picker;
  const L = a.stadium.layout;
  const S = L.seats;
  const cam = a.engine.camera;
  cam.updateMatrixWorld();
  const b = p.region.anchor;
  const V = a.engine.camera.position.constructor;
  const free = [];
  for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) if (S.sold[i] === 0) free.push(i);
  free.sort((x, y) => Math.abs(S.row[x] - b.rows * 0.4) - Math.abs(S.row[y] - b.rows * 0.4) || Math.abs(x - (b.seatStart + b.seatCount / 2)) - Math.abs(y - (b.seatStart + b.seatCount / 2)));
  for (const i of free) {
    const yaw = S.yaw[i];
    const v = new V(S.pos[i * 3] - Math.sin(yaw) * 0.19, S.pos[i * 3 + 1] + 8.5 + 0.62, S.pos[i * 3 + 2] - Math.cos(yaw) * 0.19).project(cam);
    // whole CSS pixels (pointer events report integers) with a 1 px margin around
    const x = Math.round((v.x * 0.5 + 0.5) * innerWidth);
    const y = Math.round((-v.y * 0.5 + 0.5) * innerHeight);
    const ok = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => a.selection.pickAt(x + dx, y + dy).seat === i);
    if (ok) return { seat: i, x, y, row: S.row[i], num: S.num[i], block: b.code };
  }
  return null;
});
console.log('tap target', JSON.stringify(target));
if (!mobile) {
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(2500);
  await shot('seat-hover');
}
await page.evaluate(() => {
  const a = window.__app;
  window.__clicks = [];
  a.selection.onClick((p) => window.__clicks.push({ seat: p.seat, block: p.block, sold: p.seat >= 0 ? a.stadium.layout.seats.sold[p.seat] : -1, step: window.__picker.step, cam: a.engine.camera.position.toArray().map((v) => +v.toFixed(3)) }));
});
console.log('pick right before tap', JSON.stringify(await page.evaluate((t) => ({ ...window.__app.selection.pickAt(t.x, t.y), cam: window.__app.engine.camera.position.toArray().map((v) => +v.toFixed(3)) }), target)));
await press(target.x, target.y);
await page.waitForTimeout(200);
console.log('clicks', JSON.stringify(await page.evaluate(() => window.__clicks)));
await page.waitForTimeout(300);
console.log('seat flight', await flight(), 's');
await idle();
await page.waitForFunction(() => !document.querySelector('[data-act="ticket"]')?.hasAttribute('disabled'), null, { timeout: 120000, polling: 500 });
await shot('at-seat');
const info = await page.evaluate(() => {
  const p = window.__picker; const a = window.__app; const S = a.stadium.layout.seats;
  const e = a.engine.camera.position;
  const dl = [...document.querySelectorAll('.seat-dl > div')].map((d) => d.querySelector('dt').textContent + '=' + d.querySelector('dd').textContent);
  return { seat: p.seat, region: p.region?.name, row: S.row[p.seat], num: S.num[p.seat], block: a.stadium.layout.blocks[S.block[p.seat]].code, panel: dl, cam: [e.x, e.y, e.z].map((v) => +v.toFixed(2)) };
});
console.log('seat', JSON.stringify(info), 'tapped', target.seat === info.seat ? 'same seat' : 'DIFFERENT');

// 4) ticket
await tap('[data-act="ticket"]');
await page.waitForTimeout(1000);
await shot('ticket');
if (await page.locator('.ticket [data-act="confirm"]').count()) {
  await tap('.ticket [data-act="confirm"]');
  await page.waitForTimeout(800);
}
await tap('.ticket-close');

// 5) back: another seat → region; back → regions; close → intro
await tap('[data-act="change"]');
console.log('back-to-region flight', await flight(), 's');
await idle();
console.log('step after change', await page.evaluate(() => window.__picker.step));
await tap('.picker [data-act="back"]');
console.log('back-to-regions flight', await flight(), 's');
await idle();
console.log('step after back', await page.evaluate(() => window.__picker.step));
await tap('.picker [data-act="close"]');
console.log('exit flight', await flight(), 's');
await idle();
console.log('step after close', await page.evaluate(() => window.__picker.step));
await shot('closed');
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
