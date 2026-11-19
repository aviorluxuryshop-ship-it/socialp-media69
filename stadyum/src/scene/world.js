import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import DATA from '../data/osm-dolmabahce.json';

// Gerçek çevre: OpenStreetMap verisinden (scripts/fetch-osm.mjs) yerel metre koordinatlarında üretilir.
// Dünya: saha merkezi orijin, saha uzun ekseni Z. Boğaz +Z (Güney) tarafında, köprü ~3 km +X.
// Performans: her şey ızgara karolarına bölünmüş birleşik tek-malzemeli mesh'lerdir; three.js kamera
// görüş hacmi dışındaki karoları çizmez, ayrıca mesafeye göre karolar gizlenir.

export const FOG_NEAR = 650, FOG_FAR = 6200;
const TILE = 250, FLAT_TILE = 500, FTILE = 1000, FOG_FAR_LIMIT = 15000;
const sRGB = (hex) => new THREE.Color(hex);

// ---- yardımcılar ----
function rnd(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
const area2 = (p) => { let a = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };

function windowTextures() {
  const S = 32, W = 4, H = 2;
  const mk = () => { const c = document.createElement('canvas'); c.width = S * W; c.height = S * H; return c; };
  const a = mk(), b = mk(), ga = a.getContext('2d'), gb = b.getContext('2d');
  ga.fillStyle = '#ffffff'; ga.fillRect(0, 0, a.width, a.height);
  gb.fillStyle = '#000'; gb.fillRect(0, 0, b.width, b.height);
  let k = 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x * S, py = y * S;
    const g = ga.createLinearGradient(0, py + 7, 0, py + 26);
    g.addColorStop(0, '#a9bccd'); g.addColorStop(1, '#66788a');
    ga.fillStyle = '#d9d5cc'; ga.fillRect(px + 7, py + 5, 18, 23);   // pervaz
    ga.fillStyle = g; ga.fillRect(px + 9, py + 7, 14, 19);
    ga.fillStyle = '#7b8896'; ga.fillRect(px + 15, py + 7, 1, 19);   // orta denk
    ga.fillStyle = '#b9b4a8'; ga.fillRect(px + 6, py + 28, 20, 2);    // denizlik
    if (rnd(k++ * 977) < 0.42) { gb.fillStyle = rnd(k * 31) < 0.5 ? '#ffcf86' : '#ffe9bd'; gb.fillRect(px + 9, py + 7, 14, 19); }
  }
  const t = (c) => {
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    return tx;
  };
  return { map: t(a), emi: t(b) };
}

// ---- birleşik geometri biriktirici ----
const UVR = [0.04, 0.04]; // çatı/yatay yüzeyler: dokunun pencere içermeyen beyaz noktası
class Acc {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.i = []; }
  v(x, y, z, nx, ny, nz, u, v, col) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v); this.c.push(col.r, col.g, col.b); return this.p.length / 3 - 1; }
  tri(a, b, c, col, ref) { // yönü ref (dışa doğru) vektörüne göre düzeltilmiş üçgen, düz gölgeli
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * ref[0] + ny * ref[1] + nz * ref[2] < 0) { const t = b; b = c; c = t; nx = -nx; ny = -ny; nz = -nz; }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, UVR[0], UVR[1], col);
    const i1 = this.v(b[0], b[1], b[2], nx, ny, nz, UVR[0], UVR[1], col);
    const i2 = this.v(c[0], c[1], c[2], nx, ny, nz, UVR[0], UVR[1], col);
    this.i.push(i0, i1, i2);
  }
  get empty() { return this.i.length === 0; }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    const col = new Uint8Array(this.c.length); for (let k = 0; k < col.length; k++) col[k] = Math.min(255, Math.round(this.c[k] * 255));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
    g.setIndex(new THREE.BufferAttribute(this.p.length / 3 > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), 1));
    g.computeBoundingSphere();
    return g;
  }
}

const WALLS = [0xece3cf, 0xf1ede4, 0xd8d3c9, 0xe6d6ab, 0xdcb292, 0xd9c9a9, 0xc3c8cb, 0xd7b782, 0xe9e0d0, 0xcfc4b0].map(sRGB);
const ROOF_TILE = [0xa75b44, 0x9b5642, 0xb26a4f].map(sRGB);
const ROOF_FLAT = [0x7d7e80, 0x8c8a86, 0x6f7174].map(sRGB);
const c = new THREE.Color();

// Çokgen + yükseklik -> duvarlar (pencere dokulu) + çatı.
function extrude(acc, pts, h, wallCol, roofCol, hip, seed) {
  const n = pts.length;
  if (n < 3) return;
  if (area2(pts) < 0) pts = pts.slice().reverse();
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
    if (L < 0.2) continue;
    const nx = dz / L, nz = -dx / L, u0 = cum / 12, u1 = (cum + L) / 12, v1 = h / 6.4;
    cum += L;
    const a = acc.v(p[0], 0, p[1], nx, 0, nz, u0, 0, wallCol), b = acc.v(q[0], 0, q[1], nx, 0, nz, u1, 0, wallCol);
    const cc = acc.v(q[0], h, q[1], nx, 0, nz, u1, v1, wallCol), d = acc.v(p[0], h, p[1], nx, 0, nz, u0, v1, wallCol);
    acc.i.push(a, cc, b, a, d, cc);
  }
  if (hip && n <= 6) {
    let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
    let minD = 1e9; for (const p of pts) minD = Math.min(minD, Math.hypot(p[0] - cx, p[1] - cz));
    const ry = Math.min(3.6, Math.max(1.4, minD * 0.45));
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      acc.tri([p[0], h, p[1]], [q[0], h, q[1]], [cx, h + ry, cz], roofCol, [(p[0] + q[0]) / 2 - cx, 0.6, (p[1] + q[1]) / 2 - cz]);
    }
    return;
  }
  // düz çatı
  const v2 = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  let faces;
  try { faces = THREE.ShapeUtils.triangulateShape(v2, []); } catch (e) { return; }
  const base = acc.p.length / 3;
  for (const p of pts) acc.v(p[0], h, p[1], 0, 1, 0, UVR[0], UVR[1], roofCol);
  for (const f of faces) {
    const a = pts[f[0]], b = pts[f[1]], cc = pts[f[2]];
    const ny = (b[1] - a[1]) * (cc[0] - a[0]) - (b[0] - a[0]) * (cc[1] - a[1]);
    if (ny >= 0) acc.i.push(base + f[0], base + f[1], base + f[2]); else acc.i.push(base + f[0], base + f[2], base + f[1]);
  }
}

function obbOf(pts) { // en uzun kenar yönünde yönlü kutu
  let L = 0, ang = 0;
  for (let i = 0; i < pts.length; i++) { const q = pts[(i + 1) % pts.length], l = Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]); if (l > L) { L = l; ang = Math.atan2(q[1] - pts[i][1], q[0] - pts[i][0]); } }
  const cs = Math.cos(ang), sn = Math.sin(ang);
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const q of pts) { const a = q[0] * cs + q[1] * sn, b = -q[0] * sn + q[1] * cs; u0 = Math.min(u0, a); u1 = Math.max(u1, a); v0 = Math.min(v0, b); v1 = Math.max(v1, b); }
  return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([a, b]) => [a * cs - b * sn, a * sn + b * cs]);
}
function boxPts(cx, cz, w, d, angDeg) {
  const a = angDeg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => [cx + x * cs - z * sn, cz + x * sn + z * cs]);
}

// ---- cami kubbesi / minare / saat kulesi ----
function addDome(acc, cx, cz, y0, r, col) {
  const SEG = 10, RING = 3;
  const P = (j, k) => { const ph = (j / RING) * Math.PI / 2, th = (k / SEG) * Math.PI * 2; return [cx + r * Math.cos(ph) * Math.cos(th), y0 + r * 0.85 * Math.sin(ph), cz + r * Math.cos(ph) * Math.sin(th)]; };
  for (let j = 0; j < RING; j++) for (let k = 0; k < SEG; k++) {
    const a = P(j, k), b = P(j, k + 1), d = P(j + 1, k), e = P(j + 1, k + 1);
    const ref = [a[0] - cx, a[1] - y0 + 0.01, a[2] - cz];
    acc.tri(a, b, e, col, ref);
    if (j < RING - 1) acc.tri(a, e, d, col, ref);
  }
}
function addShaft(acc, cx, cz, y0, y1, r0, r1, col, seg = 8) {
  for (let k = 0; k < seg; k++) {
    const t0 = (k / seg) * Math.PI * 2, t1 = ((k + 1) / seg) * Math.PI * 2;
    const a = [cx + r0 * Math.cos(t0), y0, cz + r0 * Math.sin(t0)], b = [cx + r0 * Math.cos(t1), y0, cz + r0 * Math.sin(t1)];
    const cc = [cx + r1 * Math.cos(t1), y1, cz + r1 * Math.sin(t1)], d = [cx + r1 * Math.cos(t0), y1, cz + r1 * Math.sin(t0)];
    const ref = [Math.cos((t0 + t1) / 2), 0.05, Math.sin((t0 + t1) / 2)];
    acc.tri(a, b, cc, col, ref); if (r1 > 0.01) acc.tri(a, cc, d, col, ref);
  }
}
const MINARET = sRGB(0xeee9de), CAP = sRGB(0x8b95a0), DOME = sRGB(0x9aa4ae);
function addMinaret(acc, x, z, y0, h) {
  addShaft(acc, x, z, y0, y0 + h * 0.74, 1.15, 0.95, MINARET);
  addShaft(acc, x, z, y0 + h * 0.74, y0 + h * 0.78, 1.9, 1.9, MINARET);          // şerefe
  addShaft(acc, x, z, y0 + h * 0.78, y0 + h * 0.97, 0.95, 0.8, MINARET);
  addShaft(acc, x, z, y0 + h * 0.97, y0 + h * 1.12, 1.15, 0, CAP);               // külah
}

// ---- yerleşik bina üretimi ----
function buildTileGeometry(list, boxMode, kind) {
  const acc = new Acc();
  for (const b of list) {
    const { pts, h, cls, seed } = b;
    const wallCol = cls === 1 ? sRGB(0xf6f2ea) : WALLS[Math.floor(rnd(seed) * WALLS.length)].clone().multiplyScalar(0.92 + rnd(seed + 7) * 0.12);
    const low = h <= 14;
    const roofCol = cls === 1 ? sRGB(0xc9cecb) : cls === 2 ? DOME : low && rnd(seed + 3) < 0.8 ? ROOF_TILE[seed % 3] : ROOF_FLAT[seed % 3];
    const poly = boxMode ? obbOf(pts) : pts;
    const ar = Math.abs(area2(poly));
    const hip = !boxMode && cls === 0 && low && poly.length <= 6 && ar < 320 && rnd(seed + 5) < 0.78;
    extrude(acc, poly, h, wallCol, roofCol, hip, seed);
    if (cls === 2 && !boxMode) { // cami
      let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= poly.length; cz /= poly.length;
      const ob = obbOf(poly); const w = Math.hypot(ob[1][0] - ob[0][0], ob[1][1] - ob[0][1]), d = Math.hypot(ob[2][0] - ob[1][0], ob[2][1] - ob[1][1]);
      const r = Math.min(Math.min(w, d) * 0.42, 13);
      if (ar > 120 && r > 3) addDome(acc, cx, cz, h, r, DOME);
      let far = poly[0], fd = 0; for (const p of poly) { const dd = Math.hypot(p[0] - cx, p[1] - cz); if (dd > fd) { fd = dd; far = p; } }
      const mh = 30 + rnd(seed + 11) * 8;
      addMinaret(acc, far[0] + (cx - far[0]) * 0.08, far[1] + (cz - far[1]) * 0.08, 0, mh);
      if (ar > 700) { let f2 = poly[0], d2 = 0; for (const p of poly) { const dd = Math.hypot(p[0] - far[0], p[1] - far[1]); if (dd > d2) { d2 = dd; f2 = p; } } addMinaret(acc, f2[0] + (cx - f2[0]) * 0.08, f2[1] + (cz - f2[1]) * 0.08, 0, mh * 0.95); }
    } else if (cls === 3 && !boxMode) { // saat kulesi: külah
      let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= poly.length; cz /= poly.length;
      addShaft(acc, cx, cz, h, h + 7, Math.max(1.5, Math.sqrt(ar) * 0.45), 0, CAP, 4);
    }
  }
  return acc.empty ? null : acc.geometry();
}

// ---- yol/yeşil karoları (düz) ----
const ROAD_COL = [0x55585d, 0x5d6065, 0x696b6f, 0xb4afa2].map(sRGB);
const ROAD_Y = [0.28, 0.24, 0.2, 0.14];
function ribbon(acc, pts, w, y, col) {
  const n = pts.length; if (n < 2) return;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    let dx0 = 0, dz0 = 0, dx1 = 0, dz1 = 0;
    if (i > 0) { dx0 = pts[i][0] - pts[i - 1][0]; dz0 = pts[i][1] - pts[i - 1][1]; const l = Math.hypot(dx0, dz0) || 1; dx0 /= l; dz0 /= l; }
    if (i < n - 1) { dx1 = pts[i + 1][0] - pts[i][0]; dz1 = pts[i + 1][1] - pts[i][1]; const l = Math.hypot(dx1, dz1) || 1; dx1 /= l; dz1 /= l; }
    if (i === 0) { dx0 = dx1; dz0 = dz1; } if (i === n - 1) { dx1 = dx0; dz1 = dz0; }
    let nx = -(dz0 + dz1), nz = dx0 + dx1; const l = Math.hypot(nx, nz);
    if (l < 1e-4) { nx = -dz0; nz = dx0; } else { nx /= l; nz /= l; }
    const cosH = Math.max(0.55, nx * -dz0 + nz * dx0); // köşe uzaması sınırı
    const k = (w / 2) / cosH;
    L.push([pts[i][0] + nx * k, pts[i][1] + nz * k]); R.push([pts[i][0] - nx * k, pts[i][1] - nz * k]);
  }
  const b = acc.p.length / 3;
  for (let i = 0; i < n; i++) { acc.v(L[i][0], y, L[i][1], 0, 1, 0, 0, 0, col); acc.v(R[i][0], y, R[i][1], 0, 1, 0, 0, 0, col); }
  for (let i = 0; i < n - 1; i++) { const l0 = b + i * 2, r0 = l0 + 1, l1 = l0 + 2, r1 = l0 + 3; acc.i.push(l0, l1, r0, r0, l1, r1); }
}
function flatPoly(acc, pts, y, col) {
  const v2 = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  let faces; try { faces = THREE.ShapeUtils.triangulateShape(v2, []); } catch (e) { return; }
  const b = acc.p.length / 3;
  for (const p of pts) acc.v(p[0], y, p[1], 0, 1, 0, 0, 0, col);
  for (const f of faces) {
    const a = pts[f[0]], bb = pts[f[1]], cc = pts[f[2]];
    const ny = (bb[1] - a[1]) * (cc[0] - a[0]) - (bb[0] - a[0]) * (cc[1] - a[1]);
    if (ny >= 0) acc.i.push(b + f[0], b + f[1], b + f[2]); else acc.i.push(b + f[0], b + f[2], b + f[1]);
  }
}

const dmPts = (flat) => { const o = []; for (let i = 0; i < flat.length; i += 2) o.push([flat[i] / 10, flat[i + 1] / 10]); return o; };

export function buildWorld(quality) {
  const group = new THREE.Group(); group.name = 'world';
  const low = quality.name === 'low';
  const tiles = []; // { mesh, cx, cz, r, kind, shore }
  const tex = windowTextures();
  const cityMat = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, map: tex.map, emissive: 0xffffff, emissiveMap: tex.emi, emissiveIntensity: 0 });
  const flatMat = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const addTile = (geo, mat, kind, cx, cz, shore = false, shadow = false) => {
    if (!geo) return null;
    const mesh = new THREE.Mesh(geo, mat); mesh.matrixAutoUpdate = false; mesh.receiveShadow = shadow;
    mesh.name = kind + '-tile'; group.add(mesh);
    tiles.push({ mesh, cx, cz, kind, shore });
    return mesh;
  };
  const tkey = (x, z, s) => Math.floor(x / s) + ',' + Math.floor(z / s);

  // --- yerleşik binalar: 250 m karolar ---
  const bt = new Map();
  DATA.b.forEach((b, idx) => {
    const pts = dmPts(b.slice(2));
    let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= pts.length; cz /= pts.length;
    const k = tkey(cx, cz, TILE);
    if (!bt.has(k)) bt.set(k, { list: [], cx: (Math.floor(cx / TILE) + 0.5) * TILE, cz: (Math.floor(cz / TILE) + 0.5) * TILE });
    bt.get(k).list.push({ pts, h: b[0] / 10, cls: b[1], seed: idx * 7 + 13 });
  });
  for (const t of bt.values()) {
    const boxMode = Math.hypot(t.cx, t.cz) > quality.detailRadius;
    addTile(buildTileGeometry(t.list, boxMode), cityMat, 'bina', t.cx, t.cz);
  }

  // --- uzak yapılar (kutular): 1 km karolar; Asya kıyısı her zaman görünür ---
  const ft = new Map();
  for (let i = 0, k = 0; i < DATA.f.length; i += 6, k++) {
    const [cx, cz, w, d, ang, h] = DATA.f.slice(i, i + 6);
    if (quality.farKeep < 1 && w * d < 600 && rnd(k * 17 + 5) > quality.farKeep) continue;
    const key = tkey(cx, cz, FTILE);
    if (!ft.has(key)) ft.set(key, { list: [], cx: (Math.floor(cx / FTILE) + 0.5) * FTILE, cz: (Math.floor(cz / FTILE) + 0.5) * FTILE });
    const hh = h * (0.85 + rnd(k * 13 + 1) * 0.55);
    ft.get(key).list.push({ pts: boxPts(cx, cz, w, d, ang), h: Math.max(6, hh), cls: 0, seed: k * 5 + 101 });
  }
  for (const t of ft.values()) addTile(buildTileGeometry(t.list, false), cityMat, 'uzak', t.cx, t.cz, t.cz > 1800);

  // --- yollar, yeşil alanlar, stadyum çevresi kaldırımı: 250 m düz karolar ---
  const flat = new Map();
  const flatAcc = (x, z) => {
    const k = tkey(x, z, FLAT_TILE);
    if (!flat.has(k)) flat.set(k, { acc: new Acc(), cx: (Math.floor(x / FLAT_TILE) + 0.5) * FLAT_TILE, cz: (Math.floor(z / FLAT_TILE) + 0.5) * FLAT_TILE });
    return flat.get(k);
  };
  {
    const sp = dmPts(DATA.sp); const ct = sp.reduce((a, p) => [a[0] + p[0] / sp.length, a[1] + p[1] / sp.length], [0, 0]);
    flatPoly(flatAcc(ct[0], ct[1]).acc, sp, 0.06, sRGB(0xb7b3a8));
  }
  const parkCol = [0x74905a, 0x7d9760, 0x6c8856].map(sRGB);
  const greenPolys = [];
  DATA.g.forEach((g, i) => {
    const pts = dmPts(g); greenPolys.push(pts);
    let cx = 0, cz = 0; for (const p of pts) { cx += p[0]; cz += p[1]; } cx /= pts.length; cz /= pts.length;
    flatPoly(flatAcc(cx, cz).acc, pts, 0.1 + (i % 3) * 0.005, parkCol[i % 3]);
  });
  for (const r of DATA.r) {
    const cls = r[0], w = r[1] / 10, pts = dmPts(r.slice(2));
    let run = [], rk = null;
    const flush = () => { if (run.length >= 2) { const f = flatAcc(run[0][0], run[0][1]); ribbon(f.acc, run, w, ROAD_Y[cls], ROAD_COL[cls]); } run = []; };
    for (const p of pts) {
      const k = tkey(p[0], p[1], FLAT_TILE);
      if (rk !== null && k !== rk) { const last = run[run.length - 1]; flush(); run = [last]; }
      rk = k; run.push(p);
    }
    flush();
  }
  for (const f of flat.values()) {
    const near = Math.hypot(f.cx, f.cz) < 450;
    addTile(f.acc.empty ? null : f.acc.geometry(), flatMat, 'yol', f.cx, f.cz, false, near && quality.shadows);
  }

  // --- ağaçlar (parklar + OSM ağaç düğümleri), tek InstancedMesh ---
  const trunk = new THREE.CylinderGeometry(0.28, 0.38, 2.6, 5); trunk.translate(0, 1.3, 0);
  const crown = new THREE.IcosahedronGeometry(2.9, 0); crown.scale(1, 1.15, 1); crown.translate(0, 5.0, 0);
  const paint = (g, hex) => { const col = sRGB(hex), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = col.r; a[i + 1] = col.g; a[i + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed ? g : g; };
  paint(trunk, 0x5d4a38); paint(crown, 0x4f7a43);
  const treeGeo = mergeGeometries([trunk.index ? trunk.toNonIndexed() : trunk, crown.index ? crown.toNonIndexed() : crown]);
  const treeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true });
  const spots = [];
  for (let i = 0; i < DATA.t.length; i += 2) spots.push([DATA.t[i] / 10, DATA.t[i + 1] / 10]);
  const areas = greenPolys.map((p) => Math.abs(area2(p)));
  const totalA = areas.reduce((a, b) => a + b, 0) || 1;
  const wantPark = Math.max(0, quality.treeCount - spots.length);
  greenPolys.forEach((pts, gi) => {
    const nT = Math.round((areas[gi] / totalA) * wantPark * 1.0);
    let xmin = 1e9, xmax = -1e9, zmin = 1e9, zmax = -1e9; for (const p of pts) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); zmin = Math.min(zmin, p[1]); zmax = Math.max(zmax, p[1]); }
    let placed = 0, guard = 0;
    while (placed < nT && guard++ < nT * 12) {
      const x = xmin + rnd(gi * 997 + guard * 7 + 1) * (xmax - xmin), z = zmin + rnd(gi * 331 + guard * 13 + 2) * (zmax - zmin);
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        if ((pts[i][1] > z) !== (pts[j][1] > z) && x < ((pts[j][0] - pts[i][0]) * (z - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) inside = !inside;
      }
      if (inside) { spots.push([x, z]); placed++; }
    }
  });
  const nTrees = Math.min(spots.length, quality.treeCount + 400);
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, nTrees);
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
    for (let i = 0; i < nTrees; i++) {
      const k = 0.75 + rnd(i * 3 + 9) * 0.9; s.set(k, k * (0.9 + rnd(i + 5) * 0.4), k);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i + 1) * 6.28);
      p.set(spots[i][0], 0.1, spots[i][1]);
      m.compose(p, q, s); trees.setMatrixAt(i, m);
      col.setRGB(0.8 + rnd(i * 5) * 0.35, 0.85 + rnd(i * 7) * 0.3, 0.75 + rnd(i * 11) * 0.3); trees.setColorAt(i, col);
    }
    trees.instanceMatrix.needsUpdate = true; trees.computeBoundingSphere();
  }
  trees.name = 'agaclar'; group.add(trees);

  // --- zemin (denizde delik) + deniz ---
  const coast = DATA.coast.map((c) => dmPts(c)); // [Avrupa (z küçük), Asya]
  let E = coast[0], A = coast[1];
  if (E[0][0] > E[E.length - 1][0]) E = E.slice().reverse();       // Avrupa: x artan
  if (A[0][0] < A[A.length - 1][0]) A = A.slice().reverse();       // Asya: x azalan
  const dirAt = (pts, i0, i1) => { const a = pts[i0], b = pts[i1], l = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return [(a[0] - b[0]) / l, (a[1] - b[1]) / l]; };
  const ext = (p, d, L) => [p[0] + d[0] * L, p[1] + d[1] * L];
  const EXT = 9000;
  const eS = ext(E[0], dirAt(E, 0, Math.min(6, E.length - 1)), EXT), eE = ext(E[E.length - 1], dirAt(E, E.length - 1, Math.max(0, E.length - 7)), EXT);
  const aS = ext(A[0], dirAt(A, 0, Math.min(6, A.length - 1)), EXT), aE = ext(A[A.length - 1], dirAt(A, A.length - 1, Math.max(0, A.length - 7)), EXT);
  const waterPoly = [eS, ...E, eE, aS, ...A, aE];
  const v2w = waterPoly.map((p) => new THREE.Vector2(p[0], p[1]));
  const wFaces = THREE.ShapeUtils.triangulateShape(v2w, []);
  const mkGeo = (verts, faces, y) => {
    const pos = new Float32Array(verts.length * 3); verts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = p.y; });
    const idx = []; for (const f of faces) {
      const a = verts[f[0]], b = verts[f[1]], cc = verts[f[2]];
      const ny = (b.y - a.y) * (cc.x - a.x) - (b.x - a.x) * (cc.y - a.y);
      if (ny >= 0) idx.push(f[0], f[1], f[2]); else idx.push(f[0], f[2], f[1]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from({ length: verts.length * 3 }, (_, i) => (i % 3 === 1 ? 1 : 0)), 3));
    return g;
  };
  const S = FOG_FAR_LIMIT;
  const outer = [new THREE.Vector2(-S, -S), new THREE.Vector2(-S, S), new THREE.Vector2(S, S), new THREE.Vector2(S, -S)];
  const hole = v2w.slice();
  const gFaces = THREE.ShapeUtils.triangulateShape(outer, [hole]);
  const gGeo = mkGeo([...outer, ...hole], gFaces, 0);
  gGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), S * 1.5);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x8a877f });
  const ground = new THREE.Mesh(gGeo, groundMat); ground.name = 'zemin'; ground.frustumCulled = false; group.add(ground);

  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uDeep: { value: sRGB(0x1d4a6e) }, uHorizon: { value: sRGB(0xcfe6fa) }, uZenith: { value: sRGB(0x2f7fe0) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: sRGB(0xffffff) }, uSunVis: { value: 1 },
      uFogColor: { value: sRGB(0xcfe1f2) }, uFogNear: { value: FOG_NEAR }, uFogFar: { value: FOG_FAR }, uNight: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uSunVis, uFogNear, uFogFar, uNight;
      uniform vec3 uDeep, uHorizon, uZenith, uSunDir, uSunCol, uFogColor;
      varying vec3 vW;
      vec2 wave(vec2 p, vec2 d, float k, float w, float a, float dist){ float ph = dot(p, d) * k + uTime * w; return d * (a * k * cos(ph)) / (1.0 + dist * k * 0.012); }
      void main(){
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / dist;
        vec2 p = vW.xz;
        vec2 g = wave(p, normalize(vec2(1.0, 0.35)), 0.045, 0.9, 0.8, dist) + wave(p, normalize(vec2(-0.4, 1.0)), 0.11, 1.3, 0.4, dist)
               + wave(p, normalize(vec2(0.8, -0.7)), 0.27, 2.1, 0.2, dist) + wave(p, normalize(vec2(-0.9, -0.3)), 0.6, 3.0, 0.1, dist);
        vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
        float cosT = clamp(dot(N, V), 0.0, 1.0);
        float fres = 0.03 + 0.97 * pow(1.0 - cosT, 5.0);
        vec3 R = reflect(-V, N);
        vec3 sky = mix(uHorizon, uZenith, clamp(pow(max(R.y, 0.0), 0.5), 0.0, 1.0));
        vec3 col = mix(uDeep, sky, clamp(fres * 1.25 + 0.06, 0.0, 1.0));
        float sp = pow(max(dot(R, normalize(uSunDir)), 0.0), 220.0) * 2.2 + pow(max(dot(R, normalize(uSunDir)), 0.0), 18.0) * 0.18;
        col += uSunCol * sp * uSunVis;
        float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
        col = mix(col, uFogColor, f);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.Mesh(mkGeo(v2w, wFaces, -0.15), waterMat);
  water.name = 'bogaz'; water.frustumCulled = false; group.add(water);

  // --- Boğaz köprüsü (15 Temmuz Şehitler Köprüsü) ---
  const bridge = buildBridge(DATA.bridge);
  group.add(bridge.group);

  // --- arka plan tepeleri (Çamlıca / Yıldız): sisle solan siluet perdeleri ---
  const ridgeMat = new THREE.MeshBasicMaterial({ color: 0x6f806a, side: THREE.DoubleSide });
  const ridges = [];
  const mkRidge = (zc, dir, x0, x1, hMin, hMax, seed, wob) => {
    const N = 90, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const h = hMin + (hMax - hMin) * (0.5 + 0.5 * Math.sin(x * 0.0021 + seed) * Math.cos(x * 0.00057 + seed * 2.1) + 0.25 * Math.sin(x * 0.0087 + seed * 3.3));
      const z = zc + Math.sin(x * 0.0013 + seed) * wob;
      pos.push(x, -30, z, x, Math.max(20, h), z);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere();
    ridges.push(g);
  };
  mkRidge(3900, 1, -4500, 8500, 70, 190, 1.3, 260);
  mkRidge(4900, 1, -4500, 8500, 110, 260, 4.1, 300);
  mkRidge(-2700, -1, -6000, 7500, 80, 200, 2.2, 260);
  mkRidge(-3900, -1, -6000, 7500, 120, 260, 5.0, 300);

  { const g = mergeGeometries(ridges); const m = new THREE.Mesh(g, ridgeMat); m.name = 'tepe'; m.frustumCulled = false; group.add(m); }

  // ---- gün saati ----
  const tmp = new THREE.Color();
  const DAY_GROUND = sRGB(0x8a877f), NIGHT_GROUND = sRGB(0x161c29), NIGHT_TINT = sRGB(0x4c5570);
  const DAY_DEEP = sRGB(0x1d4a6e), NIGHT_DEEP = sRGB(0x07192b);
  const DAY_RIDGE = sRGB(0x5f7a66), NIGHT_RIDGE = sRGB(0x0f1623);
  function apply(st, night) {
    const u = waterMat.uniforms;
    u.uHorizon.value.copy(st.horizon); u.uZenith.value.copy(st.zenith);
    u.uSunCol.value.copy(st.sun); u.uSunVis.value = THREE.MathUtils.clamp(st.sunI / 1.2, 0, 1);
    u.uFogColor.value.copy(st.fog); u.uNight.value = night;
    u.uDeep.value.copy(DAY_DEEP).lerp(NIGHT_DEEP, night).lerp(st.horizon, 0.12);
    const nt = night * night; // alacakaranlıkta (night≈0.5) şehir hâlâ aydınlık, tam gecede koyu
    groundMat.color.copy(DAY_GROUND).lerp(NIGHT_GROUND, nt);
    tmp.set(0xffffff).lerp(NIGHT_TINT, nt);
    cityMat.color.copy(tmp); flatMat.color.copy(tmp); treeMat.color.copy(tmp);
    cityMat.emissiveIntensity = THREE.MathUtils.smoothstep(night, 0.35, 1) * 0.85;
    ridgeMat.color.copy(DAY_RIDGE).lerp(NIGHT_RIDGE, night).lerp(st.fog, 0.2 * (1 - night) + 0.05);
    bridge.apply(night);
  }
  function setSunDirection(dir) { waterMat.uniforms.uSunDir.value.copy(dir); }

  const cp = new THREE.Vector3();
  function update(dt, camera) {
    waterMat.uniforms.uTime.value += dt;
    cp.copy(camera.position);
    for (const t of tiles) {
      const dx = t.cx - cp.x, dz = t.cz - cp.z, d = Math.hypot(dx, dz, cp.y * 0.5);
      t.mesh.visible = t.shore || d < (t.kind === 'uzak' ? quality.farCull : quality.cullDist);
    }
    trees.visible = true;
  }

  const stats = { tiles: tiles.length, buildings: DATA.b.length, far: DATA.f.length / 6, trees: nTrees };
  return { group, apply, setSunDirection, update, stats };
}

// ---------------------------------------------------------------------------------------------
function buildBridge(br) {
  const group = new THREE.Group(); group.name = 'kopru';
  const A = br.a, B = br.b;
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const d = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = [-d[1], d[0]];
  const W = (s, t, y) => new THREE.Vector3(A[0] + d[0] * s + n[0] * t, y, A[1] + d[1] * s + n[1] * t);
  const ang = Math.atan2(d[0], d[1]); // yerel +Z -> eksen
  const sT1 = L / 2 - 537, sT2 = L / 2 + 537;
  const HW = 16.5, DECK_Y = 64, TOP = 165;
  const deckY = (s) => (s < sT1 ? THREE.MathUtils.lerp(54, DECK_Y, s / sT1) : s > sT2 ? THREE.MathUtils.lerp(DECK_Y, 54, (s - sT2) / (L - sT2)) : DECK_Y);
  const solids = [];

  // tabla: altıgen kesitli şerit
  {
    const N = 120, pos = [], idx = [];
    const prof = [[-HW, 0], [-HW, 1.6], [-HW + 1.5, 3.0], [HW - 1.5, 3.0], [HW, 1.6], [HW, 0], [HW - 5, -2.2], [-HW + 5, -2.2]];
    for (let i = 0; i <= N; i++) {
      const s = (L * i) / N, y = deckY(s);
      for (const [t, h] of prof) { const w = W(s, t, y + h); pos.push(w.x, w.y, w.z); }
      if (i < N) { const a = i * prof.length, b = a + prof.length; for (let k = 0; k < prof.length; k++) { const k2 = (k + 1) % prof.length; idx.push(a + k, b + k, b + k2, a + k, b + k2, a + k2); } }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    solids.push(g);
  }
  // kuleler: iki ayak (konik) + enine kirişler
  for (const sT of [sT1, sT2]) {
    for (const t of [-HW - 1.2, HW + 1.2]) {
      const g = new THREE.CylinderGeometry(1.8, 3.1, TOP + 12, 4, 1); g.rotateY(Math.PI / 4); g.scale(1.15, 1, 1.15);
      g.rotateY(ang); const p = W(sT, t, (TOP - 12) / 2); g.translate(p.x, p.y, p.z); solids.push(g);
    }
    for (const [y, hh] of [[TOP - 4, 6], [118, 4.5], [78, 4.5]]) {
      const g = new THREE.BoxGeometry(2 * (HW + 1.2) + 3, hh, 3.4); g.rotateY(ang); const p = W(sT, 0, y); g.translate(p.x, p.y, p.z); solids.push(g);
    }
  }
  // ankraj blokları
  for (const s of [0, L]) { const g = new THREE.BoxGeometry(34, 56, 26); g.rotateY(ang); const p = W(s + (s ? 6 : -6), 0, 22); g.translate(p.x, p.y, p.z); solids.push(g); }
  const steelMat = new THREE.MeshLambertMaterial({ color: 0xdfe3e7, emissive: 0x3a5f9a, emissiveIntensity: 0 });
  const flatten = (g) => { const o = g.index ? g.toNonIndexed() : g; o.deleteAttribute('uv'); return o; };
  const steel = new THREE.Mesh(mergeGeometries(solids.map(flatten)), steelMat);
  steel.name = 'kopru-tasiyici'; group.add(steel);

  // ana kablolar (parabol) + yan açıklıklar (doğru)
  const cables = [], hang = [];
  for (const t of [-HW, HW]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const s = (sT1 * i) / 12; pts.push(W(s, t, THREE.MathUtils.lerp(deckY(0) + 4, TOP - 3, Math.pow(i / 12, 1.15)))); }
    const span = sT2 - sT1, SEG = 72;
    for (let i = 1; i < SEG; i++) { const q = i / SEG, s = sT1 + span * q, k = 2 * q - 1; pts.push(W(s, t, DECK_Y + 4 + (TOP - 3 - DECK_Y - 4) * k * k)); if (i % 1 === 0 && i % 2 === 0) hang.push([W(s, t, DECK_Y + 4 + (TOP - 3 - DECK_Y - 4) * k * k), W(s, t, DECK_Y + 2.4)]); }
    for (let i = 0; i <= 12; i++) { const s = sT2 + ((L - sT2) * i) / 12; pts.push(W(s, t, THREE.MathUtils.lerp(TOP - 3, deckY(L) + 4, Math.pow(i / 12, 0.87)))); }
    cables.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.85, 4, false));
  }
  const cableMat = new THREE.MeshLambertMaterial({ color: 0xe9ecef, emissive: 0x4f86d6, emissiveIntensity: 0 });
  cables.forEach((g) => g.deleteAttribute('uv'));
  const cable = new THREE.Mesh(mergeGeometries(cables), cableMat); cable.name = 'kopru-kablo'; group.add(cable);
  const lp = []; for (const [a, b] of hang) lp.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xb6bcc4 });
  const susp = new THREE.LineSegments(lg, lineMat); susp.name = 'kopru-askilar'; group.add(susp);
  group.traverse((o) => { if (o.isMesh || o.isLineSegments) { o.geometry.computeBoundingSphere(); } });

  const dayLine = new THREE.Color(0xb6bcc4), nightLine = new THREE.Color(0x77a6ff);
  return {
    group,
    apply(night) {
      steelMat.emissiveIntensity = night * 0.35; cableMat.emissiveIntensity = night * 1.1;
      lineMat.color.copy(dayLine).lerp(nightLine, night);
    },
    axis: { A, B, d, sT1, sT2 },
  };
}
