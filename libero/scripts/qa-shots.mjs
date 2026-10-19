// Libero — görsel/erişilebilirlik tarama aracı.
//
//   BASE=http://localhost:3100 OUT=/tmp/libero-qa node scripts/qa-shots.mjs [--full] [--routes=/,/teknikler/]
//
// Her sayfayı 390 / 820 / 1280 px genişlikte açar; ekran görüntüsü kaydeder ve şunları raporlar:
// yatay taşma, konsol/sayfa hataları, başarısız iç istekler, alt metni olmayan <img>, adı olmayan
// düğme/bağlantı, birden fazla ya da hiç olmayan <h1>, mobilde çok küçük dokunma hedefleri.
// Dış ağ istekleri engellenir (çevrimdışı davranış denetlenir).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const OUT = process.env.OUT ?? '/tmp/libero-qa';
const FULL = process.argv.includes('--full');
const only = (process.argv.find((a) => a.startsWith('--routes=')) ?? '').slice(9).split(',').filter(Boolean);
const CHROME = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].filter(Boolean).find((p) => fs.existsSync(p));
const WIDTHS = [390, 820, 1280];

const ROUTES = only.length
  ? only
  : [
      '/', '/teknikler/', '/teknikler/ilk-temas/', '/teknikler/trivela-pasi/', '/teknikler/kavisli-pas/', '/teknikler/sert-sut/', '/teknikler/alin-kafa/',
      '/top-kontrolu/', '/taktik/', '/taktik/pres/', '/taktik/test/', '/taktik-tahtasi/', '/pozisyonlar/', '/pozisyonlar/kaleci/',
      '/fiziksel/', '/fiziksel/comelme/', '/program/', '/program/antrenman/', '/beslenme/', '/analiz/performans/', '/analiz/video/',
      '/analiz/oyuncular/', '/analiz/oyuncular/lionel-messi/', '/videolar/', '/profil/',
    ];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const findings = [];
const slug = (r) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/\//g, '_'));

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, isMobile: w < 600, hasTouch: w < 600 });
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort());
  for (const r of ROUTES) {
    const page = await ctx.newPage();
    const errs = [];
    const failed = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 160)));
    page.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource: net::/.test(t)) errs.push('console: ' + t.slice(0, 160));
    });
    page.on('response', (res) => {
      if (res.status() >= 400 && res.url().startsWith(BASE)) failed.push(`${res.status()} ${res.url().replace(BASE, '')}`);
    });
    try {
      const resp = await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 30000 });
      if (!resp || resp.status() !== 200) findings.push(`${w}px ${r}: HTTP ${resp?.status()}`);
      // tembel yüklenen / sonradan beliren içerik için kaydır
      const H = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < H; y += 700) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(60);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(350);
      const info = await page.evaluate((vw) => {
        const over = document.documentElement.scrollWidth - window.innerWidth;
        const noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
        const brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).map((i) => i.src.slice(0, 80));
        const unnamed = [...document.querySelectorAll('button, a[href]')].filter((el) => {
          const name = (el.getAttribute('aria-label') || el.textContent || '').trim() || el.querySelector('img[alt]')?.getAttribute('alt') || el.getAttribute('title');
          return !name;
        }).length;
        const h1 = document.querySelectorAll('h1').length;
        const smallMap = {};
        if (vw < 600) {
          for (const el of document.querySelectorAll('button, a[href], input, select')) {
            const b = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (b.width > 0 && b.height > 0 && (b.height < 24 || b.width < 24) && cs.visibility !== 'hidden' && cs.display !== 'inline') {
              const k = el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0];
              smallMap[k] = (smallMap[k] || 0) + 1;
            }
          }
        }
        const small = Object.entries(smallMap).map(([k, n]) => `${k}×${n}`).join(', ');
        return { over, noAlt, brokenImgs, unnamed, h1, small };
      }, w);
      if (info.over > 1) findings.push(`${w}px ${r}: yatay taşma ${info.over}px`);
      if (info.noAlt) findings.push(`${w}px ${r}: alt metni olmayan görsel ${info.noAlt}`);
      if (info.brokenImgs.length) findings.push(`${w}px ${r}: kırık görsel ${info.brokenImgs.join(', ')}`);
      if (info.unnamed) findings.push(`${w}px ${r}: adı olmayan düğme/bağlantı ${info.unnamed}`);
      if (info.h1 !== 1) findings.push(`${w}px ${r}: h1 sayısı ${info.h1}`);
      if (info.small) findings.push(`${w}px ${r}: 24px altı dokunma hedefi (satır içi bağlantılar hariç): ${info.small}`);
      for (const e of errs) findings.push(`${w}px ${r}: ${e}`);
      for (const f of failed) findings.push(`${w}px ${r}: ${f}`);
      await page.screenshot({ path: path.join(OUT, `${slug(r)}-${w}.png`), fullPage: FULL || w !== 1280 ? true : false });
    } catch (e) {
      findings.push(`${w}px ${r}: tarama hatası ${e.message.slice(0, 120)}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

console.log(`${ROUTES.length} sayfa × ${WIDTHS.length} genişlik tarandı; ekran görüntüleri: ${OUT}`);
if (findings.length) {
  console.log(`\nBULGULAR (${findings.length}):\n  ` + [...new Set(findings)].join('\n  '));
  process.exit(1);
}
console.log('Bulgu yok.');
