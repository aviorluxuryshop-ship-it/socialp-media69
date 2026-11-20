// End-to-end seat picking flow with real clicks. node scripts/flow.mjs <outDir> [width] [height] [mobile]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require('playwright')); } catch { ({ chromium, devices } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, w = '1280', h = '720', mobile = ''] = process.argv;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = mobile ? await browser.newContext({ ...devices['iPhone 13'] }) : await browser.newContext({ viewport: { width: Number(w), height: Number(h) } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:5173/?t=14:00&fast&q=medium&msaa=0', { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 240000 });
const idle = async () => {
  await page.waitForFunction(() => window.__app.director.mode !== 'flying', null, { timeout: 240000, polling: 500 });
  await page.waitForTimeout(2500);
};
let n = 0;
const shot = async (name) => { await page.screenshot({ path: `${out}/${String(n++).padStart(2, '0')}-${name}.png` }); console.log('shot', name); };
const tap = async (sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(300); };

await page.waitForTimeout(1200);
await shot('intro');
await tap('.intro [data-act="start"]');
await idle();
await page.evaluate(() => document.querySelector('.stand-card[data-stand="BATI"]').dispatchEvent(new PointerEvent('pointerenter')));
await page.waitForTimeout(700);
await shot('stand-hover-bati');
await tap('.stand-card[data-stand="BATI"]');
await idle();
await shot('stand-bati');
const b416 = await page.evaluate(() => window.__app.stadium.layout.blocks.find((b) => b.code === '416').index);
await tap(`.block-chip[data-block="${b416}"]`);
await idle();
await shot('block-416');
await tap('.row-btn[data-row="12"]');
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelectorAll('.seat-chip:not(.sold)')[8].dispatchEvent(new PointerEvent('pointerenter')));
await page.waitForTimeout(2500);
await shot('row-12-hover-seat');
await page.evaluate(() => document.querySelectorAll('.seat-chip:not(.sold)')[8].click());
await idle();
await page.waitForFunction(() => !document.querySelector('[data-act="ticket"]')?.hasAttribute('disabled'), null, { timeout: 120000, polling: 500 });
await shot('at-seat');
const info = await page.evaluate(() => {
  const p = window.__picker; const a = window.__app; const S = a.stadium.layout.seats;
  const e = a.engine.camera.position;
  return { seat: p.seat, row: S.row[p.seat], num: S.num[p.seat], block: a.stadium.layout.blocks[S.block[p.seat]].code, cam: [e.x, e.y, e.z].map((v) => +v.toFixed(2)) };
});
console.log('seat', JSON.stringify(info));
await tap('[data-act="ticket"]');
await page.waitForTimeout(800);
await shot('ticket');
if (await page.locator('.ticket [data-act="confirm"]').count()) {
  await tap('.ticket [data-act="confirm"]');
  await page.waitForTimeout(800);
  await shot('ticket-confirmed');
}
await tap('.ticket-close');
// neighbour seat → view must change
const before = await page.evaluate(() => window.__app.engine.camera.position.toArray());
await tap('[data-act="next"]');
await idle();
const after = await page.evaluate(() => window.__app.engine.camera.position.toArray());
console.log('neighbour moved', Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2]).toFixed(2), 'm');
await shot('neighbour-seat');
// VIP and Loca paths
await tap('.picker [data-act="close"]');
await idle();
await tap('.intro [data-act="start"]');
await idle();
await tap('.stand-card[data-stand="VIP"]');
await idle();
await shot('vip-block');
await tap('.picker [data-act="back"]');
await idle();
await tap('.stand-card[data-stand="LOCA"]');
await idle();
await shot('loca-list');
// first box with free seats (sold-out boxes are disabled in the list)
const loca = await page.evaluate(() => {
  const L = window.__app.stadium.layout;
  const b = L.blocks.find((x) => x.kind === 'suite' && Array.from({ length: x.seatCount }, (_, k) => L.seats.sold[x.seatStart + k]).some((v) => v === 0));
  const full = L.blocks.filter((x) => x.kind === 'suite' && !Array.from({ length: x.seatCount }, (_, k) => L.seats.sold[x.seatStart + k]).some((v) => v === 0)).map((x) => x.index);
  const disabledOk = full.every((i) => document.querySelector(`.block-chip[data-block="${i}"]`)?.hasAttribute('disabled'));
  return { index: b.index, code: b.code, full: full.length, disabledOk };
});
console.log('loca', JSON.stringify(loca));
await tap(`.block-chip[data-block="${loca.index}"]`);
await idle();
await tap('.row-btn[data-row="1"]');
await page.waitForTimeout(400);
await page.evaluate(() => { const c = document.querySelector('.seat-chip:not(.sold)'); if (c) c.click(); else console.log('loca sold out'); });
await idle();
await page.waitForTimeout(1200);
await shot('loca-seat');
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
