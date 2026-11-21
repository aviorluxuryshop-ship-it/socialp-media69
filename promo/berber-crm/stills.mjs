// Usage: node stills.mjs <outDir> t1 t2 ...   — saves PNG stills at the given seconds.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, ...times] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?render');
await page.evaluate(() => window.ready);
for (const t of times) {
  await page.evaluate(t => window.seek(t), parseFloat(t));
  await page.screenshot({ path: path.join(outDir, `t${String(t).padStart(5, '0')}.png`) });
}
await browser.close();
