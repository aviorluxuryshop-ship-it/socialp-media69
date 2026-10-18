// Hareket kontak şeridi (contact sheet): bir tekniğin hareketini birkaç zamanda PNG olarak çizer.
//
//   node scripts/motion-sheet.mjs ilk-temas
//   node scripts/motion-sheet.mjs ilk-temas --times=0,0.6,1.2,1.5,1.8,2.4,3.4 --scales=1,2 --cols=4 --width=480 --out=/tmp/mo-shots
//
// Gerçek sayfa bileşenlerini (components/tech-motion/Stage.tsx) sunucuda çizer, tokens.css + tech-motion.css ile
// Chromium'da görüntüler. Çıktı: <out>/<id>-sheet@<ölçek>x.png. Dış ağ gerekmez.
// Görseli mutlaka bakarak değerlendirin: ayak yere basıyor mu, top temas bölgesinde mi, uzuvlar doğal mı.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { buildMotion, root } from './_motion-build.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--')) ?? 'ilk-temas';
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const scales = opt('scales', '1,2').split(',').map(Number);
const cols = Number(opt('cols', '4'));
const width = Number(opt('width', '480'));
const out = opt('out', '/tmp/mo-shots');
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', process.env.CHROME_PATH].filter(Boolean).find((p) => fs.existsSync(p));

const b = await buildMotion();
const React = (await import('react')).default ?? (await import('react'));
const { renderToStaticMarkup } = await import('react-dom/server');
const { MOTIONS } = await b.load('data/technique-motion/index.js');
const tl = await b.load('lib/motion/timeline.js');
const { Stage } = await b.load('components/tech-motion/Stage.js');
const m = MOTIONS[id];
if (!m) throw new Error(`Hareket yok: ${id} (kayıtlı: ${Object.keys(MOTIONS).join(', ')})`);

const timesArg = opt('times', '');
let times;
if (timesArg) times = timesArg.split(',').map(Number);
else {
  const n = 12;
  times = Array.from({ length: n }, (_, i) => Math.round(((m.dur * i) / (n - 1)) * 100) / 100);
  times.push(m.tc);
  times = [...new Set(times)].sort((a, c) => a - c);
}
const c = tl.compileMotion(m);
const h = React.createElement;
// tüm kareler TEK React ağacında çizilir: SVG kimlikleri (useId) birbirinden farklı olur
const cells = times.map((t) => {
  const f = tl.frameAt(m, t, c);
  const lab = `t = ${t.toFixed(2)} sn · ${tl.PHASE_LABEL[f.phase]}${Math.abs(t - m.tc) < 1e-6 ? ' · TEMAS ANI' : ''}`;
  return h('div', { className: 'cell', key: t }, h('div', { className: 'lab mono' }, lab), h('div', { className: 'tm' }, h(Stage, { m, frame: f, label: `${m.label}, ${tl.PHASE_LABEL[f.phase]}`, planLabel: 'Üstten bakış' })));
});
const gridHtml = renderToStaticMarkup(h('div', { className: 'grid' }, cells));
const css = ['styles/tokens.css', 'styles/tech-motion.css'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const html = `<!doctype html><html lang="tr" class="js"><head><meta charset="utf-8"><style>${css}
body{margin:0;background:var(--ink-900);color:var(--ivory);font-family:system-ui,sans-serif;padding:16px}
.grid{display:grid;grid-template-columns:repeat(${cols},${width}px);gap:14px}
.lab{color:var(--ivory-3);margin-bottom:6px}
.mono{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.06em}
</style></head><body><h1 style="font:600 14px system-ui;margin:0 0 12px">${id} — ${m.label}</h1>${gridHtml}</body></html>`;

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
for (const s of scales) {
  const ctx = await browser.newContext({ viewport: { width: cols * width + (cols - 1) * 14 + 32, height: 900 }, deviceScaleFactor: s });
  const page = await ctx.newPage();
  await page.setContent(html);
  const file = path.join(out, `${id}-sheet@${s}x.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
  await ctx.close();
}
await browser.close();
b.cleanup();
