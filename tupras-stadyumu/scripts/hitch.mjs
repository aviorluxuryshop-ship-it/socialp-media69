// Frame hitch probe for the picker flow: shader programs compiled and the
// slowest CPU parts per phase (enter → region → seat). Programs compiled after
// load are what freezes a real phone for 100+ ms each.
// node scripts/hitch.mjs [w] [h] [url-extra]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , w = '960', h = '540', extra = ''] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
const t0 = Date.now();
await page.goto(`http://127.0.0.1:5173/?t=14:00&fast&q=medium&msaa=0${extra}`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 300000 });
console.log('load', ((Date.now() - t0) / 1000).toFixed(1), 's (SwiftShader)');
await page.waitForTimeout(5000);
await page.evaluate(() => {
  const a = window.__app;
  window.__cur = {};
  window.__frames = [];
  const wrap = (obj, name, key) => {
    const f = obj[name].bind(obj);
    obj[name] = (...args) => { const t = performance.now(); const r = f(...args); window.__cur[key] = (window.__cur[key] || 0) + performance.now() - t; return r; };
  };
  wrap(a.streamer, 'update', 'stream');
  wrap(a.stadium.seats, 'update', 'seats');
  wrap(a.selection, 'prepare', 'sel');
  wrap(a.stadium.seats, 'setAvailabilityMode', 'avail');
  wrap(a.stadium.seats, 'setNeutralBlocks', 'neutral');
  a.onFrame(() => { window.__frames.push(window.__cur); window.__cur = {}; });
});
const programs = () => page.evaluate(() => window.__app.engine.renderer.info.programs.length);
const idle = () => page.waitForFunction(() => window.__app.director.mode !== 'flying', null, { timeout: 400000, polling: 300 }).then(() => page.waitForTimeout(2500));
const phase = async (name, act) => {
  const p0 = await programs();
  await page.evaluate(() => (window.__frames.length = 0));
  await act();
  await idle();
  const fr = await page.evaluate(() => window.__frames);
  const worst = {};
  for (const f of fr) for (const [k, v] of Object.entries(f)) worst[k] = Math.max(worst[k] || 0, v);
  console.log(`${name}: programs +${(await programs()) - p0}, frames ${fr.length}, worst ms`, JSON.stringify(Object.fromEntries(Object.entries(worst).map(([k, v]) => [k, +v.toFixed(1)]))));
};
console.log('programs after load', await programs());
await phase('enter', () => page.evaluate(() => document.querySelector('.intro [data-act="start"]').click()));
await phase('region', () => page.evaluate(() => document.querySelector('.region-card[data-region="KUZEY-upper"]').click()));
await phase('seat', () => page.evaluate(() => {
  const p = window.__picker;
  const S = window.__app.stadium.layout.seats;
  const b = p.region.anchor;
  for (let i = b.seatStart + (b.seatCount >> 1); i < b.seatStart + b.seatCount; i++) if (S.sold[i] === 0) return p.chooseSeat(i);
}));
await phase('back to region', () => page.evaluate(() => window.__picker.back()));
await phase('regions', () => page.evaluate(() => window.__picker.back()));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
