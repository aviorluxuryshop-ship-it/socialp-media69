/**
 * Accessibility / integrity audit against the built static output.
 * Dev-only tooling. Usage: node scripts/audit.mjs <url> [width] [height]
 */
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , url, wArg, hArg] = process.argv;
const width = Number(wArg) || 1440;
const height = Number(hArg) || 900;

const userDir = path.join(os.tmpdir(), `sp-audit-${Date.now()}`);
const port = 9800 + Math.floor(Math.random() * 400);
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    `--window-size=${width},${height}`,
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no devtools endpoint');
}

const ws = new WebSocket(await endpoint());
await new Promise((res) => ws.addEventListener('open', res, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });

const { result: t } = await send('Target.createTarget', { url: 'about:blank' });
const { result: a } = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const s = a.sessionId;
await send('Page.enable', {}, s);
await send('Runtime.enable', {}, s);
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 }, s);
await send('Page.navigate', { url }, s);
await sleep(4000);

const EXPR = `(() => {
  const out = {};
  const de = document.documentElement;

  out.lang = de.lang;
  out.title = document.title;
  out.horizontalOverflow = de.scrollWidth > de.clientWidth;

  // Heading order
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  out.h1Count = hs.filter(h => h.tagName === 'H1').length;
  const skips = [];
  let prev = 0;
  for (const h of hs) {
    const lvl = +h.tagName[1];
    if (prev && lvl > prev + 1) skips.push(prev + '->' + lvl + ' @ ' + h.textContent.trim().slice(0, 34));
    prev = lvl;
  }
  out.headingSkips = skips;

  // Images
  const imgs = [...document.querySelectorAll('img')];
  out.imgTotal = imgs.length;
  out.imgMissingAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => i.src.split('/').pop());
  out.imgBroken = imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src);
  out.imgNoDims = imgs.filter(i => !i.getAttribute('width') || !i.getAttribute('height')).map(i => i.src.split('/').pop());

  // Links & buttons
  const links = [...document.querySelectorAll('a')];
  out.linkTotal = links.length;
  out.linksNoHref = links.filter(l => !l.getAttribute('href')).length;
  out.emptyName = [...document.querySelectorAll('a,button')]
    .filter(el => !el.textContent.trim() && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.querySelector('img[alt]:not([alt=""])'))
    .map(el => el.tagName + ':' + (el.className || '').toString().slice(0, 40));
  out.externalNoRel = links.filter(l => l.target === '_blank' && !/noopener/.test(l.rel || '')).map(l => l.href);

  // Anchor targets resolve
  out.deadAnchors = links
    .map(l => l.getAttribute('href'))
    .filter(h => h && h.includes('#') && !h.startsWith('http'))
    .map(h => h.slice(h.indexOf('#')))
    .filter(h => h.length > 1)
    .filter(h => !document.querySelector(h));

  // Pointer target size (WCAG 2.2 AA: 24x24 css px minimum for web)
  const small = [];
  for (const el of document.querySelectorAll('a,button,[role="tab"]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.width < 24 || r.height < 24) small.push(el.tagName + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' :: ' + el.textContent.trim().slice(0, 24));
  }
  out.smallTargets = small;

  // Landmarks
  out.landmarks = {
    header: document.querySelectorAll('header').length,
    main: document.querySelectorAll('main').length,
    footer: document.querySelectorAll('footer').length,
    navsWithLabel: [...document.querySelectorAll('nav')].filter(n => n.getAttribute('aria-label')).length,
    navsTotal: document.querySelectorAll('nav').length,
  };

  out.jsMotion = de.classList.contains('js-motion');
  return JSON.stringify(out, null, 1);
})()`;

const { result: r } = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true }, s);
console.log(r.result.value ?? JSON.stringify(r));

ws.close();
chrome.kill();
await sleep(500);
await rm(userDir, { recursive: true, force: true }).catch(() => {});
