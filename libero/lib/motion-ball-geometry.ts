/* ───────────────────────────────────────────────────────────
   Kesik ikosahedron (klasik futbol topu) geometrisi.
   Saf matematik: DOM, three ya da React yok. Hem sunucuda (SVG yedeği)
   hem de tembel yüklenen 3B sahne ve doku üreticisinde kullanılır.

   • 60 köşe, 90 kenar, 32 yüz: 12 beşgen + 20 altıgen (Euler: 60 − 90 + 32 = 2)
   • Kutuplar (±Y) birer beşgenin ortasıdır; bu sayede küre UV'sinin kutup
     noktaları düz, koyu bir panelin içinde kalır ve dikiş hatası görünmez.
   ─────────────────────────────────────────────────────────── */

export type V3 = [number, number, number];

export interface Panel {
  kind: 'pent' | 'hex';
  /** köşe indeksleri, dıştan bakınca saat yönünün tersine */
  verts: number[];
  /** birim normal (yüz merkezine doğru) */
  normal: V3;
  /** birim küreye oturan düzlemin orijine uzaklığı (apotem) */
  apothem: number;
}

export interface Ball {
  vertices: V3[];
  panels: Panel[];
  edges: [number, number][];
}

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm3 = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** 12 köşeli ikosahedron: üst kutup, 5 üst halka, 5 alt halka (36° kaymış), alt kutup. */
function icosahedron(): { v: V3[]; faces: [number, number, number][] } {
  const lat = Math.atan(0.5);
  const v: V3[] = [[0, 1, 0]];
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5;
    v.push([Math.cos(lat) * Math.cos(a), Math.sin(lat), Math.cos(lat) * Math.sin(a)]);
  }
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5 + Math.PI / 5;
    v.push([Math.cos(lat) * Math.cos(a), -Math.sin(lat), Math.cos(lat) * Math.sin(a)]);
  }
  v.push([0, -1, 0]);
  const U = (k: number) => 1 + (((k % 5) + 5) % 5);
  const L = (k: number) => 6 + (((k % 5) + 5) % 5);
  const faces: [number, number, number][] = [];
  for (let k = 0; k < 5; k++) {
    faces.push([0, U(k), U(k + 1)]); // üst kapak
    faces.push([U(k), L(k), U(k + 1)]); // üst bant (aşağı bakan üçgen)
    faces.push([L(k), L(k + 1), U(k + 1)]); // alt bant (yukarı bakan üçgen)
    faces.push([11, L(k + 1), L(k)]); // alt kapak
  }
  // dışa bakan sarım: normal · ağırlık merkezi > 0
  return {
    v,
    faces: faces.map(([a, b, c]) => {
      const n = cross(sub(v[b], v[a]), sub(v[c], v[a]));
      const g = add(add(v[a], v[b]), v[c]);
      return dot(n, g) > 0 ? [a, b, c] : [a, c, b];
    }),
  };
}

let cached: Ball | null = null;

/** Kesik ikosahedronu kurar (önbellekli). Tüm köşeler birim küre üzerindedir. */
export function buildBall(): Ball {
  if (cached) return cached;
  const { v: iv, faces } = icosahedron();

  // 60 köşe: her yönlü ikosahedron kenarı (a → b) için a'dan b'ye doğru 1/3 noktası
  const key = (a: number, b: number) => a * 12 + b;
  const vid = new Map<number, number>();
  const vertices: V3[] = [];
  const point = (a: number, b: number): number => {
    const k = key(a, b);
    let i = vid.get(k);
    if (i === undefined) {
      i = vertices.length;
      vertices.push(norm3(add(mul(iv[a], 2 / 3), mul(iv[b], 1 / 3))));
      vid.set(k, i);
    }
    return i;
  };

  const panels: Panel[] = [];
  const finish = (kind: 'pent' | 'hex', verts: number[]): void => {
    const c = norm3(verts.map((i) => vertices[i]).reduce((s, p) => add(s, p), [0, 0, 0] as V3));
    // düzlem: bütün köşeler aynı apotemde olmalı
    const apothem = dot(c, vertices[verts[0]]);
    panels.push({ kind, verts, normal: c, apothem });
  };

  // altıgenler: ikosahedron yüzleri
  for (const [a, b, c] of faces) {
    finish('hex', [point(a, b), point(b, a), point(b, c), point(c, b), point(c, a), point(a, c)]);
  }
  // beşgenler: ikosahedron köşeleri (komşular dıştan bakınca saat yönünün tersine sıralanır)
  for (let a = 0; a < 12; a++) {
    const nb = new Set<number>();
    for (const f of faces) if (f.includes(a)) for (const x of f) if (x !== a) nb.add(x);
    const n = iv[a];
    // a'ya dik düzlemde bir taban (e1, e2)
    const ref: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const e1 = norm3(cross(n, ref));
    const e2 = cross(n, e1);
    const ordered = [...nb].sort((p, q) => {
      const dp = sub(iv[p], iv[a]);
      const dq = sub(iv[q], iv[a]);
      return Math.atan2(dot(dp, e2), dot(dp, e1)) - Math.atan2(dot(dq, e2), dot(dq, e1));
    });
    finish('pent', ordered.map((b) => point(a, b)));
  }

  // kenarlar (tekil)
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (const p of panels) {
    for (let i = 0; i < p.verts.length; i++) {
      const a = p.verts[i];
      const b = p.verts[(i + 1) % p.verts.length];
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(k)) {
        seen.add(k);
        edges.push(a < b ? [a, b] : [b, a]);
      }
    }
  }

  cached = { vertices, panels, edges };
  return cached;
}

/** Doku/üretim döngüleri için düz diziler: panel normali ve 1/apotem. */
export interface PanelTable {
  n: number;
  nx: Float32Array;
  ny: Float32Array;
  nz: Float32Array;
  invD: Float32Array;
  /** 1 = beşgen, 0 = altıgen */
  pent: Uint8Array;
}

export function panelTable(): PanelTable {
  const { panels } = buildBall();
  const n = panels.length;
  const t: PanelTable = { n, nx: new Float32Array(n), ny: new Float32Array(n), nz: new Float32Array(n), invD: new Float32Array(n), pent: new Uint8Array(n) };
  panels.forEach((p, i) => {
    t.nx[i] = p.normal[0];
    t.ny[i] = p.normal[1];
    t.nz[i] = p.normal[2];
    t.invD[i] = 1 / p.apothem;
    t.pent[i] = p.kind === 'pent' ? 1 : 0;
  });
  return t;
}

export interface PanelHit {
  /** en yakın panel */
  i: number;
  /** ikinci en yakın panel */
  j: number;
  /** i panelinin türü */
  pent: boolean;
  /** dikişe yaklaşık açısal uzaklık (radyan, birim kürede) */
  dist: number;
}

/**
 * p (birim vektör) yönünde ışın merkezden çıkınca hangi panele çarpar?
 * Çokyüzlüde ışının ilk çarptığı yüz, (p·n) / apotem değeri en büyük olandır.
 * Dikiş, ilk iki değerin eşit olduğu yerdir; aradaki fark dikişe uzaklıkla doğru orantılıdır.
 */
export function panelAt(p: V3, t: PanelTable = panelTable()): PanelHit {
  let b = -Infinity;
  let s = -Infinity;
  let bi = 0;
  let si = 0;
  for (let f = 0; f < t.n; f++) {
    const r = (p[0] * t.nx[f] + p[1] * t.ny[f] + p[2] * t.nz[f]) * t.invD[f];
    if (r > b) {
      s = b;
      si = bi;
      b = r;
      bi = f;
    } else if (r > s) {
      s = r;
      si = f;
    }
  }
  // w = n_i/d_i − n_j/d_j; teğet bileşeninin büyüklüğü, farkın küre üzerindeki eğimidir
  const wx = t.nx[bi] * t.invD[bi] - t.nx[si] * t.invD[si];
  const wy = t.ny[bi] * t.invD[bi] - t.ny[si] * t.invD[si];
  const wz = t.nz[bi] * t.invD[bi] - t.nz[si] * t.invD[si];
  const wp = wx * p[0] + wy * p[1] + wz * p[2];
  const tx = wx - wp * p[0];
  const ty = wy - wp * p[1];
  const tz = wz - wp * p[2];
  const g = Math.hypot(tx, ty, tz) || 1e-6;
  return { i: bi, j: si, pent: t.pent[bi] === 1, dist: (b - s) / g };
}

/** three.js SphereGeometry ile aynı UV → yön eşlemesi (u: boylam, vTop: kutuptan uzaklık oranı 0..1). */
export function dirFromUV(u: number, vTop: number): V3 {
  const phi = u * 2 * Math.PI;
  const theta = vTop * Math.PI;
  const st = Math.sin(theta);
  return [-Math.cos(phi) * st, Math.cos(theta), Math.sin(phi) * st];
}

/* ── Döndürme yardımcıları (SVG yedeği ile 3B sahnenin aynı başlangıç duruşu için) ── */

/** Birim kuaterniyon [x, y, z, w] */
export type Quat = [number, number, number, number];

export function quatFromEuler(rx: number, ry: number, rz: number): Quat {
  // three.js 'XYZ' sırası
  const c1 = Math.cos(rx / 2);
  const c2 = Math.cos(ry / 2);
  const c3 = Math.cos(rz / 2);
  const s1 = Math.sin(rx / 2);
  const s2 = Math.sin(ry / 2);
  const s3 = Math.sin(rz / 2);
  return [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3,
  ];
}

export function rotateByQuat(v: V3, q: Quat): V3 {
  const [x, y, z] = v;
  const [qx, qy, qz, qw] = q;
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx];
}

/** Topun varsayılan başlangıç duruşu (Euler XYZ, radyan): hem 3B hem SVG yedeği bunu kullanır. */
export const BALL_START_EULER: V3 = [0.42, 0.62, -0.2];

/* ── SVG yedeği ───────────────────────────────────────────── */

export interface SvgPanel {
  kind: 'pent' | 'hex';
  /** SVG yol verisi (d) */
  d: string;
  /** panel merkezinin z bileşeni (1 = tam karşıda) */
  facing: number;
}

const slerp = (a: V3, b: V3, t: number): V3 => norm3(add(mul(a, 1 - t), mul(b, t)));

/** Çokgeni z ≥ 0 yarım uzayına keser; limb boyunca kesişen yayı küre üstünde doldurur. */
function clipFront(poly: V3[]): V3[] {
  const out: V3[] = [];
  const n = poly.length;
  let exit: V3 | null = null;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const ain = a[2] >= 0;
    const bin = b[2] >= 0;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = a[2] / (a[2] - b[2]);
      const x = norm3(add(mul(a, 1 - t), mul(b, t)));
      x[2] = 0;
      if (ain && !bin) {
        out.push(x);
        exit = x;
      } else {
        if (exit) {
          // limb üzerinde çıkıştan girişe kısa yay
          const steps = 6;
          for (let k = 1; k < steps; k++) {
            const m = slerp(exit, x, k / steps);
            m[2] = 0;
            out.push(norm3(m));
          }
        }
        out.push(x);
      }
    }
  }
  return out;
}

/**
 * Topu verilen duruşta (kuaterniyon) +Z'den ortografik görünümle SVG yollarına çevirir.
 * Panel kenarları büyük daire yayları olarak bölünür; böylece çizgiler küreye yapışık görünür.
 * Koordinatlar −1..1 aralığındadır (SVG tarafı ölçekler).
 */
export function projectBallSvg(q: Quat, subdiv = 6, digits = 3): SvgPanel[] {
  const { vertices, panels } = buildBall();
  const rv = vertices.map((v) => rotateByQuat(v, q));
  const out: SvgPanel[] = [];
  const f = (x: number) => (Math.round(x * 10 ** digits) / 10 ** digits).toString();
  for (const p of panels) {
    const ring: V3[] = [];
    for (let i = 0; i < p.verts.length; i++) {
      const a = rv[p.verts[i]];
      const b = rv[p.verts[(i + 1) % p.verts.length]];
      for (let k = 0; k < subdiv; k++) ring.push(slerp(a, b, k / subdiv));
    }
    if (ring.every((r) => r[2] < -0.02)) continue; // tamamen arkada
    const clipped = ring.some((r) => r[2] < 0) ? clipFront(ring) : ring;
    if (clipped.length < 3) continue;
    const d = clipped.map((r, i) => `${i ? 'L' : 'M'}${f(r[0])} ${f(-r[1])}`).join('') + 'Z';
    const c = rotateByQuat(p.normal, q);
    out.push({ kind: p.kind, d, facing: c[2] });
  }
  return out;
}
