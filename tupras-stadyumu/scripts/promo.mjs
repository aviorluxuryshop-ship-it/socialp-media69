// Promo video: renders the real site frame by frame on a fixed clock, then
// ffmpeg joins the frames. Every flight, fade and timer advances by exactly
// 1/fps per frame, so the film is smooth however slow the renderer is.
//
// node scripts/promo.mjs <outDir> [width] [height] [dpr] [fps] [region]
//   1280 720 1.5 30 → 1920×1080 @ 30 fps (≈ 4–5 s per frame with software GL)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }

const [, , out = 'promo', W = '1280', H = '720', DPR = '1.5', FPS = '30', REGION = 'DOGU-lower'] = process.argv;
const w = +W, h = +H, fps = +FPS, dt = 1 / fps;
const frames = `${out}/frames`;
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const DAY = 15 * 60; // 15:00, low November sun
const NIGHT = 18 * 60 + 50;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: +DPR });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:5173/?q=high&capture&t=15:00`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 300000 });

// ---- stage: virtual timers, stepped CSS animations, captions, cursor, end card
await page.evaluate(({ DAY }) => {
  const app = window.__app;
  app.clock.setOverride(DAY);
  // timers on the film's clock (the picker's flash and toast use setTimeout)
  let vt = 0, nid = 1;
  const q = new Map();
  window.setTimeout = (fn, ms = 0) => { const id = nid++; q.set(id, { at: vt + ms, fn }); return id; };
  window.clearTimeout = (id) => q.delete(id);
  window.__advance = (sec) => {
    vt += sec * 1000;
    for (const [id, t] of [...q]) if (t.at <= vt) { q.delete(id); t.fn(); }
    // CSS transitions / animations follow the film clock too
    for (const a of document.getAnimations()) {
      if (a.playState === 'finished') continue;
      a.pause();
      a.currentTime = (a.currentTime ?? 0) + sec * 1000;
    }
  };
  const css = document.createElement('style');
  css.textContent = `
    .timebox, .credits { display: none !important; }
    #promo { position: fixed; inset: 0; pointer-events: none; z-index: 100; font-family: var(--font-text); }
    #promo .cap { position: absolute; left: 44px; bottom: 46px; max-width: 60%; color: #f5f5f2; text-shadow: 0 2px 18px rgba(0,0,0,.55); }
    #promo .cap .n { font: 600 13px var(--font-text); letter-spacing: .28em; color: rgba(245,245,242,.7); margin-bottom: 8px; }
    #promo .cap .t { font: 700 46px/1 var(--font-display); letter-spacing: .01em; text-transform: uppercase; }
    #promo .cap .s { font: 500 16px/1.4 var(--font-text); color: rgba(245,245,242,.85); margin-top: 8px; }
    #promo .title { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,.5); background: radial-gradient(ellipse at center, rgba(0,0,0,.35), rgba(0,0,0,0) 65%); }
    #promo .title img { width: 64px; margin-bottom: 18px; filter: drop-shadow(0 4px 16px rgba(0,0,0,.5)); }
    #promo .title .k { font: 600 14px var(--font-text); letter-spacing: .4em; opacity: .85; }
    #promo .title .h { font: 700 88px/0.95 var(--font-display); letter-spacing: .02em; margin: 10px 0 14px; }
    #promo .title .s { font: 500 20px var(--font-text); opacity: .92; }
    #promo .end { position: absolute; inset: 0; background: #0a0a0b; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f5f5f2; text-align: center; }
    #promo .end img { width: 78px; margin-bottom: 22px; }
    #promo .end .h { font: 700 64px/1 var(--font-display); letter-spacing: .03em; }
    #promo .end .s { font: 500 19px var(--font-text); opacity: .8; margin-top: 12px; }
    #promo .end .u { margin-top: 30px; font: 600 17px var(--font-text); padding: 12px 22px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; letter-spacing: .02em; }
    #promo .cur { position: absolute; left: 0; top: 0; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%; background: rgba(255,255,255,.92); box-shadow: 0 2px 12px rgba(0,0,0,.45), 0 0 0 2px rgba(10,10,11,.35); }
    #promo .ring { position: absolute; left: 0; top: 0; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%; border: 2px solid #fff; }
    #promo .live { position: absolute; left: 44px; top: 86px; display: flex; align-items: center; gap: 8px; color: #fff; font: 600 13px var(--font-text); letter-spacing: .2em; }
    #promo .live i { width: 9px; height: 9px; border-radius: 50%; background: #ff3b47; box-shadow: 0 0 0 4px rgba(255,59,71,.25); }
  `;
  document.head.appendChild(css);
  const p = document.createElement('div');
  p.id = 'promo';
  p.innerHTML = `
    <div class="title" style="opacity:0"><img src="./brand/bjk-logo.svg" alt=""><div class="k">BEŞİKTAŞ JK</div><div class="h">TÜPRAŞ STADYUMU</div><div class="s">Koltuğunu seç. Sahayı oradan gör.</div></div>
    <div class="cap" style="opacity:0"><div class="n"></div><div class="t"></div><div class="s"></div></div>
    <div class="ring" style="opacity:0"></div>
    <div class="cur" style="opacity:0"></div>
    <div class="end" style="opacity:0"><img src="./brand/bjk-logo.svg" alt=""><div class="h">TÜPRAŞ STADYUMU</div><div class="s">3D koltuk seçimi · gerçek görüş · canlı satış</div><div class="u">tupras-stadyumu-iota.vercel.app</div></div>`;
  document.body.appendChild(p);
}, { DAY });

// ---- helpers
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const fade = (t, a, b, f = 0.45) => Math.max(0, Math.min(1, (t - a) / f, (b - t) / f));
const centerOf = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
// a free seat of the chosen region near the middle of the free screen area, whose
// centre and neighbours all pick back as that seat
const seatTarget = (bias = 0, strict = true) => page.evaluate(([bias, strict]) => {
  const a = window.__app, p = window.__picker, S = a.stadium.layout.seats, cam = a.engine.camera;
  cam.updateMatrixWorld();
  const V = cam.position.constructor, fa = p.area;
  const cx = fa.x + fa.w / 2 + bias, cy = fa.y + fa.h * 0.5;
  let best = null;
  for (const b of p.region.blocks) for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
    if (S.sold[i] !== 0) continue;
    const yaw = S.yaw[i];
    const v = new V(S.pos[i * 3] - Math.sin(yaw) * 0.19, S.pos[i * 3 + 1] + 8.5 + 0.62, S.pos[i * 3 + 2] - Math.cos(yaw) * 0.19).project(cam);
    if (Math.abs(v.z) > 1) continue;
    const x = Math.round((v.x * 0.5 + 0.5) * innerWidth), y = Math.round((-v.y * 0.5 + 0.5) * innerHeight);
    if (x < fa.x + 40 || x > fa.x + fa.w - 40 || y < fa.y + 40 || y > fa.y + fa.h - 40) continue;
    const d = Math.hypot(x - cx, y - cy);
    if (best && d >= best.d) continue;
    const hits = strict ? [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]].every(([dx, dy]) => a.selection.pickAt(x + dx, y + dy).seat === i) : p.region.blocks.some((b) => b.index === a.selection.pickAt(x, y).block);
    if (hits) best = { x, y, d, seat: i };
  }
  return best;
}, [bias, strict]);

// cursor state (film coordinates), caption state
const cur = { x: w * 0.7, y: h * 0.62, vis: 0, move: null, ring: -1 };
const moveTo = (t, to, d = 0.9) => (cur.move = { t0: t, d, fx: cur.x, fy: cur.y, tx: to.x, ty: to.y });
const click = async (t) => { cur.ring = t; await page.mouse.click(cur.x, cur.y); };
let cap = null; // { a, b, n, t, s }
const caption = (a, b, n, t, s = '') => (cap = { a, b, n, t, s });

// ---- timeline: [time (s), action]
let regionTarget = null;
const seq = [
  [0.0, async () => {}],
  [6.2, async () => { cur.vis = 1; moveTo(6.2, await centerOf('.intro [data-act="start"]'), 0.8); }],
  [7.15, async (t) => click(t)],
  [7.5, async () => { cur.vis = 0; }],
  [10.6, async () => caption(10.8, 13.6, '01', 'Bölgeni seç', 'Stadın içindesin. Doğu, Batı, kale arkası, VIP, localar.')],
  [12.2, async () => { cur.vis = 1; moveTo(12.2, await centerOf(`.region-card[data-region="${REGION}"]`), 0.9); }],
  [13.3, async (t) => click(t)],
  [13.6, async () => { cur.vis = 0; }],
  [16.0, async () => caption(16.2, 18.2, '02', 'Boş koltuklar yeşil', 'Satılanlar koyu. Hangi koltuğun boş olduğu tek bakışta belli.')],
  [18.3, async () => caption(18.5, 20.5, 'CANLI', 'Satılan koltuk anında kararır', 'Biri bilet aldığı an herkesin ekranında güncellenir.')],
  [18.9, async () => {
    // another fan buys a handful of seats in view
    await page.evaluate(() => {
      const a = window.__app, p = window.__picker, S = a.stadium.layout.seats, cam = a.engine.camera;
      const V = cam.position.constructor, fa = p.area, pick = [];
      for (const b of p.region.blocks) for (let i = b.seatStart; i < b.seatStart + b.seatCount; i += 7) {
        if (S.sold[i] !== 0) continue;
        const v = new V(S.pos[i * 3], S.pos[i * 3 + 1] + 9, S.pos[i * 3 + 2]).project(cam);
        const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
        if (Math.abs(v.z) < 1 && x > fa.x + fa.w * 0.25 && x < fa.x + fa.w * 0.75 && y > fa.y + fa.h * 0.3 && y < fa.y + fa.h * 0.7) pick.push(i);
      }
      const seats = pick.sort(() => 0.5 - Math.random()).slice(0, 14);
      p.onLiveSold(seats, true);
    });
  }],
  [20.6, async () => { regionTarget = await seatTarget(-40, false); cur.vis = 1; moveTo(20.6, regionTarget, 0.8); }],
  [21.55, async (t) => click(t)],
  [21.8, async () => { cur.vis = 0; }],
  [23.3, async () => caption(23.4, 26.2, '03', 'Koltuğuna dokun', 'Yakınlaşınca koltuklar parmakla seçilecek kadar büyür.')],
  [23.9, async () => { const s = await seatTarget(0); cur.vis = 1; moveTo(23.9, s, 1.0); }],
  [25.4, async (t) => click(t)],
  [25.7, async () => { cur.vis = 0; }],
  [26.4, async () => caption(26.6, 29.6, '04', 'Kamera seni koltuğuna götürür', '')],
  [30.0, async () => caption(30.2, 33.4, '05', 'Sahayı koltuğundan gör', 'Sıra, koltuk numarası ve fiyat hemen yanında.')],
  [30.2, async () => page.evaluate(() => { const c = window.__app.director.controls; c.autoRotate = true; c.autoRotateSpeed = -1.6; })],
  [33.2, async () => page.evaluate(() => { window.__app.director.controls.autoRotate = false; })],
  [33.3, async () => { cur.vis = 1; moveTo(33.3, await centerOf('[data-act="ticket"]'), 0.8); }],
  [34.25, async (t) => click(t)],
  [34.6, async () => caption(34.8, 38.4, '06', 'Dijital biletin hazır', 'Koltuğundan görünüşüyle birlikte.')],
  [35.6, async () => moveTo(35.6, await centerOf('.ticket [data-act="confirm"]'), 0.8)],
  [36.55, async (t) => click(t)],
  [38.6, async () => moveTo(38.6, await centerOf('.ticket-close'), 0.6)],
  [39.3, async (t) => click(t)],
  [39.6, async () => moveTo(39.6, await centerOf('.picker [data-act="close"]'), 0.5)],
  [40.2, async (t) => { await click(t); }],
  [40.5, async () => { cur.vis = 0; await page.evaluate(() => (document.querySelector('.intro').style.display = 'none')); }],
];
const END = 49;
const N = Math.round(END * fps);

// opening shot: a slow arc round the stadium in the low afternoon sun
const opening = (t) => {
  const k = ease(t / 7);
  const ang = (-1.95 + 0.42 * k);
  const r = 430 - 60 * k;
  const y = 210 - 40 * k;
  return { p: [Math.cos(ang) * r, y, -Math.sin(ang) * r], tg: [-10, 6, 0], fov: 46 };
};

let si = 0, cursorPrev = null;
const t0 = Date.now();
for (let f = 0; f < N; f++) {
  const t = f * dt;
  while (si < seq.length && seq[si][0] <= t + 1e-6) await seq[si++][1](t);
  // cursor motion
  if (cur.move) {
    const m = cur.move, k = ease((t - m.t0) / m.d);
    cur.x = m.fx + (m.tx - m.fx) * k;
    cur.y = m.fy + (m.ty - m.fy) * k - Math.sin(Math.PI * k) * 18;
    if (k >= 1) cur.move = null;
  }
  if (cur.vis && (!cursorPrev || cursorPrev.x !== cur.x || cursorPrev.y !== cur.y)) await page.mouse.move(cur.x, cur.y);
  cursorPrev = { x: cur.x, y: cur.y };
  const state = {
    t, dt,
    pose: t < 7.15 ? opening(t) : null,
    clock: t > 40.3 ? Math.round(DAY + (NIGHT - DAY) * ease((t - 40.3) / 3.6)) : null,
    title: fade(t, 0.5, 5.9, 0.7),
    cap: cap ? { o: fade(t, cap.a, cap.b, 0.35), n: cap.n, t: cap.t, s: cap.s, y: (1 - ease((t - cap.a) / 0.5)) * 14 } : null,
    intro: t < 5.7 ? '0' : t < 6.1 ? String((t - 5.7) / 0.4) : '',
    cur: { x: cur.x, y: cur.y, o: cur.vis ? 1 : 0 },
    ring: cur.ring >= 0 && t - cur.ring < 0.45 ? (t - cur.ring) / 0.45 : -1,
    end: fade(t, 45.2, 99, 0.9),
  };
  await page.evaluate((s) => {
    const a = window.__app;
    if (s.pose) {
      const V = a.engine.camera.position.constructor;
      a.director.applyPose({ position: new V(...s.pose.p), target: new V(...s.pose.tg), fov: s.pose.fov });
      a.director.controls.target.set(...s.pose.tg);
    }
    if (s.clock !== null) a.clock.setOverride(s.clock);
    window.__advance(s.dt);
    a.step(s.dt);
    const P = document.getElementById('promo');
    P.querySelector('.title').style.opacity = s.title;
    const c = P.querySelector('.cap');
    if (s.cap) {
      c.style.opacity = s.cap.o;
      c.style.transform = `translateY(${s.cap.y}px)`;
      c.querySelector('.n').textContent = s.cap.n;
      c.querySelector('.t').textContent = s.cap.t;
      c.querySelector('.s').textContent = s.cap.s;
    } else c.style.opacity = 0;
    const ib = document.querySelector('.intro');
    if (ib) ib.style.opacity = s.intro;
    const cu = P.querySelector('.cur');
    cu.style.opacity = s.cur.o;
    cu.style.transform = `translate(${s.cur.x}px, ${s.cur.y}px)`;
    const r = P.querySelector('.ring');
    r.style.opacity = s.ring < 0 ? 0 : 1 - s.ring;
    r.style.transform = `translate(${s.cur.x}px, ${s.cur.y}px) scale(${1 + s.ring * 1.8})`;
    P.querySelector('.end').style.opacity = s.end;
  }, state);
  await page.screenshot({ path: `${frames}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94 });
  if (f % 30 === 0) {
    const step = await page.evaluate(() => window.__picker.step);
    console.log(`frame ${f}/${N} t=${t.toFixed(2)} step=${step} elapsed=${((Date.now() - t0) / 60000).toFixed(1)} min`);
  }
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
execSync(`ffmpeg -y -loglevel error -framerate ${fps} -i ${frames}/%05d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart ${out}/promo.mp4`);
console.log('video', `${out}/promo.mp4`);
