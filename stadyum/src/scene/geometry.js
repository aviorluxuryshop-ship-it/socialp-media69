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
