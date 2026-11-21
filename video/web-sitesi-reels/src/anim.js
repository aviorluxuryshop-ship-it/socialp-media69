'use strict';
/*
 * Socialp Media — "İşletmenize özel web sitesi" Reels (1080x1920, 20 s)
 * Every frame is a pure function of time t (seconds): window.__render(t).
 * All cue times are locked to the voiceover (VO starts at t = 0.35 s).
 */
const W = 1080, H = 1920, DUR = 20;
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const E = {
  out2: (x) => 1 - (1 - x) * (1 - x),
  out3: (x) => 1 - Math.pow(1 - x, 3),
  out4: (x) => 1 - Math.pow(1 - x, 4),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  in2: (x) => x * x,
  in3: (x) => x * x * x,
  inOut3: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
};
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };
/** keyframe interpolation: kf = [[t, v], ...] */
const kfv = (kf, t) => {
  if (t <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) if (t <= kf[i][0]) {
    const [t0, v0] = kf[i - 1], [t1, v1] = kf[i];
    return lerp(v0, v1, E.inOut3(seg(t, t0, t1)));
  }
  return kf[kf.length - 1][1];
};
/** decaying pulse sum: list = [[t, amp]] */
const pulse = (list, t, k = 9) => list.reduce((s, [ti, a]) => s + (t >= ti ? a * Math.exp(-(t - ti) * k) : 0), 0);

/* ------------------------------------------------------------------ */
/* element placement: x,y are the element CENTRE in stage pixels       */
const sizes = new Map();
function T(el, o = {}) {
  if (!sizes.has(el)) sizes.set(el, [el.offsetWidth, el.offsetHeight]);
  const [w, h] = sizes.get(el);
  const x = (o.x ?? W / 2) - w / 2, y = (o.y ?? H / 2) - h / 2;
  let tr = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
  if (o.rx || o.ry) tr += ` perspective(${o.p || 1800}px) rotateX(${(o.rx || 0).toFixed(3)}deg) rotateY(${(o.ry || 0).toFixed(3)}deg)`;
  if (o.rz) tr += ` rotate(${o.rz.toFixed(3)}deg)`;
  const s = o.s ?? 1, sx = o.sx ?? 1;
  if (s !== 1 || sx !== 1) tr += ` scale(${(s * sx).toFixed(4)},${s.toFixed(4)})`;
  el.style.transform = tr;
  const op = clamp(o.o ?? 1);
  el.style.opacity = op.toFixed(3);
  el.style.visibility = op <= 0.002 ? 'hidden' : 'visible';
  const f = [];
  if ((o.blur || 0) > 0.25) f.push(`blur(${o.blur.toFixed(2)}px)`);
  if (o.f) f.push(o.f);
  el.style.filter = f.length ? f.join(' ') : 'none';
}
/** reveal a word/line span: blur-up */
function rv(el, t, t0, { dy = 46, blur = 16, dur = 0.42, s0 = 1 } = {}) {
  const p = E.out3(seg(t, t0 - 0.04, t0 - 0.04 + dur));
  el.style.opacity = p.toFixed(3);
  const sc = lerp(s0, 1, p);
  el.style.transform = `translateY(${((1 - p) * dy).toFixed(2)}px)` + (sc !== 1 ? ` scale(${sc.toFixed(4)})` : '');
  el.style.filter = p < 0.995 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : 'none';
  return p;
}
const wordsOf = new Map();
function words(el, t, opt) {
  if (!wordsOf.has(el)) wordsOf.set(el, [...el.querySelectorAll('[data-t]')]);
  for (const w of wordsOf.get(el)) rv(w, t, +w.dataset.t, opt);
}
const typed = (str, t, a, b) => str.slice(0, Math.round(str.length * seg(t, a, b)));
const show = (el, on) => { el.style.display = on ? '' : 'none'; };

/* ------------------------------------------------------------------ */
/* background: glowing silk ribbons + soft light, drawn at half res    */
const bg = $('bg'), bx = bg.getContext('2d');
function blob(x, y, r, c, a) {
  if (a <= 0.002) return;
  const g = bx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
  g.addColorStop(0.45, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.38})`);
  g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
  bx.fillStyle = g; bx.fillRect(0, 0, 540, 960);
}
function ribbons(t, e, cy, rot, amp, hueShift) {
  bx.save();
  bx.translate(270, cy); bx.rotate(rot);
  for (let k = 0; k < 34; k++) {
    const ph = k * 0.055;
    bx.beginPath();
    for (let i = 0; i <= 70; i++) {
      const u = i / 70, x = -720 + u * 1440;
      const y = amp * Math.sin(u * 3.1 + t * 0.75 + ph * 2.2) + amp * 0.45 * Math.sin(u * 6.7 - t * 0.55 + ph * 1.3) + k * 3.2 - 54;
      i ? bx.lineTo(x, y) : bx.moveTo(x, y);
    }
    const a = (0.045 + 0.04 * Math.sin(k * 0.45 + t * 1.3)) * e;
    bx.strokeStyle = `rgba(255,${(40 + k * 3 + hueShift) | 0},${(45 + k) | 0},${a.toFixed(3)})`;
    bx.lineWidth = 1.6; bx.stroke();
  }
  bx.restore();
}
// energy & framing per moment of the film
const KF_E = [[0, 0.7], [1.15, 0.85], [1.3, 1.35], [2.6, 0.75], [5.2, 0.6], [6.2, 0.38], [8.3, 0.22], [8.62, 1.55], [9.8, 0.95], [15, 0.85], [17.55, 1.0], [18.3, 1.15], [20, 1.05]];
const KF_CY = [[0, 620], [2.6, 640], [5.4, 830], [8.4, 760], [8.7, 470], [10.6, 470], [11, 720], [15.3, 760], [17.6, 520], [20, 520]];
const KF_ROT = [[0, -0.42], [5.4, -0.25], [8.6, -0.5], [10.6, -0.5], [11, 0.32], [15.3, 0.42], [17.6, -0.35], [20, -0.3]];
function drawBg(t) {
  const e = kfv(KF_E, t) + pulse([[1.25, 0.5], [8.62, 0.7], [18.7, 0.25]], t, 4);
  bx.globalCompositeOperation = 'source-over';
  bx.fillStyle = '#050506'; bx.fillRect(0, 0, 540, 960);
  bx.globalCompositeOperation = 'lighter';
  const cy = kfv(KF_CY, t);
  blob(270 + 90 * Math.sin(t * 0.37), cy - 40 + 50 * Math.cos(t * 0.29), 430, [255, 28, 40], 0.20 * e);
  blob(90 + 70 * Math.cos(t * 0.33), 820 + 50 * Math.sin(t * 0.41), 360, [140, 8, 22], 0.30 * e);
  blob(470 + 30 * Math.sin(t * 0.5), 140 + 40 * Math.sin(t * 0.47), 300, [190, 20, 30], 0.20 * e);
  blob(300, cy, 200, [255, 110, 70], 0.07 * e);
  ribbons(t, e, cy, kfv(KF_ROT, t), 92, 0);
  ribbons(t * 0.8 + 3, e * 0.55, cy + 140, kfv(KF_ROT, t) + 0.35, 70, 30);
}

/* film grain */
const grain = $('grain');
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = (hash(i * 0.731) * 255) | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
  grain.style.backgroundImage = `url(${c.toDataURL()})`;
})();

/* odometer year */
const yearEl = $('year'), strips = [];
for (let i = 0; i < 4; i++) {
  const col = document.createElement('div');
  col.style.cssText = `position:absolute;left:${i * 190}px;top:0;width:190px;height:340px;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 11%,#000 89%,transparent 100%)`;
  const st = document.createElement('div');
  st.style.cssText = 'will-change:transform';
  st.innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) =>
    `<div style="height:340px;line-height:340px;text-align:center;font:900 300px/340px Archivo,sans-serif;letter-spacing:-.02em;color:#fff">${n}</div>`).join('');
  col.appendChild(st); yearEl.appendChild(col); strips.push(st);
}
const yearVal = (t) => 1990 + 36 * E.out4(seg(t, 0.02, 1.25));

/* speed lines for "hızlı" */
const zips = [];
for (let i = 0; i < 7; i++) {
  const z = document.createElement('div');
  z.className = 'a';
  z.style.cssText = `width:${380 + hash(i + 4) * 420}px;height:${2 + (i % 3)}px;border-radius:4px;background:linear-gradient(90deg,rgba(255,60,70,0),rgba(255,255,255,.95));box-shadow:0 0 18px rgba(255,60,70,.9)`;
  $('s5').appendChild(z); zips.push(z);
}
/* sheen band for "tasarlıyoruz" */
function addSheen(host) {
  const s = document.createElement('div');
  s.style.cssText = 'position:absolute;top:-20%;left:0;width:34%;height:140%;pointer-events:none;z-index:20;mix-blend-mode:screen;background:linear-gradient(100deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.28) 50%,rgba(255,255,255,0) 100%)';
  host.style.position = host.style.position || 'relative';
  host.appendChild(s); return s;
}
const sheenD = addSheen($('desk')), sheenP = addSheen($('ph2').querySelector('.screen'));

/* ------------------------------------------------------------------ */
const S = { s1: $('s1'), s2: $('s2'), s3: $('s3'), s4: $('s4'), s5: $('s5'), s6: $('s6'), s7: $('s7') };
const IMPACTS = [[1.25, 20], [4.65, 12], [7.61, 15], [8.62, 18], [18.72, 7]];

function render(t) {
  drawBg(t);
  grain.style.backgroundPosition = `${(hash(Math.floor(t * 30)) * 256) | 0}px ${(hash(Math.floor(t * 30) + 99) * 256) | 0}px`;

  // camera: impact shake + punch zoom + slow breathing
  let sx = 0, sy = 0, sr = 0;
  for (const [ti, a] of IMPACTS) {
    const d = t - ti; if (d < 0 || d > 0.9) continue;
    const k = a * Math.exp(-d * 7.5);
    sx += k * (noise(d * 34 + ti * 7) - 0.5) * 2;
    sy += k * (noise(d * 34 + ti * 7 + 40) - 0.5) * 2;
    sr += k * 0.025 * (noise(d * 28 + ti * 3) - 0.5);
  }
  const zoom = 1 + pulse(IMPACTS.map(([ti, a]) => [ti, a * 0.0016]), t, 6) + 0.006 * Math.sin(t * 0.6);
  $('cam').style.transform = `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px) rotate(${sr.toFixed(3)}deg) scale(${zoom.toFixed(4)})`;
  $('flash').style.opacity = clamp(pulse([[1.25, 0.14], [8.62, 0.38], [18.72, 0.06]], t, 12)).toFixed(3);
  $('tint').style.opacity = clamp(pulse([[1.25, 0.4], [4.65, 0.3], [7.61, 0.38]], t, 4)).toFixed(3);

  show(S.s1, t < 5.7); show(S.s2, t > 2.6 && t < 5.7); show(S.s3, t > 5.3 && t < 8.7);
  show(S.s4, t > 8.2 && t < 11); show(S.s5, t > 10.5 && t < 17.9); show(S.s6, t > 15.3 && t < 17.9); show(S.s7, t > 17.35);

  const out2 = E.in3(seg(t, 5.22, 5.58));          // whip-out of the hook scenes
  if (t < 5.7) scene12(t, out2);
  if (t > 5.3 && t < 8.7) scene3(t);
  if (t > 8.2 && t < 11) scene4(t);
  if (t > 10.5 && t < 17.9) scene5(t);
  if (t > 15.3 && t < 17.9) scene6(t);
  if (t > 17.35) scene7(t);
}

/* ---------------- 0.0 – 5.6  "Yıl olmuş 2026… Hâlâ … yok mu?" ---------------- */
function scene12(t, out) {
  // odometer
  const v = yearVal(t), dv = (yearVal(t + 0.01) - v) / 0.01;
  const ones = v % 10;
  const tens = (Math.floor(v / 10) % 10) + clamp(ones - 9);
  const hund = (Math.floor(v / 100) % 10) + (v % 100 >= 99 ? clamp((v % 100) - 99) : 0);
  const thou = (Math.floor(v / 1000) % 10) + (v % 1000 >= 999 ? clamp((v % 1000) - 999) : 0);
  [thou, hund, tens, ones].forEach((p, i) => {
    strips[i].style.transform = `translateY(${(-p * 340).toFixed(2)}px)`;
  });
  strips[3].style.filter = dv > 3 ? `blur(${Math.min(9, dv * 0.09).toFixed(2)}px)` : 'none';
  strips[2].style.filter = dv > 30 ? `blur(${Math.min(4, dv * 0.02).toFixed(2)}px)` : 'none';

  const up = E.inOut3(seg(t, 2.42, 2.95));
  const yS = lerp(0.84, 1, E.out3(seg(t, 0, 1.25))) + pulse([[1.25, 0.075]], t, 8) - pulse([[1.18, 0.02]], t, 30);
  T(yearEl, {
    x: 540, y: lerp(900, 318, up) - out * 520, s: lerp(yS, 0.44, up),
    o: 1 - out, blur: (1 - E.out3(seg(t, 0, 0.3))) * 6 + out * 26,
    f: `drop-shadow(0 0 ${(26 + pulse([[1.25, 30]], t, 4)).toFixed(1)}px rgba(255,45,54,.75))`,
  });
  const kick = $('kick1');
  $('kick1t').textContent = typed('Yıl olmuş', t, 0.42, 0.95);
  T(kick, { x: 540, y: 690, o: E.out2(seg(t, 0.35, 0.5)) * (1 - E.in2(seg(t, 2.3, 2.6))), blur: E.in2(seg(t, 2.3, 2.6)) * 10 });
  T($('yline'), { x: 540, y: 1078, sx: E.outExpo(seg(t, 1.25, 1.75)) + 0.0001, o: (t > 1.25 ? 1 : 0) * (1 - E.in2(seg(t, 2.3, 2.6))) });
  const rp = seg(t, 1.25, 2.05);
  T($('ring1'), { x: 540, y: 900, s: lerp(0.25, 2.2, E.out3(rp)), o: t < 1.25 ? 0 : (1 - rp) * 0.9 });

  if (t < 2.6) return;
  // headline
  const h2 = $('h2');
  words(h2, t);
  T(h2, { x: 540, y: 655 - out * 520, o: 1 - out, blur: out * 24 });
  // broken browser
  const br = $('br1');
  const bi = E.out3(seg(t, 2.95, 3.5));
  const gl = t > 4.62 && t < 5.0 ? 1 : 0;
  const jx = gl * (hash(Math.floor(t * 60)) - 0.5) * 34;
  T(br, {
    x: 540 + jx, y: lerp(1500, 1205, bi) - out * 620, s: lerp(0.9, 1, bi), rx: lerp(22, 0, bi),
    o: bi * (1 - out), blur: (1 - bi) * 16 + out * 26,
    f: gl ? `drop-shadow(${(6 + jx * 0.3).toFixed(1)}px 0 0 rgba(255,0,70,.75)) drop-shadow(${(-6 - jx * 0.3).toFixed(1)}px 0 0 rgba(0,230,255,.6))` : '',
  });
  const redGlow = clamp(pulse([[4.62, 1]], t, 2.2));
  br.style.borderColor = `rgba(${lerp(255, 255, redGlow) | 0},${lerp(255, 70, redGlow) | 0},${lerp(255, 80, redGlow) | 0},${lerp(0.15, 0.85, redGlow).toFixed(2)})`;
  br.style.boxShadow = `0 40px 90px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.22), 0 0 ${(redGlow * 90) | 0}px rgba(255,40,50,${(redGlow * 0.7).toFixed(2)})`;
  $('url1').textContent = typed('www.isletmeniz.com', t, 3.08, 3.85);
  $('car1').style.opacity = (t < 3.9 || Math.floor(t * 2.6) % 2 === 0) && t < 4.62 ? 1 : 0;
  const sp = $('spin1');
  sp.style.opacity = t > 3.9 && t < 4.62 ? 1 : 0;
  sp.style.transform = `rotate(${(t * 760) % 360}deg)`;
  const er = $('err1');
  const ep = E.out3(seg(t, 4.62, 4.9));
  er.style.opacity = t < 4.62 ? 0 : (gl ? (hash(Math.floor(t * 50) + 7) > 0.25 ? 1 : 0.35) : 1);
  er.style.transform = `scale(${lerp(0.86, 1, ep).toFixed(4)}) translateX(${(gl * (hash(Math.floor(t * 45) + 3) - 0.5) * 26).toFixed(1)}px)`;
}

/* ---------------- 5.4 – 8.6  "Müşterileriniz sizi arıyor… ama bulamıyor." ---------------- */
function scene3(t) {
  const out = E.in3(seg(t, 8.12, 8.55));
  const h3a = $('h3a'), h3b = $('h3b');
  words(h3a, t); words(h3b, t);
  T(h3a, { x: 540, y: 330, o: 1 - out, blur: out * 20, s: 1 - out * 0.2 });
  const bump = pulse([[7.61, 1]], t, 7);
  T(h3b, { x: 540 + Math.sin(t * 70) * bump * 10, y: 548, o: 1 - out, blur: out * 20, s: (1 - out * 0.2) });

  const ph = $('ph1');
  const pin = E.out4(seg(t, 5.38, 6.05));
  const push = E.inOut3(seg(t, 6.0, 8.2));
  const shakeX = Math.sin((t - 7.55) * 75) * pulse([[7.55, 16]], t, 6);
  T(ph, {
    x: 540 + shakeX, y: lerp(1900, 1140, pin) + out * 140, s: lerp(0.86, 0.9, push) * (1 - out * 0.35),
    rx: lerp(28, 0, pin), o: pin * (1 - out), blur: (1 - pin) * 12 + out * 22,
  });
  $('q1').textContent = typed('yakınımdaki en iyi kafe', t, 5.78, 6.62);
  $('car2').style.opacity = (t < 6.7 || Math.floor(t * 2.6) % 2 === 0) ? 1 : 0;
  ['r1', 'r2', 'r3'].forEach((id, i) => rv($(id), t, 6.74 + i * 0.13, { dy: 40, blur: 10, dur: 0.38 }));
  const r4 = $('r4');
  const p4 = rv(r4, t, 7.52, { dy: 0, blur: 12, dur: 0.3, s0: 0.86 });
  const rb = pulse([[7.61, 1]], t, 5);
  r4.style.boxShadow = `0 0 ${(30 + rb * 60) | 0}px rgba(255,40,50,${(0.25 + rb * 0.5) * p4})`;
  r4.style.transform += ` translateX(${(Math.sin((t - 7.6) * 80) * rb * 14).toFixed(1)}px)`;
}

/* ---------------- 8.3 – 10.9  "Biz, tam da bunun için varız." ---------------- */
function scene4(t) {
  const out = E.in3(seg(t, 10.48, 10.86));
  const sk = $('streak');
  const sIn = E.outExpo(seg(t, 8.3, 8.62));
  T(sk, { x: 540, y: 800, sx: Math.max(0.001, sIn * (1 + E.out3(seg(t, 8.62, 9.4)) * 0.6)), s: lerp(1, 0.4, seg(t, 8.62, 9.3)), o: sIn * (1 - E.out2(seg(t, 8.7, 9.5))) });
  const lp = E.out4(seg(t, 8.56, 9.2));
  const glow = 0.35 + pulse([[8.62, 1.2]], t, 3);
  const lg = $('logo1');
  lg.style.clipPath = `inset(0 ${(50 * (1 - lp)).toFixed(2)}% 0 ${(50 * (1 - lp)).toFixed(2)}%)`;
  T(lg, {
    x: 540, y: 800, s: lerp(1.14, 1, lp) * (1 + out * 0.18) + 0.012 * seg(t, 9.2, 10.5),
    o: (t > 8.52 ? 1 : 0) * (1 - out), blur: (1 - lp) * 14 + out * 20,
    f: `drop-shadow(0 0 ${(28 * glow).toFixed(1)}px rgba(255,60,70,${clamp(glow * 0.8).toFixed(2)}))`,
  });
  const rp = seg(t, 8.62, 9.5);
  T($('ring2'), { x: 540, y: 800, s: lerp(0.3, 2.6, E.out3(rp)), o: t < 8.62 ? 0 : (1 - rp) * 0.8 });
  const h4 = $('h4');
  words(h4, t);
  T(h4, { x: 540, y: 1150, o: 1 - out, blur: out * 20, s: 1 + out * 0.1 });
}

/* ---------------- 10.7 – 15.5  "İşletmenize özel; modern, mobil uyumlu ve hızlı web siteleri tasarlıyoruz." ---------------- */
const THEMES = [['Restoran', 'maverarestoran.com'], ['Güzellik Salonu', 'lunebeauty.com'], ['İnşaat Firması', 'atlasyapi.com.tr']];
function scene5(t) {
  const out = E.in3(seg(t, 15.15, 15.55));
  const h5 = $('h5'), h5b = $('h5b');
  words(h5, t); words(h5b, t);
  T(h5, { x: 540, y: 300 - out * 300, o: 1 - out, blur: out * 22 });
  T(h5b, { x: 540, y: 418 - out * 300, o: 1 - out, blur: out * 22 });

  // desktop
  const desk = $('desk');
  const din = E.out4(seg(t, 10.62, 11.15));
  const split = E.inOut3(seg(t, 12.5, 13.05));
  const dOut = E.in3(seg(t, 15.12, 15.5));
  const drift = seg(t, 11, 15.2);
  T(desk, {
    x: lerp(540, 425, split) - dOut * 900, y: lerp(lerp(1420, 1000, din), 960, split),
    s: lerp(lerp(0.86, 1.06, din), 0.84, split),
    rx: lerp(lerp(32, 7, din), 5, split), ry: lerp(lerp(-14, -7, din) + 4 * drift, 14, split),
    o: din * (1 - dOut), blur: (1 - din) * 14 + dOut * 24,
  });
  // build-up of the first site
  const st1 = $('st1');
  const img1 = st1.querySelector('.shero');
  const ip = E.out3(seg(t, 10.8, 11.3));
  img1.style.opacity = ip; img1.style.transform = `scale(${lerp(1.18, 1, ip).toFixed(4)})`;
  rv(st1.querySelector('.snav'), t, 10.95, { dy: -20, blur: 8, dur: 0.35 });
  const kids = [...st1.querySelector('.stext').children, ...st1.querySelector('.scards').children];
  kids.forEach((k, i) => rv(k, t, 11.0 + i * 0.055, { dy: 26, blur: 8, dur: 0.35 }));
  // theme wipes (circular reveal from the CTA)
  const w2 = E.inOut3(seg(t, 11.4, 11.82)), w3 = E.inOut3(seg(t, 11.96, 12.38));
  $('st2').style.clipPath = `circle(${(w2 * 130).toFixed(2)}% at 22% 70%)`;
  $('st3').style.clipPath = `circle(${(w3 * 130).toFixed(2)}% at 22% 70%)`;
  $('st2').style.visibility = w2 > 0 ? 'visible' : 'hidden';
  $('st3').style.visibility = w3 > 0 ? 'visible' : 'hidden';
  const ti = t < 11.55 ? 0 : t < 12.1 ? 1 : 2;
  $('url2').textContent = THEMES[ti][1];
  $('tag5t').textContent = THEMES[ti][0];
  const tagPop = Math.max(pulse([[11.55, 1], [12.1, 1]], t, 9), 0);
  const tIn = E.outBack(seg(t, 11.0, 11.35));
  T($('tag5'), {
    x: lerp(210, 170, split) - dOut * 900, y: lerp(660, 690, split), s: tIn * (1 + tagPop * 0.12),
    o: clamp(tIn) * (1 - dOut) * (1 - E.in2(seg(t, 12.8, 13.2)) * 0.0), blur: dOut * 20,
  });
  // loading bar + sheen
  const lb = seg(t, 13.5, 13.85);
  $('load').style.width = `${(E.out3(lb) * 100).toFixed(2)}%`;
  $('load').style.opacity = lb > 0 ? 1 - E.in2(seg(t, 13.85, 14.2)) : 0;
  const sh = seg(t, 14.45, 15.0);
  sheenD.style.transform = `translateX(${lerp(-120, 330, E.inOut3(sh)).toFixed(1)}%) skewX(-12deg)`;
  sheenD.style.opacity = sh > 0 && sh < 1 ? 1 : 0;
  const shp = seg(t, 14.55, 15.1);
  sheenP.style.transform = `translateX(${lerp(-120, 330, E.inOut3(shp)).toFixed(1)}%) skewX(-12deg)`;
  sheenP.style.opacity = shp > 0 && shp < 1 ? 1 : 0;

  // phone (carries on into scene 6)
  const ph = $('ph2');
  const pin = E.out4(seg(t, 12.55, 13.1));
  const toC = E.inOut3(seg(t, 15.15, 15.7));
  const pOut = E.in3(seg(t, 17.42, 17.8));
  T(ph, {
    x: lerp(lerp(1250, 835, pin), 540, toC), y: lerp(lerp(1110, 1080, pin), 1150, toC) + pOut * 820,
    s: lerp(1, 1.36, toC) * (1 - pOut * 0.15),
    ry: lerp(lerp(-30, -9, pin), 0, toC), rx: lerp(4, 0, toC),
    o: pin * (1 - pOut), blur: (1 - pin) * 12 + pOut * 22,
  });

  // feature chips
  const chips = [['c1', 12.01, 300, 1470], ['c2', 12.65, 780, 1470], ['c3', 13.61, 300, 1585], ['c4', 14.17, 780, 1585]];
  const cOut = E.in3(seg(t, 15.1, 15.45));
  for (const [id, tc, x, y] of chips) {
    const p = seg(t, tc - 0.05, tc + 0.4);
    T($(id), { x, y: y + cOut * 120, s: lerp(0.55, 1, E.outBack(p, 2.2)) * (p > 0 ? 1 : 0), o: E.out3(clamp(p * 2)) * (1 - cOut), blur: (1 - E.out3(p)) * 10 + cOut * 16 });
  }
  // speed lines
  zips.forEach((z, i) => {
    const t0 = 13.52 + i * 0.035, p = seg(t, t0, t0 + 0.38);
    T(z, { x: lerp(-400, 1500, E.in2(p)), y: 760 + hash(i * 3.3) * 520, o: p > 0 && p < 1 ? 0.9 : 0 });
  });
}

/* ---------------- 15.4 – 17.8  "Dijital vitrininizi birlikte kuralım." ---------------- */
function scene6(t) {
  const out = E.in3(seg(t, 17.36, 17.62));
  const h6 = $('h6');
  words(h6, t);
  T(h6, { x: 540, y: 330 - out * 320, o: 1 - out, blur: out * 22 });
  const arr = [15.72, 16.12, 16.52, 16.92];
  const ids = ['n1', 'n2', 'n3', 'n4'];
  ids.forEach((id, i) => {
    const a = seg(t, arr[i], arr[i] + 0.42);
    let slot = 0;
    for (let j = i + 1; j < arr.length; j++) slot += E.out3(seg(t, arr[j], arr[j] + 0.42));
    const y = 760 + slot * 150 - (1 - E.out3(a)) * 140;
    T($(id), {
      x: 540, y: y + out * 820, s: lerp(0.86, 1, E.outBack(a, 1.6)) * (1 - slot * 0.035),
      o: E.out3(clamp(a * 2)) * (1 - slot * 0.1) * (1 - out), blur: (1 - E.out3(a)) * 12 + out * 22,
    });
  });
  const sp = seg(t, 16.25, 16.75);
  T($('stat'), { x: 250, y: 1450 + out * 820, s: lerp(0.8, 1, E.outBack(sp, 1.8)), o: E.out3(clamp(sp * 2)) * (1 - out), blur: (1 - E.out3(sp)) * 12 + out * 22 });
  const path = $('spark');
  const L = 330;
  path.style.strokeDasharray = L;
  path.style.strokeDashoffset = (L * (1 - E.inOut3(seg(t, 16.35, 17.1)))).toFixed(1);
}

/* ---------------- 17.5 – 20.0  "Hemen bize yazın!" ---------------- */
function scene7(t) {
  const lp = E.out4(seg(t, 17.6, 18.1));
  T($('logo2'), { x: 540, y: 395, s: lerp(0.78, 0.6, lp), o: lp, blur: (1 - lp) * 16, f: 'drop-shadow(0 0 18px rgba(255,60,70,.45))' });
  const h7 = $('h7');
  words(h7, t, { dy: 60, blur: 18, dur: 0.4 });
  T(h7, { x: 540, y: 735 });
  const bp = seg(t, 18.24, 18.66);
  const click = pulse([[18.72, 1]], t, 12);
  const btn = $('btn');
  T(btn, { x: 540, y: 1045, s: lerp(0.7, 1, E.outBack(bp, 2)) * (1 - click * 0.07) * (bp > 0 ? 1 : 0), o: E.out3(clamp(bp * 2)), blur: (1 - E.out3(bp)) * 10 });
  const bg2 = 0.45 + pulse([[18.72, 0.6]], t, 3) + 0.08 * Math.sin(t * 6);
  btn.style.boxShadow = `0 24px ${(70 + bg2 * 40) | 0}px rgba(255,30,40,${clamp(bg2).toFixed(2)}), inset 0 2px 0 rgba(255,255,255,.35), inset 0 -6px 18px rgba(0,0,0,.25)`;
  // cursor + ripple
  const cm = E.inOut3(seg(t, 18.3, 18.68));
  const cur = $('cursor');
  T(cur, { x: lerp(930, 742, cm), y: lerp(1420, 1082, cm), s: 1 - click * 0.18, o: E.out2(seg(t, 18.28, 18.42)) * (1 - E.in2(seg(t, 19.35, 19.6))) });
  const rp = seg(t, 18.72, 19.25);
  T($('rip'), { x: 720, y: 1062, s: lerp(0.15, 1.5, E.out3(rp)), o: t < 18.72 ? 0 : (1 - rp) * 0.8 });
  ['k1', 'k2', 'k3'].forEach((id, i) => {
    const p = seg(t, 18.82 + i * 0.13, 18.82 + i * 0.13 + 0.45);
    T($(id), { x: 540, y: 1215 + i * 122 + (1 - E.out3(p)) * 50, o: E.out3(p), blur: (1 - E.out3(p)) * 10 });
  });
  const r3 = seg(t, 18.72, 19.6);
  T($('ring3'), { x: 540, y: 1045, s: lerp(0.5, 2.4, E.out3(r3)), o: t < 18.72 ? 0 : (1 - r3) * 0.5 });
}

/* ------------------------------------------------------------------ */
window.__render = render;
window.__ready = false;
Promise.all([
  document.fonts.load('900 100px Archivo'), document.fonts.load('800 100px Archivo'),
  document.fonts.load('italic 100px "Instrument Serif"'), document.fonts.load('600 30px Inter'),
  ...[...document.images].map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; }))),
]).then(() => document.fonts.ready).then(() => {
  document.querySelectorAll('.a').forEach((el) => sizes.set(el, [el.offsetWidth, el.offsetHeight]));
  render(0); window.__ready = true;
});

// live preview: open index.html?play
if (location.search.includes('play')) {
  const a = new Audio('../out/mix.wav');
  let t0 = null;
  document.addEventListener('click', () => { a.currentTime = 0; a.play(); t0 = performance.now(); });
  const loop = (now) => { const t = t0 == null ? 0 : ((now - t0) / 1000) % DUR; render(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
