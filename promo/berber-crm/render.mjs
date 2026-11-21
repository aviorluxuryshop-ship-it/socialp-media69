// Renders index.html frame-by-frame into an MP4 with the synthesised soundtrack.
//
//   python3 audio.py out/soundtrack.wav
//   node render.mjs                      -> out/berber-crm-tanitim.mp4 (+ out/kapak.jpg)
//   node render.mjs --from 10 --to 19    -> quick partial render for checking a scene
//
// Each frame is produced by seeking every animation to an exact time, so the
// output is deterministic and never drops frames, however slow the machine is.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };

const out = path.resolve(here, arg('--out', 'out/berber-crm-tanitim.mp4'));
const audio = path.resolve(here, arg('--audio', 'out/soundtrack.wav'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?render');
await page.evaluate(() => window.ready);
const { DUR, FPS } = await page.evaluate(() => ({ DUR: window.DUR, FPS: window.FPS }));

const from = parseFloat(arg('--from', '0'));
const to = Math.min(DUR, parseFloat(arg('--to', String(DUR))));
const first = Math.round(from * FPS), last = Math.round(to * FPS);

const ff = spawn('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-ss', String(from), '-t', String(to - from), '-i', audio,
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
  '-movflags', '+faststart', '-shortest', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = first; f < last; f++) {
  await page.evaluate(t => window.seek(t), f / FPS);
  const buf = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
  if ((f - first) % 150 === 0) console.log(`frame ${f - first}/${last - first}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
const [code] = await once(ff, 'close');

if (!process.argv.includes('--from')) {
  // cover image for the Reels/TikTok thumbnail: the hook, fully on screen
  await page.evaluate(t => window.seek(t), 3.2);
  await page.screenshot({ path: path.join(path.dirname(out), 'kapak.jpg'), type: 'jpeg', quality: 92 });
}
await browser.close();
if (code !== 0) { console.error('ffmpeg failed', code); process.exit(1); }
console.log('done ->', out, `in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
