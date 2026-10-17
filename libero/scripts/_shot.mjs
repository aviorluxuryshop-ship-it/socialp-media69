import { chromium } from 'playwright-core';
const [,, url, out, w = '1280', y = '0', h = '900'] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, isMobile: +w < 600, hasTouch: +w < 600 });
await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
const page = await ctx.newPage();
await page.goto('http://localhost:3100' + url, { waitUntil: 'networkidle' });
const H = await page.evaluate(() => document.documentElement.scrollHeight);
for (let yy = 0; yy <= +y; yy += 400) { await page.evaluate((v) => window.scrollTo(0, v), yy); await page.waitForTimeout(120); }
await page.evaluate((v) => window.scrollTo(0, v), +y);
await page.waitForTimeout(1600);
await page.screenshot({ path: out });
console.log('page height', H);
await b.close();
