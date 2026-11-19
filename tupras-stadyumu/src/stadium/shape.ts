/**
 * Plan-view curves of the bowl.
 *
 * The stand front line and the facade/roof footprint of Tüpraş Stadyumu are
 * rounded rectangles; a superellipse |x/a|^p + |z/b|^p = 1 fits the OSM rings
 * within a metre (inner ring p≈3.7, outer ring p≈2.85, see docs/RESEARCH.md).
 *
 * Parameter t is the polar plan angle (0 = +X / south-east goal end,
 * π/2 = +Z / west main stand). Everything that has to be spaced evenly
 * (blocks, seats, roof bays, facade piers) goes through the arc-length table.
 */

export interface Vec2 {
  x: number;
  z: number;
}

const TAU = Math.PI * 2;

export class Superellipse {
  readonly a: number;
  readonly b: number;
  readonly p: number;
  private readonly samples: number;
  private readonly cum: Float64Array; // cumulative arc length at t = i/samples*TAU
  readonly length: number;

  constructor(a: number, b: number, p: number, samples = 4096) {
    this.a = a;
    this.b = b;
    this.p = p;
    this.samples = samples;
    this.cum = new Float64Array(samples + 1);
    let prev = this.point(0);
    let acc = 0;
    for (let i = 1; i <= samples; i++) {
      const q = this.point((i / samples) * TAU);
      acc += Math.hypot(q.x - prev.x, q.z - prev.z);
      this.cum[i] = acc;
      prev = q;
    }
    this.length = acc;
  }

  /**
   * Point at polar angle t. The polar form r(t) is smooth for p ≥ 2, so the
   * speed |dP/dt| is nearly uniform (the classic cos^(2/p) parametrisation is
   * singular at the axis tips and bunches samples there).
   */
  point(t: number): Vec2 {
    const c = Math.cos(t);
    const s = Math.sin(t);
    const f = Math.pow(Math.abs(c) / this.a, this.p) + Math.pow(Math.abs(s) / this.b, this.p);
    const r = Math.pow(1 / f, 1 / this.p);
    return { x: r * c, z: r * s };
  }

  /** Outward unit normal (gradient of the implicit function). */
  normal(t: number): Vec2 {
    const q = this.point(t);
    const p = this.p;
    const nx = (Math.sign(q.x) * Math.pow(Math.abs(q.x / this.a), p - 1)) / this.a;
    const nz = (Math.sign(q.z) * Math.pow(Math.abs(q.z / this.b), p - 1)) / this.b;
    const l = Math.hypot(nx, nz) || 1;
    // exactly on an axis the gradient is axis-aligned; avoid 0/0 at the tips
    if (l === 1 && nx === 0 && nz === 0) return { x: Math.cos(t), z: Math.sin(t) };
    return { x: nx / l, z: nz / l };
  }

  /** Point offset by d along the outward normal. */
  offset(t: number, d: number): Vec2 {
    const q = this.point(t);
    const n = this.normal(t);
    return { x: q.x + n.x * d, z: q.z + n.z * d };
  }

  /** Arc length from t=0 to t (t in any range). */
  arcAt(t: number): number {
    let tt = t % TAU;
    if (tt < 0) tt += TAU;
    const f = (tt / TAU) * this.samples;
    const i = Math.floor(f);
    const k = f - i;
    return this.cum[i] + (this.cum[Math.min(i + 1, this.samples)] - this.cum[i]) * k;
  }

  /** Inverse of arcAt: s in [0, length) → t in [0, 2π). Accepts any s (wraps). */
  tAt(s: number): number {
    let ss = s % this.length;
    if (ss < 0) ss += this.length;
    let lo = 0;
    let hi = this.samples;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= ss) lo = mid;
      else hi = mid;
    }
    const seg = this.cum[hi] - this.cum[lo] || 1;
    return ((lo + (ss - this.cum[lo]) / seg) / this.samples) * TAU;
  }

  /** Normalised arc parameter u ∈ [0,1) → t. */
  tAtU(u: number): number {
    return this.tAt(u * this.length);
  }
}

/** Distance along the ray from the origin with direction of `p` to the curve. */
export function radiusAlong(curve: Superellipse, dir: Vec2): number {
  // solve |r dx / a|^p + |r dz / b|^p = 1 for r
  const p = curve.p;
  const f = Math.pow(Math.abs(dir.x) / curve.a, p) + Math.pow(Math.abs(dir.z) / curve.b, p);
  return Math.pow(1 / f, 1 / p);
}

/** Angle of a direction in the plan (0 = +X, π/2 = +Z), in [0, 2π). */
export function planAngle(x: number, z: number): number {
  const a = Math.atan2(z, x);
  return a < 0 ? a + TAU : a;
}

export { TAU };
