/**
 * Saf geometri ve istatistik yardımcıları (DOM yok; birim testlenebilir).
 * Tüm açılar derece. NaN "yok" demektir ve yayılır.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export const toRad = (d: number) => d * RAD;
export const toDeg = (r: number) => r * DEG;

/**
 * İç açı: b köşesinde, BA ve BC vektörleri arasındaki açı.
 *   θ = arccos( (BA·BC) / (|BA|·|BC|) )  ∈ [0°, 180°]
 * 180° = düz (a-b-c doğrusal), 0° = tamamen kapalı. Sıfır uzunluklu kenar → NaN.
 */
export function angle3(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  const v1x = ax - bx;
  const v1y = ay - by;
  const v2x = cx - bx;
  const v2y = cy - by;
  const m = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (!(m > 1e-9)) return NaN;
  const c = (v1x * v2x + v1y * v2y) / m;
  return Math.acos(Math.max(-1, Math.min(1, c))) * DEG;
}

/** Üç boyutlu iç açı (derece). */
export function angle3d(a: ArrayLike<number>, b: ArrayLike<number>, c: ArrayLike<number>): number {
  const v1 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const v2 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const m = Math.hypot(v1[0], v1[1], v1[2]) * Math.hypot(v2[0], v2[1], v2[2]);
  if (!(m > 1e-12)) return NaN;
  const d = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  return Math.acos(Math.max(-1, Math.min(1, d / m))) * DEG;
}

/** Açıyı (−180, 180] aralığına sarar. */
export function wrapDeg(a: number): number {
  if (!Number.isFinite(a)) return NaN;
  let r = ((a + 180) % 360 + 360) % 360 - 180;
  if (r === -180) r = 180;
  return r;
}

/** İki yön arasındaki işaretli fark b − a, (−180, 180]. */
export const angDiff = (a: number, b: number) => wrapDeg(b - a);

/** Dairesel ortalama (derece). Boşsa NaN. */
export function circMean(deg: number[]): number {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const d of deg) {
    if (!Number.isFinite(d)) continue;
    sx += Math.cos(d * RAD);
    sy += Math.sin(d * RAD);
    n++;
  }
  return n ? Math.atan2(sy, sx) * DEG : NaN;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);

function finite(a: ArrayLike<number>): number[] {
  const out: number[] = [];
  for (let i = 0; i < a.length; i++) if (Number.isFinite(a[i])) out.push(a[i]);
  return out;
}

export function mean(a: ArrayLike<number>): number {
  const f = finite(a);
  if (!f.length) return NaN;
  let s = 0;
  for (const v of f) s += v;
  return s / f.length;
}

export function std(a: ArrayLike<number>): number {
  const f = finite(a);
  if (f.length < 2) return NaN;
  const m = mean(f);
  let s = 0;
  for (const v of f) s += (v - m) ** 2;
  return Math.sqrt(s / (f.length - 1));
}

export function median(a: ArrayLike<number>): number {
  const f = finite(a).sort((x, y) => x - y);
  if (!f.length) return NaN;
  const m = f.length >> 1;
  return f.length % 2 ? f[m] : (f[m - 1] + f[m]) / 2;
}

/** p ∈ [0,1], doğrusal aradeğerlemeli yüzdelik. */
export function percentile(a: ArrayLike<number>, p: number): number {
  const f = finite(a).sort((x, y) => x - y);
  if (!f.length) return NaN;
  const idx = clamp01(p) * (f.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return f[lo] + (f[hi] - f[lo]) * (idx - lo);
}

export function minOf(a: ArrayLike<number>, from = 0, to = a.length - 1): number {
  let m = NaN;
  for (let i = Math.max(0, from); i <= Math.min(a.length - 1, to); i++) {
    const v = a[i];
    if (Number.isFinite(v) && (Number.isNaN(m) || v < m)) m = v;
  }
  return m;
}

export function maxOf(a: ArrayLike<number>, from = 0, to = a.length - 1): number {
  let m = NaN;
  for (let i = Math.max(0, from); i <= Math.min(a.length - 1, to); i++) {
    const v = a[i];
    if (Number.isFinite(v) && (Number.isNaN(m) || v > m)) m = v;
  }
  return m;
}

export function argMax(a: ArrayLike<number>, from = 0, to = a.length - 1): number {
  let best = -1;
  for (let i = Math.max(0, from); i <= Math.min(a.length - 1, to); i++) {
    if (Number.isFinite(a[i]) && (best < 0 || a[i] > a[best])) best = i;
  }
  return best;
}

export function argMin(a: ArrayLike<number>, from = 0, to = a.length - 1): number {
  let best = -1;
  for (let i = Math.max(0, from); i <= Math.min(a.length - 1, to); i++) {
    if (Number.isFinite(a[i]) && (best < 0 || a[i] < a[best])) best = i;
  }
  return best;
}

/** Aralıktaki geçerli değerlerin ortalaması. */
export function meanRange(a: ArrayLike<number>, from: number, to: number): number {
  let s = 0;
  let n = 0;
  for (let i = Math.max(0, from); i <= Math.min(a.length - 1, to); i++) {
    if (Number.isFinite(a[i])) {
      s += a[i];
      n++;
    }
  }
  return n ? s / n : NaN;
}

export type BBox = readonly [number, number, number, number];

export function bboxIoU(a: BBox, b: BBox): number {
  const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const ua = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
  const ub = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const u = ua + ub - inter;
  return u > 0 ? inter / u : 0;
}

/** NaN'a duyarlı kayan medyan (pencere tek sayıya yuvarlanır). */
export function rollingMedian(a: ArrayLike<number>, win: number): Float32Array {
  const n = a.length;
  const out = new Float32Array(n).fill(NaN);
  const h = Math.max(0, Math.floor(win / 2));
  for (let i = 0; i < n; i++) {
    const buf: number[] = [];
    for (let j = Math.max(0, i - h); j <= Math.min(n - 1, i + h); j++) if (Number.isFinite(a[j])) buf.push(a[j]);
    if (buf.length) {
      buf.sort((x, y) => x - y);
      const m = buf.length >> 1;
      out[i] = buf.length % 2 ? buf[m] : (buf[m - 1] + buf[m]) / 2;
    }
  }
  return out;
}

export interface Peak {
  index: number;
  value: number;
  prominence: number;
}

/**
 * Yerel tepeler. Bir nokta, her iki yanındaki en yakın daha yüksek noktaya kadar olan aralıkta
 * en düşük değerin üstünde `prominence` kadar yükseliyorsa tepe sayılır; `minDist` (örnek) içinde
 * kalan zayıf tepeler elenir. NaN'lar tepeyi böler.
 */
export function findPeaks(a: ArrayLike<number>, opts: { minValue?: number; minProminence?: number; minDist?: number } = {}): Peak[] {
  const { minValue = -Infinity, minProminence = 0, minDist = 1 } = opts;
  const n = a.length;
  const cand: Peak[] = [];
  for (let i = 1; i < n - 1; i++) {
    const v = a[i];
    if (!Number.isFinite(v) || v < minValue) continue;
    if (!(v >= a[i - 1] && v > a[i + 1])) continue;
    // sol taraf
    let lmin = v;
    let j = i - 1;
    while (j >= 0 && Number.isFinite(a[j]) && a[j] <= v) {
      lmin = Math.min(lmin, a[j]);
      j--;
    }
    let rmin = v;
    let k = i + 1;
    while (k < n && Number.isFinite(a[k]) && a[k] <= v) {
      rmin = Math.min(rmin, a[k]);
      k++;
    }
    const prom = v - Math.max(lmin, rmin);
    if (prom >= minProminence) cand.push({ index: i, value: v, prominence: prom });
  }
  cand.sort((p, q) => q.value - p.value);
  const kept: Peak[] = [];
  for (const p of cand) if (kept.every((q) => Math.abs(q.index - p.index) >= minDist)) kept.push(p);
  return kept.sort((p, q) => p.index - q.index);
}
