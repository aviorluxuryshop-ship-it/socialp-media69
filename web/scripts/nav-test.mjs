/**
 * Interaction test: cross-page and in-page anchor navigation with Lenis active.
 * Dev-only tooling. Usage: node scripts/nav-test.mjs <baseUrl>
 */
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = process.argv[2] || 'http://127.0.0.1:4321';
const userDir = path.join(os.tmpdir(), `sp-nav-${Date.now()}`);
const port = 9600 + Math.floor(Math.random() * 300);

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
   '--window-size=1440,900', '--no-first-run', 'about:blank'],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('no endpoint');
}

const ws = new WebSocket(await endpoint());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}, sessionId) =>
  new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params, sessionId })); });

const { result: t } = await send('Target.createTarget', { url: 'about:blank' });
const { result: at } = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const s = at.sessionId;
await send('Page.enable', {}, s);
await send('Runtime.enable', {}, s);
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, s);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, s);

const evalJs = async (expression) => {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, s);
  return result.result?.value;
};

async function go(url) {
  await send('Page.navigate', { url }, s);
  await sleep(3500);
}

const report = [];

// 1. In-page anchor from the home page.
await go(`${base}/tr/`);
await evalJs(`document.querySelector('header nav a[href*="#calismalarimiz"]').click()`);
await sleep(2200);
report.push(await evalJs(`(()=>{const el=document.getElementById('calismalarimiz');const top=el.getBoundingClientRect().top;
 return 'in-page  -> #calismalarimiz  scrollY='+Math.round(scrollY)+'  sectionTop='+Math.round(top)+'  '+(Math.abs(top)<140?'PASS':'FAIL')})()`));

// 2. Cross-page anchor from a service detail page back to the home contact block.
await go(`${base}/tr/hizmetler/web-tasarim-kurulum/`);
await evalJs(`document.querySelector('header nav a[href*="#iletisim"]').click()`);
await sleep(4000);
report.push(await evalJs(`(()=>{const el=document.getElementById('iletisim');
 if(!el) return 'cross-page -> #iletisim  FAIL (section missing, path='+location.pathname+')';
 const top=el.getBoundingClientRect().top;
 return 'cross-page -> #iletisim  path='+location.pathname+'  scrollY='+Math.round(scrollY)+'  sectionTop='+Math.round(top)+'  '+(Math.abs(top)<160?'PASS':'FAIL')})()`));

// 3. Deep link straight to a hash.
await go(`${base}/tr/#hakkimizda`);
await sleep(1500);
report.push(await evalJs(`(()=>{const el=document.getElementById('hakkimizda');const top=el.getBoundingClientRect().top;
 return 'deep link -> #hakkimizda  scrollY='+Math.round(scrollY)+'  sectionTop='+Math.round(top)+'  '+(Math.abs(top)<200?'PASS':'FAIL')})()`));

// 4. Language switch preserves the site and lands on the EN home.
await go(`${base}/tr/`);
await evalJs(`document.querySelector('a[hreflang="en"]').click()`);
await sleep(3000);
report.push(await evalJs(`'lang switch -> path='+location.pathname+'  h1="'+document.querySelector('h1').textContent.trim()+'"  '+(location.pathname.startsWith('/en')?'PASS':'FAIL')`));

console.log(report.join('\n'));

ws.close();
chrome.kill();
await sleep(500);
await rm(userDir, { recursive: true, force: true }).catch(() => {});
