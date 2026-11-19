import * as THREE from 'three';
import { LAYOUT } from '../data/sections.js';

// Kase hattı örnekleri: her örnek { x, z, nx, nz } (taban dikdörtgen üzerinde, normal dışa bakar).
export function pieceSamples(name, arcSeg = 8) {
  const { a, b, r } = LAYOUT.bowl;
  const ax = a - r, bz = b - r, PI = Math.PI;
  const out = [];
  const arc = (cx, cz, t0, t1) => {
    for (let i = 0; i <= arcSeg; i++) {
      const t = t0 + ((t1 - t0) * i) / arcSeg;
      const nx = Math.cos(t), nz = Math.sin(t);
      out.push({ x: cx + r * nx, z: cz + r * nz, nx, nz });
    }
  };
  const line = (x0, z0, x1, z1, nx, nz) => out.push({ x: x0, z: z0, nx, nz }, { x: x1, z: z1, nx, nz });
  switch (name) {
    case 'NW': arc(-ax, -bz, PI, 1.5 * PI); break;
    case 'N': line(-ax, -b, ax, -b, 0, -1); break;
    case 'NE': arc(ax, -bz, 1.5 * PI, 2 * PI); break;
    case 'E': line(a, -bz, a, bz, 1, 0); break;
    case 'SE': arc(ax, bz, 0, 0.5 * PI); break;
    case 'S': line(ax, b, -ax, b, 0, 1); break;
    case 'SW': arc(-ax, bz, 0.5 * PI, PI); break;
    case 'W': line(-a, bz, -a, -bz, -1, 0); break;
    default: throw new Error('bilinmeyen parça ' + name);
  }
  return out;
}

export const LOOP_PIECES = ['NW', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W'];

export function pathSamples(names, arcSeg = 8) {
  const out = [];
  for (const n of names) {
    const s = pieceSamples(n, arcSeg);
    for (let i = 0; i < s.length; i++) {
      const prev = out[out.length - 1];
      if (i === 0 && prev && Math.hypot(prev.x - s[i].x, prev.z - s[i].z) < 1e-6) continue;
      out.push(s[i]);
    }
  }
  return out;
}

// Basamaklı profil: her sırada önce dikey yükselti sonra yatay basamak.
export function stairs(d0, y0, d1, y1, rise = LAYOUT.rowRise) {
  const rows = Math.max(1, Math.round((y1 - y0) / rise));
  const dd = (d1 - d0) / rows, dy = (y1 - y0) / rows;
  const pts = [[d0, y0]];
  for (let k = 0; k < rows; k++) {
    const d = d0 + dd * k, y = y0 + dy * k;
    pts.push([d, y + dy], [d + dd, y + dy]);
  }
  return { pts, rows, dd, dy };
}

// Yol boyunca profili "loft" eder. Her profil kenarı ayrı vertex satırı kullanır (keskin köşe için).
export function loft(samples, profile, { uScale = 4, vLen = 1 } = {}) {
  const n = samples.length;
  const segs = profile.length - 1;
  const pos = new Float32Array(segs * 2 * n * 3);
  const uvs = new Float32Array(segs * 2 * n * 2);
  const idx = [];

  // her profil noktası için yol boyunca kümülatif uzunluk
  const cum = profile.map(([d]) => {
    const c = [0];
    for (let i = 1; i < n; i++) {
      const p = samples[i - 1], q = samples[i];
      c.push(c[i - 1] + Math.hypot(q.x + q.nx * d - (p.x + p.nx * d), q.z + q.nz * d - (p.z + p.nz * d)));
    }
    return c;
  });
  const vAcc = [0];
  for (let j = 1; j < profile.length; j++) {
    vAcc.push(vAcc[j - 1] + Math.hypot(profile[j][0] - profile[j - 1][0], profile[j][1] - profile[j - 1][1]));
  }

  let w = 0, u2 = 0;
  for (let j = 0; j < segs; j++) {
    const base = j * 2 * n;
    for (let side = 0; side < 2; side++) {
      const pj = j + side;
      const [d, y] = profile[pj];
      for (let i = 0; i < n; i++) {
        const s = samples[i];
        pos[w++] = s.x + s.nx * d; pos[w++] = y; pos[w++] = s.z + s.nz * d;
        uvs[u2++] = cum[pj][i] / uScale; uvs[u2++] = vAcc[pj] / vLen;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const a = base + i, b = base + i + 1, c = base + n + i, e = base + n + i + 1;
      idx.push(a, c, b, b, c, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// d ofsetinde eşit aralıklı noktalar (kapalı çevre boyunca), { x, z, nx, nz }.
export function resample(samples, d, spacing) {
  const pts = samples.map((s) => ({ x: s.x + s.nx * d, z: s.z + s.nz * d, nx: s.nx, nz: s.nz }));
  // yay üzerindeki ara noktaları sıklaştır
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const len = Math.hypot(q.x - p.x, q.z - p.z);
    const steps = Math.max(1, Math.ceil(len / 0.5));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const nx = p.nx + (q.nx - p.nx) * t, nz = p.nz + (q.nz - p.nz) * t;
      const l = Math.hypot(nx, nz) || 1;
      dense.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t, nx: nx / l, nz: nz / l });
    }
  }
  const out = [];
  let acc = spacing; // ilk noktayı yerleştir
  for (let i = 0; i < dense.length; i++) {
    if (i > 0) acc += Math.hypot(dense[i].x - dense[i - 1].x, dense[i].z - dense[i - 1].z);
    if (acc >= spacing) { out.push(dense[i]); acc = 0; }
  }
  return out;
}

// --- Canvas dokuları (ucuz detay) ---
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, { repeat = true, srgb = true, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

// Koltuk sıraları (dış görünümde boyalı doku): dönem başında dikey yükselti (altta), üstünde basamak.
// Açık gri beton üzerinde siyah/beyaz koltuk deseni; hiçbir bölge saf siyah olmaz.
export function seatTexture(riserFrac) {
  const [c, g] = canvas(128, 64);
  const treadH = Math.round(64 * (1 - riserFrac));
  g.fillStyle = '#3a3c43'; g.fillRect(0, 0, 128, 64);
  g.fillStyle = '#45474f'; g.fillRect(0, 0, 128, treadH);
  for (let i = 0; i < 8; i++) {
    const white = i % 4 === 1; // Beşiktaş: siyah koltuklar, beyaz vurgular
    g.fillStyle = white ? '#f0f0f3' : '#17181c';
    g.beginPath(); g.roundRect(i * 16 + 2, 3, 12, treadH - 6, 3); g.fill();
    g.fillStyle = white ? '#c9cbd2' : '#0b0b0d'; g.fillRect(i * 16 + 3, treadH - 8, 10, 3);
  }
  g.fillStyle = '#25262b'; g.fillRect(0, treadH, 128, 2);
  return toTex(c);
}

export function pitchTexture() {
  const s = 8, W = 68 * s, H = 105 * s;
  const [c, g] = canvas(W, H);
  const stripes = 15, sh = H / stripes;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? '#3a8a43' : '#32793b';
    g.fillRect(0, i * sh, W, sh + 1);
  }
  g.strokeStyle = '#f2f2ee'; g.fillStyle = '#f2f2ee'; g.lineWidth = 2;
  const m = 1 * s;
  g.strokeRect(m, m, W - 2 * m, H - 2 * m);
  g.beginPath(); g.moveTo(m, H / 2); g.lineTo(W - m, H / 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, 9.15 * s, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, 0.5 * s, 0, Math.PI * 2); g.fill();
  for (const top of [true, false]) {
    const y0 = top ? m : H - m, dir = top ? 1 : -1;
    const box = (w, d) => {
      const x = (W - w * s) / 2;
      g.strokeRect(x, top ? y0 : y0 - d * s, w * s, d * s);
    };
    box(40.32, 16.5); box(18.32, 5.5);
    const spotY = y0 + dir * 11 * s;
    g.beginPath(); g.arc(W / 2, spotY, 0.4 * s, 0, Math.PI * 2); g.fill();
    g.save();
    g.beginPath();
    g.rect(0, top ? y0 + 16.5 * s : 0, W, top ? H : y0 - 16.5 * s);
    g.clip();
    g.beginPath(); g.arc(W / 2, spotY, 9.15 * s, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
  for (const [cx, cy, a0] of [[m, m, 0], [W - m, m, 0.5], [W - m, H - m, 1], [m, H - m, 1.5]]) {
    g.beginPath(); g.arc(cx, cy, 1 * s, a0 * Math.PI, (a0 + 0.5) * Math.PI); g.stroke();
  }
  return toTex(c, { repeat: false, aniso: 8 });
}

export function facadeTexture() {
  // kireç taşı kolonadın arkasındaki koyu cam yüzey, kat silmeleri
  const [c, g] = canvas(128, 512);
  g.fillStyle = '#1c2026'; g.fillRect(0, 0, 128, 512);
  g.fillStyle = '#e6dcc6'; g.fillRect(0, 0, 128, 22); // üst silme
  g.fillStyle = '#cfc4ab'; g.fillRect(0, 22, 128, 5);
  for (const y of [150, 270, 390]) { g.fillStyle = '#d9cfb8'; g.fillRect(0, y, 128, 7); g.fillStyle = '#9d947f'; g.fillRect(0, y + 7, 128, 2); }
  for (let r = 0; r < 4; r++) {
    const y0 = 34 + r * 120;
    for (let i = 0; i < 4; i++) { g.fillStyle = '#2f3a47'; g.fillRect(8 + i * 30, y0, 22, 100); g.fillStyle = '#4a5a6c'; g.fillRect(8 + i * 30, y0, 22, 6); }
  }
  g.fillStyle = '#d9cfb8'; g.fillRect(0, 436, 128, 76); // zemin kat: kireç taşı kemerler
  for (let i = 0; i < 4; i++) {
    g.fillStyle = '#15171b'; g.beginPath(); g.moveTo(6 + i * 30, 512); g.lineTo(6 + i * 30, 462);
    g.arc(18 + i * 30, 462, 12, Math.PI, 0); g.lineTo(30 + i * 30, 512); g.fill();
  }
  return toTex(c);
}

export function archTexture(emissive = false) {
  const [c, g] = canvas(128, 256);
  g.fillStyle = emissive ? '#000' : '#d8cfbd'; g.fillRect(0, 0, 128, 256);
  const arch = (y0, h) => {
    const x0 = 26, w = 76, r = w / 2;
    g.fillStyle = emissive ? '#ffb86b' : '#33302c';
    g.beginPath();
    g.moveTo(x0, y0 + h); g.lineTo(x0, y0 + r + 6);
    g.arc(64, y0 + r + 6, r, Math.PI, 0);
    g.lineTo(x0 + w, y0 + h); g.closePath(); g.fill();
    if (!emissive) {
      g.strokeStyle = '#a89f8c'; g.lineWidth = 5; g.stroke();
    }
  };
  arch(150, 100); arch(22, 100);
  if (!emissive) { g.fillStyle = '#b8ae98'; g.fillRect(0, 126, 128, 8); g.fillRect(0, 0, 128, 8); }
  return toTex(c);
}

export function locaTexture(emissive = false) {
  const [c, g] = canvas(128, 64);
  g.fillStyle = emissive ? '#000' : '#17181c'; g.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 2; i++) {
    g.fillStyle = emissive ? '#ffc477' : '#4b5a6b';
    g.fillRect(i * 64 + 5, 10, 54, 44);
    g.fillStyle = emissive ? '#000' : '#c9a24a';
    g.fillRect(i * 64 + 31, 10, 2, 44); // altın çıta
  }
  g.fillStyle = emissive ? '#000' : '#c9a24a'; g.fillRect(0, 0, 128, 4);
  return toTex(c);
}

export function roofUnderTexture() { // alt yüzey: açık gri, radyal halatlar
  const [c, g] = canvas(128, 128);
  g.fillStyle = '#b9bec6'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#4a4f58'; g.fillRect(0, 0, 3, 128);
  g.fillStyle = '#9aa0a9'; g.fillRect(0, 62, 128, 2);
  return toTex(c);
}

// ---- Çatı üst yüzeyi: tek tuval, yukarıdan bakışla düz (planar) UV ----
// Tuval dünya xz düzlemine eşlenir: üst = Kuzey (-Z), sol = Batı (-X).
export function roofTopExtent() {
  const { roof, bowl } = LAYOUT;
  return { X: bowl.a + roof.dOut + 2, Z: bowl.b + roof.dOut + 2 };
}

const ROOF_FONT = '"Montserrat", "Arial Black", Impact, "DejaVu Sans", Arial, sans-serif';

function drawEagle(g, cx, cy, s) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = '#15161a';
  const wing = (m) => {
    g.save(); g.scale(m, 1); g.beginPath();
    g.moveTo(1.5, -6.5);
    g.bezierCurveTo(7, -11, 17, -10, 24, -2);     // hücum kenarı
    g.bezierCurveTo(25, -0.5, 25.4, 1, 24.6, 2.4); // kanat ucu
    g.bezierCurveTo(17, 1, 9, 2, 1.2, 4);          // arka kenar (tüylerin kökü)
    g.closePath(); g.fill();
    // ayrı birincil tüyler: kökten aşağı/dışa sivri uçlar
    for (let i = 0; i < 7; i++) {
      const t = i / 6, bx = 4 + t * 20.5, by = 3.6 - t * 1.4;
      const tx = bx + 1.6 - t * 1.2, ty = by + 9.5 + 3.2 * Math.sin(t * Math.PI) - t * 2.5;
      g.beginPath(); g.moveTo(bx - 1.5, by - 0.5); g.lineTo(bx + 1.2, by - 0.5); g.lineTo(tx, ty); g.closePath(); g.fill();
    }
    g.restore();
  };
  wing(1); wing(-1);
  // gövde + kuyruk
  g.beginPath(); g.moveTo(0, -8.5);
  g.bezierCurveTo(3.4, -6, 3.2, 2, 2.2, 6);
  g.lineTo(4, 13); g.lineTo(1.4, 11.4); g.lineTo(0, 14.5); g.lineTo(-1.4, 11.4); g.lineTo(-4, 13); g.lineTo(-2.2, 6);
  g.bezierCurveTo(-3.2, 2, -3.4, -6, 0, -8.5); g.fill();
  // beyazımsı baş + gaga
  g.fillStyle = '#e9e9ea';
  g.beginPath(); g.ellipse(0, -9.6, 2.1, 2.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#15161a';
  g.beginPath(); g.moveTo(-0.9, -8.4); g.lineTo(0.9, -8.4); g.lineTo(0, -6.4); g.closePath(); g.fill();
  g.restore();
}

export function roofTopTexture(size = 2048) {
  const { roof, bowl } = LAYOUT;
  const { X, Z } = roofTopExtent();
  const W = size, H = Math.round(size * Z / X), k = W / (2 * X); // px / metre
  const [c, g] = canvas(W, H);
  const tex = toTex(c, { repeat: false, aniso: 8 });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const PX = (x) => (x + X) * k, PY = (z) => (z + Z) * k;

  // kapalı çevre (d=0 hattı), kümülatif uzunluk
  const ring = pathSamples(LOOP_PIECES, 40);
  ring.push({ ...ring[0] });
  const cum = [0];
  for (let i = 1; i < ring.length; i++) cum.push(cum[i - 1] + Math.hypot(ring[i].x - ring[i - 1].x, ring[i].z - ring[i - 1].z));
  const P = cum[cum.length - 1];
  const at = (s) => { // d=0 hattında s konumu
    s = ((s % P) + P) % P;
    let i = 1; while (cum[i] < s) i++;
    const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), p = ring[i - 1], q = ring[i];
    const nx = p.nx + (q.nx - p.nx) * t, nz = p.nz + (q.nz - p.nz) * t, l = Math.hypot(nx, nz) || 1;
    return { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t, nx: nx / l, nz: nz / l };
  };
  // d ofsetli hattın yay uzunluğu eşlemesi (yazı yerleşimi için)
  const offLen = (d) => {
    let L = 0;
    for (let i = 1; i < ring.length; i++) L += Math.hypot(ring[i].x + ring[i].nx * d - ring[i - 1].x - ring[i - 1].nx * d, ring[i].z + ring[i].nz * d - ring[i - 1].z - ring[i - 1].nz * d);
    return L;
  };
  const atOff = (d, s) => { // d ofsetli hatta s (ofset uzunluğu) konumu
    const L = offLen(d); s = ((s % L) + L) % L;
    let acc = 0;
    for (let i = 1; i < ring.length; i++) {
      const p = ring[i - 1], q = ring[i];
      const px = p.x + p.nx * d, pz = p.z + p.nz * d, qx = q.x + q.nx * d, qz = q.z + q.nz * d;
      const l = Math.hypot(qx - px, qz - pz);
      if (acc + l >= s || i === ring.length - 1) {
        const t = l ? (s - acc) / l : 0;
        const nx = p.nx + (q.nx - p.nx) * t, nz = p.nz + (q.nz - p.nz) * t, m = Math.hypot(nx, nz) || 1;
        return { x: px + (qx - px) * t, z: pz + (qz - pz) * t, nx: nx / m, nz: nz / m };
      }
      acc += l;
    }
  };
  const sOfPoint = (d, x0, z0) => { // d hattında (x0,z0)'a en yakın noktanın ofset-uzunluk konumu
    let best = 1e9, bs = 0, acc = 0;
    for (let i = 1; i < ring.length; i++) {
      const p = ring[i - 1], q = ring[i];
      const px = p.x + p.nx * d, pz = p.z + p.nz * d, qx = q.x + q.nx * d, qz = q.z + q.nz * d;
      const l = Math.hypot(qx - px, qz - pz);
      const dd = Math.hypot(qx - x0, qz - z0);
      if (dd < best) { best = dd; bs = acc + l; }
      acc += l;
    }
    return bs;
  };

  const N = 72;                    // radyal panel sayısı
  const dIn = roof.dIn, dOut = roof.dOut;
  const panels = [];
  for (let i = 0; i < N; i++) {
    const s0 = (i * P) / N, s1 = ((i + 1) * P) / N;
    const pts = [at(s0)];
    for (let j = 1; j < ring.length - 1; j++) if (cum[j] > s0 && cum[j] < s1) pts.push(ring[j]);
    pts.push(at(s1));
    panels.push(pts);
  }
  const splits = [0, 0.34, 0.67, 1];           // eşmerkezli dikiş oranları
  const lerp = (a, b, t) => a + (b - a) * t;

  function draw(fontReady) {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#f0f2f5'; g.fillRect(0, 0, W, H);
    const poly = (pts, d1, d2) => {
      g.beginPath();
      pts.forEach((p, i) => { const x = PX(p.x + p.nx * d1), y = PY(p.z + p.nz * d1); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; g.lineTo(PX(p.x + p.nx * d2), PY(p.z + p.nz * d2)); }
      g.closePath();
    };
    // yastık dolguları
    for (const pts of panels) {
      for (let j = 0; j < 3; j++) {
        const d1 = lerp(dIn, dOut, splits[j]), d2 = lerp(dIn, dOut, splits[j + 1]);
        let cx = 0, cz = 0;
        for (const p of pts) { cx += p.x + p.nx * (d1 + d2) / 2; cz += p.z + p.nz * (d1 + d2) / 2; }
        cx /= pts.length; cz /= pts.length;
        const a = pts[0], b = pts[pts.length - 1];
        const rr = Math.max(Math.hypot(b.x - a.x, b.z - a.z) / 2 + 0.5, (d2 - d1) / 2) * k * 1.05;
        const gr = g.createRadialGradient(PX(cx), PY(cz), 0, PX(cx), PY(cz), rr);
        const edge = j === 0 ? '#dfe3e8' : '#e8ebef'; // iç kenara doğru hafif gölge
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#fafbfc'); gr.addColorStop(1, edge);
        g.fillStyle = gr; poly(pts, d1, d2); g.fill();
      }
    }
    // dikişler
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(150,158,168,0.85)'; g.lineWidth = Math.max(1.4, 0.2 * k);
    for (let i = 0; i < N; i++) {
      const p = at((i * P) / N);
      g.beginPath(); g.moveTo(PX(p.x + p.nx * dIn), PY(p.z + p.nz * dIn)); g.lineTo(PX(p.x + p.nx * dOut), PY(p.z + p.nz * dOut)); g.stroke();
    }
    g.strokeStyle = 'rgba(150,158,168,0.6)'; g.lineWidth = Math.max(1.2, 0.16 * k);
    for (const sp of [splits[1], splits[2]]) {
      const d = lerp(dIn, dOut, sp);
      g.beginPath();
      ring.forEach((p, i) => { const x = PX(p.x + p.nx * d), y = PY(p.z + p.nz * d); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    }
    // iç kenarda ince koyu çizgi, dış kenarda gri çerçeve
    for (const [d, col, lw] of [[dIn + 0.2, '#3a3d44', 0.55], [dOut - 0.35, '#aab0b8', 0.7]]) {
      g.strokeStyle = col; g.lineWidth = lw * k; g.beginPath();
      ring.forEach((p, i) => { const x = PX(p.x + p.nx * d), y = PY(p.z + p.nz * d); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    }

    // eğriyi izleyen harfler (harf üstü dışa bakar)
    const ink = '#14151a';
    const textOnRing = (text, d, cx0, cz0, fs, track) => {
      g.font = `900 ${Math.round(fs * k)}px ${ROOF_FONT}`;
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = ink;
      const ws = [...text].map((ch) => g.measureText(ch).width / k);
      const total = ws.reduce((a, b) => a + b, 0) + track * (ws.length - 1);
      let s = sOfPoint(d, cx0, cz0) - total / 2;
      [...text].forEach((ch, i) => {
        const p = atOff(d, s + ws[i] / 2);
        g.save(); g.translate(PX(p.x), PY(p.z)); g.rotate(Math.atan2(p.nx, -p.nz));
        g.fillText(ch, 0, fs * 0.36 * k); // büyük harf yüksekliğinin ortası ofset hattında
        g.restore();
        s += ws[i] + track;
      });
    };
    const dTxt = 27.5;
    textOnRing('BEŞİKTAŞ', dTxt, 0, -(bowl.b + dTxt), 11.5, 3.4);
    textOnRing('Tüpraş', 26, bowl.a + 26, 0, 11, 5);
    textOnRing('Tüpraş', 26, -(bowl.a + 26), 0, 11, 5);
    // Güney ucu: jenerik kartal siluet
    drawEagle(g, PX(0), PY(bowl.b + 27), 0.8 * k);
  }
  draw(false);
  // yazı tipi: Montserrat (Google Fonts); olmazsa yedek kalın sans-serif
  if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
    document.fonts.load('900 100px Montserrat', 'BEŞİKTAŞ Tüpraş').then(() => { draw(true); tex.needsUpdate = true; }).catch(() => {});
  }
  tex.needsUpdate = true;
  return tex;
}

// Üst yüzey geometrisi: orijinal çatı ağının UV'lerini planar (xz) olarak yeniden yazar.
export function planarRoofUV(geo) {
  const { X, Z } = roofTopExtent();
  const g = geo.clone();
  const pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + X) / (2 * X);
    uv[i * 2 + 1] = 1 - (pos.getZ(i) + Z) / (2 * Z);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

export function glowTexture() {
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,248,225,1)');
  grd.addColorStop(0.25, 'rgba(255,236,190,0.55)');
  grd.addColorStop(1, 'rgba(255,230,170,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return toTex(c, { repeat: false });
}

export function windowsTexture() {
  const [c, g] = canvas(32, 32);
  g.fillStyle = '#000'; g.fillRect(0, 0, 32, 32);
  for (let y = 0; y < 32; y += 2) for (let x = 0; x < 32; x += 2) {
    if (Math.random() < 0.45) { g.fillStyle = Math.random() < 0.5 ? '#ffd28a' : '#fff0c8'; g.fillRect(x, y, 1, 1); }
  }
  const t = toTex(c, { srgb: true, aniso: 1 });
  t.magFilter = THREE.NearestFilter;
  return t;
}

export function waterTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#c8d4e0'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.12})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 30, 1 + Math.random() * 1.5);
  }
  return toTex(c);
}
