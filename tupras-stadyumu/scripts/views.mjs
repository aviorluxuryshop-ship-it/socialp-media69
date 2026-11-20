// Render every locked view at the given times: node scripts/views.mjs <outDir> "11:00,17:40,22:30" [extra qs] [w] [h]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const [, , out, times = '11:00', extra = '', w = '1280', h = '720', only = ''] = process.argv;
mkdirSync(out, { recursive: true });
const views = only ? only.split(',') : ['ustten', 'dis', 'uzun', 'kale', 'vip', 'cati', 'bogaz'];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[error]', m.text().slice(0, 300)); });
for (const t of times.split(',')) {
  for (const v of views) {
    const qs = `view=${v}&t=${t}${extra ? '&' + extra : ''}`;
    await page.goto(`http://127.0.0.1:5173/?${qs}`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 240000 });
    await page.waitForTimeout(2200);
    const file = `${out}/${v}_${t.replace(':', '')}.png`;
    await page.screenshot({ path: file });
    console.log(file);
  }
}
await browser.close();
