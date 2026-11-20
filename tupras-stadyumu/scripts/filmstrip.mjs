// Capture frames along a flight: node scripts/filmstrip.mjs <outDir> <mode> <arg> [frames] [qs]
//   mode = seat  arg = "<blockCode>:<row>"   (flight from the start pose to that seat)
//   mode = view  arg = "<from>:<to>"         (flight between two locked views)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, mode, arg, n = '12', qs = 't=13:00&q=high'] = process.argv;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[error]', m.text().slice(0, 200)); });
const from = mode === 'view' ? arg.split(':')[0] : '';
await page.goto(`http://127.0.0.1:5173/?${qs}${from ? '&view=' + from : ''}`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 240000 });
await page.waitForTimeout(1500);
const info = await page.evaluate(([mode, arg]) => {
  const app = window.__app;
  if (mode === 'seat') {
    const [code, row] = arg.split(':');
    const L = app.stadium.layout;
    const b = L.blocks.find((x) => x.code === code);
    const r = Math.min(Number(row), b.rows) - 1;
    const seat = Math.floor((b.rowStart[r] + b.rowStart[r + 1]) / 2);
    app.flyToSeat(seat);
  } else {
    const to = app.views.find((v) => v.id === arg.split(':')[1]);
    app.flyToView(to);
  }
  app.director.speed = 0;
  const f = app.director.flight;
  return { duration: f.duration, segments: f.segments.map((s) => `${s.label}@${s.end.toFixed(1)}`) };
}, [mode, arg]);
console.log(JSON.stringify(info));
const N = Number(n);
for (let i = 0; i < N; i++) {
  const t = (info.duration * i) / (N - 1);
  await page.evaluate((t) => window.__app.director.seek(t), t);
  await page.waitForTimeout(1200);
  const seg = await page.evaluate(() => window.__app.director.segment?.label ?? '');
  await page.screenshot({ path: `${out}/f${String(i).padStart(2, '0')}.png` });
  console.log(`f${i} t=${t.toFixed(2)} ${seg}`);
}
await browser.close();
