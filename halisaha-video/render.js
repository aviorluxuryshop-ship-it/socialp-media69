const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [,, out, from, to, step] = process.argv;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', m => console.log('PAGE', m.text()));
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('http://127.0.0.1:8765/scene.html');
  await page.waitForFunction(() => window.sceneReady, null, { timeout: 60000 });
  const total = await page.evaluate(() => window.TOTAL_FRAMES);
  const a = +from || 0, b = Math.min(+to || total, total), st = +step || 1;
  const el = await page.$('#wrap');
  const t0 = Date.now();
  for (let f = a; f < b; f += st) {
    await page.evaluate(f => window.renderFrame(f), f);
    await el.screenshot({ path: `${out}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    if (f % 100 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await browser.close();
})();
