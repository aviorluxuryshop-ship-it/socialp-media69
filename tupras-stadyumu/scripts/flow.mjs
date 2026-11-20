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
  // the lens shift glides when the panel changes size; with software GL a frame
  // takes ~1 s, so wait until it has settled before projecting tap targets
  await page.waitForFunction(() => {
    const e = window.__app.engine;
    return Math.abs(e.shift.x - e.shiftGoal.x) < 0.05 && Math.abs(e.shift.y - e.shiftGoal.y) < 0.05;
  }, null, { timeout: 240000, polling: 500 });
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
const findTarget = () => page.evaluate(() => {
  const a = window.__app;
  const p = window.__picker;
  const L = a.stadium.layout;
  const S = L.seats;
  const cam = a.engine.camera;
  cam.updateMatrixWorld();
  const V = a.engine.camera.position.constructor;
  const fa = p.area;
  const cx = fa.x + fa.w / 2, cy = fa.y + fa.h / 2;
  let best = null;
  for (const b of [p.region.anchor, ...p.region.blocks]) {
    for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
      if (S.sold[i] !== 0) continue;
      const yaw = S.yaw[i];
      const v = new V(S.pos[i * 3] - Math.sin(yaw) * 0.19, S.pos[i * 3 + 1] + 8.5 + 0.62, S.pos[i * 3 + 2] - Math.cos(yaw) * 0.19).project(cam);
      if (v.z > 1 || v.z < -1) continue;
      const x = Math.round((v.x * 0.5 + 0.5) * innerWidth);
      const y = Math.round((-v.y * 0.5 + 0.5) * innerHeight);
      if (x < fa.x + 8 || x > fa.x + fa.w - 8 || y < fa.y + 8 || y > fa.y + fa.h - 8) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (best && d >= best.d) continue;
      const ok = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => a.selection.pickAt(x + dx, y + dy).seat === i);
      if (ok) best = { seat: i, x, y, d, row: S.row[i], num: S.num[i], block: b.code, px: +p.seatPx(i).toFixed(1) };
    }
    if (best) break;
  }
  return best;
});
let target = await findTarget();
console.log('first tap target', JSON.stringify(target));
await press(target.x, target.y);
await page.waitForTimeout(400);
console.log('zoomed', await page.evaluate(() => window.__picker.zoomed), 'zoom flight', await flight(), 's');
await idle();
await shot('zoomed');
target = await findTarget();
console.log('tap target', JSON.stringify(target));
if (!mobile) {
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(2500);
  await shot('seat-hover');
}
await press(target.x, target.y);
await page.waitForTimeout(500);
console.log('seat flight', await flight(), 's');
await idle();
await page.waitForFunction(() => !document.querySelector('[data-act="ticket"]')?.hasAttribute('disabled'), null, { timeout: 120000, polling: 500 });
await shot('at-seat');
const info = await page.evaluate(() => {
  const p = window.__picker; const a = window.__app; const S = a.stadium.layout.seats;
  return { seat: p.seat, region: p.region?.name, row: S.row[p.seat], num: S.num[p.seat], panel: document.querySelector('.seat-card')?.innerText.replace(/\s+/g, ' '), panelH: Math.round(document.querySelector('.picker').getBoundingClientRect().height) };
});
console.log('seat', JSON.stringify(info), 'tapped', target.seat === info.seat ? 'same seat' : 'DIFFERENT');

// 4) live: a second visitor (another tab) watches the same region
const page2 = await ctx.newPage();
page2.on('pageerror', (e) => errors.push('p2 ' + e.message));
await page2.goto('http://127.0.0.1:5173/?t=14:00&fast&q=low&msaa=0', { waitUntil: 'load' });
await page2.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 300000 });

// 5) ticket → buy
await tap('[data-act="ticket"]');
await page.waitForTimeout(1000);
await shot('ticket');
await tap('.ticket [data-act="confirm"]');
await page.waitForTimeout(1500);
console.log('bought', await page.evaluate(() => document.querySelector('.ticket .st')?.textContent));
const seen = await page2.evaluate((s) => window.__app.stadium.layout.seats.sold[s], info.seat);
console.log('second visitor sees seat sold:', seen === 1, 'toast:', await page2.evaluate(() => document.querySelector('.live-toast')?.textContent));
// a second buyer of the same seat must lose
const res2 = await page2.evaluate((s) => window.__picker.live.claim(s), info.seat);
console.log('second claim of the same seat:', res2);
await page2.close();
await tap('.ticket-close');

// 6) the step chips
const chip = async (s) => { await tap(`.steps [data-s="${s}"]`); console.log('chip', s, '→ step', await page.evaluate(() => window.__picker.step), 'flight', await flight(), 's'); await idle(); };
console.log('chips enabled', await page.evaluate(() => [...document.querySelectorAll('.steps button')].map((b) => b.dataset.s + ':' + !b.disabled).join(' ')));
await chip('region');
await shot('back-region');
await chip('seat');
await chip('regions');
await tap('.picker [data-act="close"]');
console.log('exit flight', await flight(), 's');
await idle();
console.log('step after close', await page.evaluate(() => window.__picker.step));
await shot('closed');
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
