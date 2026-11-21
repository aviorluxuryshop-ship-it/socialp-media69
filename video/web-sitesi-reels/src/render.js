// Frame-accurate renderer: drives window.__render(t) in headless Chromium and
// pipes screenshots into ffmpeg.
//   node render.js video  <out.mp4>  [fps=30] [start=0] [end=20]
//   node render.js stills <outDir>   t1 t2 t3 ...
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });

  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const s of rest) {
      const t = parseFloat(s);
      await page.evaluate((t) => window.__render(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`) });
    }
  } else {
    const fps = +(rest[0] || 30), start = +(rest[1] || 0), end = +(rest[2] || 20);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const f0 = Math.round(start * fps), f1 = Math.round(end * fps);
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      await page.evaluate((t) => window.__render(t), f / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if ((f - f0) % 60 === 0) console.log(`frame ${f}/${f1}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
})();
