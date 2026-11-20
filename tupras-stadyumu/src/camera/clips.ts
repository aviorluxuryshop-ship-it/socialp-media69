/**
 * Cinematic camera clips (STEP 03).
 *
 * A flight is a chain of key frames; each pair of consecutive frames is a
 * clip, so the last frame of one clip is by construction the first frame of
 * the next. The chain plays as ONE continuous move:
 *   · positions and look targets follow centripetal Catmull-Rom curves that
 *     pass exactly through every key frame;
 *   · time is mapped per clip with a quintic Hermite whose end slopes come
 *     from a shared speed at every key frame and whose end accelerations are
 *     zero, so world speed AND acceleration are continuous across clip
 *     boundaries (no stop-and-go, no jumps); it starts from rest and settles
 *     at rest — like a drone.
 * Routes only enter or leave the bowl through the roof opening above the
 * pitch, and seat-to-seat moves slide while facing the pitch instead of
 * swinging round.
 */
import { CatmullRomCurve3, Vector3 } from 'three';
import { FACADE, FASCIA, PITCH_ELEVATION, ROOF, ROOF_INNER_CURVE, SUITES } from '../stadium/config.ts';
import { seatEye, type Block, type StadiumLayout } from '../stadium/layout.ts';
import type { CameraPose } from './views.ts';

export interface KeyFrame extends CameraPose {
  /** name of the clip that ends at this frame */
  label: string;
}

const Y = PITCH_ELEVATION;

// ------------------------------------------------------------------ geometry helpers

function blockCentre(b: Block): Vector3 {
  return new Vector3(b.center[0], b.center[1] + Y, b.center[2]);
}

/** Unit vectors at a plan angle: outward normal of the front curve, tangent (increasing t). */
function frameAt(layout: StadiumLayout, t: number): { out: Vector3; tan: Vector3 } {
  const n = layout.front.normal(t);
  return { out: new Vector3(n.x, 0, n.z), tan: new Vector3(-n.z, 0, n.x) };
}

/** Point offset by d along the outward normal of the front curve at angle t, height y (local). */
function frontPoint(layout: StadiumLayout, t: number, d: number, y: number): Vector3 {
  const q = layout.front.offset(t, d);
  return new Vector3(q.x, y + Y, q.z);
}

/** True if (x, z) lies over the roof opening (inside the inner tension ring, with a margin). */
export function overOpening(x: number, z: number, margin = 4): boolean {
  const a = ROOF_INNER_CURVE.a - margin;
  const b = ROOF_INNER_CURVE.b - margin;
  return Math.pow(Math.abs(x) / a, ROOF_INNER_CURVE.p) + Math.pow(Math.abs(z) / b, ROOF_INNER_CURVE.p) < 1;
}

/**
 * Lowest point of the roof structure (lower tension ring → lower radials) at
 * a plan position, in local metres above the pitch; Infinity over the opening.
 */
export function roofUnderside(layout: StadiumLayout, x: number, z: number): number {
  const t = Math.atan2(z, x);
  const dir = { x: Math.cos(t), z: Math.sin(t) };
  const rIn = Math.pow(
    1 / (Math.pow(Math.abs(dir.x) / ROOF_INNER_CURVE.a, ROOF_INNER_CURVE.p) + Math.pow(Math.abs(dir.z) / ROOF_INNER_CURVE.b, ROOF_INNER_CURVE.p)),
    1 / ROOF_INNER_CURVE.p,
  );
  const o = layout.outer;
  const rOut = Math.pow(1 / (Math.pow(Math.abs(dir.x) / o.a, o.p) + Math.pow(Math.abs(dir.z) / o.b, o.p)), 1 / o.p) - 0.9;
  const r = Math.hypot(x, z);
  if (r < rIn - 1.5) return Infinity;
  const k = Math.max(0, Math.min(1, (r - rIn) / (rOut - rIn)));
  return ROOF.innerBottomY - 0.5 + k * (FACADE.ringY - 1.4 - ROOF.innerBottomY);
}

/** Is a pose inside the bowl (under the roof line)? */
export function isInside(layout: StadiumLayout, p: Vector3): boolean {
  const o = layout.outer;
  const r = Math.pow(Math.abs(p.x) / o.a, o.p) + Math.pow(Math.abs(p.z) / o.b, o.p);
  return r < 1 && p.y < Y + ROOF.innerTopY + 4;
}

// ------------------------------------------------------------------ standard frames

/**
 * F0 — high above the stadium looking down at it. It sits on the side the
 * camera comes from (short climb), leaning towards the target stand.
 */
export function topFrame(layout: StadiumLayout, towards: Block, from?: Vector3): KeyFrame {
  const { out } = frameAt(layout, towards.tc);
  let hx = -out.x;
  let hz = -out.z;
  if (from && Math.hypot(from.x, from.z) > 60) {
    const l = Math.hypot(from.x, from.z);
    hx = (from.x / l) * 0.7 - out.x * 0.3;
    hz = (from.z / l) * 0.7 - out.z * 0.3;
    const k = Math.hypot(hx, hz) || 1;
    hx /= k;
    hz /= k;
  }
  const p = new Vector3(hx * 140, Y + 300, hz * 140);
  return { position: p, target: new Vector3(out.x * 20, Y, out.z * 20), fov: 46, label: 'Üstten' };
}

/** F1 — above the roof opening, looking down at the target stand. */
export function approachFrame(layout: StadiumLayout, b: Block): KeyFrame {
  const { out } = frameAt(layout, b.tc);
  const c = blockCentre(b);
  const p = new Vector3(-out.x * 18, Y + 105, -out.z * 18);
  return { position: p, target: c.clone().setY(Y + 6), fov: 50, label: 'Yaklaşma' };
}

/** F2 — inside the bowl over the pitch, facing the whole stand. */
export function standFrame(layout: StadiumLayout, b: Block): KeyFrame {
  const { out } = frameAt(layout, b.tc);
  const c = blockCentre(b);
  // stay inside the opening in plan; height between the tiers' view lines
  const p = frontPoint(layout, b.tc, -46, 19);
  if (!overOpening(p.x, p.z, 6)) p.set(-out.x * 4, Y + 19, -out.z * 4);
  return { position: p, target: c.clone().setY(Y + (b.tier === 'lower' ? 6 : 15)), fov: 55, label: 'Tribüne iniş' };
}

/** F3 — in front of the block, framing it whole (row/seat picking). */
export function blockFrame(layout: StadiumLayout, b: Block): KeyFrame {
  const c = blockCentre(b);
  let p: Vector3;
  if (b.tier === 'upper') {
    // over the pitch edge, inside the opening, below the inner truss
    p = frontPoint(layout, b.tc, -9, Math.min(b.center[1] + 1, ROOF.innerBottomY - 3.2));
  } else if (b.tier === 'suite') {
    // in front of the box, over the lower tier, below the upper-tier fascia
    p = frontPoint(layout, b.tc, 9, FASCIA.bottomY - 1.6);
  } else {
    p = frontPoint(layout, b.tc, -13, b.center[1] + 4.5);
  }
  return { position: p, target: c, fov: 52, label: 'Bloğa yaklaşma' };
}

export function seatFrame(layout: StadiumLayout, seat: number, fov = 62): KeyFrame {
  const e = seatEye(layout, seat);
  const position = new Vector3(e.x, e.y + Y, e.z);
  const target = new Vector3(e.x * -0.12, Y + 1.2, e.z * -0.12);
  return { position, target, fov, label: 'Koltuğa varış' };
}

/** A point over the lower tier, just under the roof's inner edge, in front of an upper block. */
function underEdgeFrame(layout: StadiumLayout, b: Block, target: Vector3, label: string): KeyFrame {
  const p = frontPoint(layout, b.tc, 6, ROOF.innerBottomY - 3.2);
  return { position: p, target: target.clone(), fov: 58, label };
}

/** In front of a suite, out from under the upper-tier overhang, over the lower tier. */
function suiteFrontFrame(layout: StadiumLayout, b: Block, target: Vector3, label: string): KeyFrame {
  const p = frontPoint(layout, b.tc, 13, FASCIA.bottomY - 1.4);
  return { position: p, target: target.clone(), fov: 60, label };
}

/** Max height (local) the camera may hover at above a seat (upper-tier soffit, suite ceiling). */
function headroom(layout: StadiumLayout, seat: number): number {
  const b = layout.blocks[layout.seats.block[seat]];
  const e = seatEye(layout, seat);
  if (b.tier === 'suite') return SUITES.ceilingY - 0.5;
  if (b.tier === 'lower') {
    const d = Math.hypot(e.x, e.z) - Math.hypot(layout.front.offset(b.tc, 0).x, layout.front.offset(b.tc, 0).z);
    if (d > FASCIA.d - 3) return FASCIA.bottomY - 0.8;
  }
  return Math.min(e.y + 3.5, roofUnderside(layout, e.x, e.z) - 1.2);
}

/** Hover point just in front of and above a seat, still facing the pitch. */
function hoverFrame(layout: StadiumLayout, seat: number): KeyFrame {
  const s = seatFrame(layout, seat);
  const b = layout.blocks[layout.seats.block[seat]];
  const { out } = frameAt(layout, b.tc);
  const e = seatEye(layout, seat);
  const y = Math.min(e.y + 2.2, headroom(layout, seat));
  const p = new Vector3(e.x - out.x * 2.4, y + Y, e.z - out.z * 2.4);
  return { position: p, target: s.target.clone(), fov: 60, label: 'Süzülme' };
}

/**
 * The turn between "facing the block" and "facing the pitch": sweep the gaze
 * sideways along the stand rather than through the camera.
 */
function turnFrame(layout: StadiumLayout, from: KeyFrame, to: KeyFrame, b: Block): KeyFrame {
  const { tan, out } = frameAt(layout, b.tc);
  let p = from.position.clone().lerp(to.position, 0.55);
  p.y = Math.min(Math.max(from.position.y, to.position.y) + 0.6, b.tier === 'suite' ? Y + FASCIA.bottomY - 1.2 : Infinity);
  if (b.tier === 'upper') {
    // slip under the roof's inner truss over the lower tier, then rise to the seat
    p = frontPoint(layout, b.tc, 6, ROOF.innerBottomY - 3.2);
  }
  // look along the stand towards its centre, slightly towards the pitch
  const side = Math.sin(b.tc) * Math.cos(b.tc) >= 0 ? -1 : 1;
  const target = p.clone().addScaledVector(tan, side * 32).addScaledVector(out, -14);
  target.y = Y + 6;
  return { position: p, target, fov: 56, label: 'Dönüş' };
}

// ------------------------------------------------------------------ planners

export interface PlanContext {
  layout: StadiumLayout;
  /** terrain + obstacles: minimum safe camera height (world) at x, z */
  minHeight?: (x: number, z: number) => number;
}

function poseFrame(p: CameraPose, label: string): KeyFrame {
  return { position: p.position.clone(), target: p.target.clone(), fov: p.fov, label };
}

/** Frames from the current pose to a seat. */
export function planToSeat(ctx: PlanContext, from: CameraPose, seat: number): KeyFrame[] {
  const { layout } = ctx;
  const b = layout.blocks[layout.seats.block[seat]];
  const frames: KeyFrame[] = [poseFrame(from, 'Başlangıç')];
  const seatF = seatFrame(layout, seat);
  const hover = hoverFrame(layout, seat);

  if (isInside(layout, from.position)) {
    // inside the bowl: is the camera at (or near) another seat?
    const near = nearestSeat(layout, from.position);
    const nearDist = near >= 0 ? from.position.distanceTo(new Vector3().copy(seatFrame(layout, near).position)) : Infinity;
    if (near >= 0 && nearDist < 1.0) {
      const nb = layout.blocks[layout.seats.block[near]];
      const hoverA = hoverFrame(layout, near);
      hoverA.label = 'Kalkış';
      frames.push(hoverA);
      const dist = from.position.distanceTo(seatF.position);
      // get out from under the overhang / the roof edge first, still facing the pitch
      if (nb.tier === 'suite' && (b.tier !== 'suite' || dist >= 70)) frames.push(suiteFrontFrame(layout, nb, hoverA.target, 'Kalkış'));
      if (nb.tier === 'upper' && (b.tier !== 'upper' || dist >= 70)) frames.push(underEdgeFrame(layout, nb, hoverA.target, 'Kalkış'));
      if (dist < 70) {
        // near: slide across facing the pitch — no swing towards the stand and back
        if (nb.tier === b.tier) {
          const mid = hoverA.position.clone().lerp(hover.position, 0.5);
          const { out } = frameAt(layout, (nb.tc + b.tc) / 2);
          mid.addScaledVector(out, -2.5);
          const cap = Math.min(headroom(layout, near), headroom(layout, seat), roofUnderside(layout, mid.x, mid.z) - 1.2) + Y;
          mid.y = Math.min(Math.max(hoverA.position.y, hover.position.y) + 1.2, cap);
          frames.push({ position: mid, target: hoverA.target.clone().lerp(hover.target, 0.5), fov: 60, label: 'Kayma' });
        }
        if (b.tier === 'upper' && nb.tier !== 'upper') frames.push(underEdgeFrame(layout, b, hover.target, 'Kayma'));
        if (b.tier === 'suite' && nb.tier !== 'suite') frames.push(suiteFrontFrame(layout, b, hover.target, 'Kayma'));
        frames.push(hover, seatF);
        return dedupe(frames);
      }
      // far: cross the bowl over the pitch facing the destination stand
      frames.push(standFrame(layout, b));
      const bf = blockFrame(layout, b);
      frames.push(bf, turnFrame(layout, bf, hover, b), hover, seatF);
      return dedupe(frames);
    }
    // somewhere else in the bowl (stand / block frame)
    frames.push(standFrame(layout, b));
  } else {
    // outside: (climb to the top frame,) then down through the roof opening
    const horiz = Math.hypot(from.position.x, from.position.z);
    const close = horiz < 450 && from.position.y < Y + 260;
    if (close) {
      // already near: an arc over the roof straight into the approach
      frames.push(liftFrame(ctx, from, approachFrame(layout, b)));
    } else {
      const top = topFrame(layout, b, from.position);
      if (from.position.y < Y + 200) frames.push(liftFrame(ctx, from, top));
      frames.push(top);
    }
    frames.push(approachFrame(layout, b), standFrame(layout, b));
  }
  const bf = blockFrame(layout, b);
  frames.push(bf, turnFrame(layout, bf, hover, b), hover, seatF);
  return dedupe(frames);
}

/** Frames from the current pose to the stand frame of a block (STEP 05 "choose stand"). */
export function planToFrame(ctx: PlanContext, from: CameraPose, dest: KeyFrame, viaBlock: Block | null): KeyFrame[] {
  const { layout } = ctx;
  const frames: KeyFrame[] = [poseFrame(from, 'Başlangıç')];
  const fromInside = isInside(layout, from.position);
  const destInside = isInside(layout, dest.position);
  if (fromInside && destInside) {
    const near = nearestSeat(layout, from.position);
    if (near >= 0 && from.position.distanceTo(seatFrame(layout, near).position) < 1.0) {
      const h = hoverFrame(layout, near);
      h.label = 'Kalkış';
      frames.push(h);
    }
    frames.push(dest);
    return dedupe(frames);
  }
  if (!fromInside && destInside && viaBlock) {
    const top = topFrame(layout, viaBlock, from.position);
    if (from.position.y < Y + 200) frames.push(liftFrame(ctx, from, top));
    frames.push(top, approachFrame(layout, viaBlock));
    if (dest.label !== 'Tribüne iniş') frames.push(standFrame(layout, viaBlock));
    frames.push(dest);
    return dedupe(frames);
  }
  if (fromInside && !destInside) {
    // leave through the opening
    const near = nearestSeat(layout, from.position);
    let look = from.target.clone();
    if (near >= 0 && from.position.distanceTo(seatFrame(layout, near).position) < 1.0) {
      const nb = layout.blocks[layout.seats.block[near]];
      const h = hoverFrame(layout, near);
      h.label = 'Kalkış';
      frames.push(h);
      look = h.target.clone();
      if (nb.tier === 'suite') frames.push(suiteFrontFrame(layout, nb, look, 'Kalkış'));
      if (nb.tier === 'upper') frames.push(underEdgeFrame(layout, nb, look, 'Kalkış'));
    }
    const up = new Vector3(from.position.x * 0.2, Y + 22, from.position.z * 0.2);
    const far = up.clone().multiplyScalar(-1.5).setY(Y + 6);
    frames.push({ position: up, target: far, fov: 52, label: 'Yükseliş' });
    // rise straight up through the opening, turning towards where the destination looks
    const exitTarget = dest.target.clone();
    frames.push({ position: new Vector3(up.x, Y + 110, up.z), target: exitTarget, fov: (52 + dest.fov) / 2, label: 'Çıkış' });
    frames.push(dest);
    return dedupe(frames);
  }
  // outside → outside: an arc lifted clear of the roof and tall buildings
  frames.push(liftFrame(ctx, from, dest));
  frames.push(dest);
  return dedupe(frames);
}

/** Mid-air arc point between two outside poses, raised until the route clears obstacles. */
function liftFrame(ctx: PlanContext, from: CameraPose, to: CameraPose): KeyFrame {
  const a = from.position;
  const b = to.position;
  const mid = a.clone().lerp(b, 0.5);
  const horiz = Math.hypot(b.x - a.x, b.z - a.z);
  let y = Math.max(a.y, b.y) + Math.min(140, 0.22 * horiz + 20);
  const clear = (yy: number) => {
    for (let i = 0; i <= 24; i++) {
      const k = i / 24;
      // quadratic Bézier through the lifted control point approximates the final curve
      const p = a.clone().multiplyScalar((1 - k) * (1 - k)).addScaledVector(new Vector3(mid.x, yy, mid.z), 2 * k * (1 - k)).addScaledVector(b, k * k);
      if (ctx.minHeight && p.y < ctx.minHeight(p.x, p.z)) return false;
      const o = ctx.layout.outer;
      const r = Math.pow(Math.abs(p.x) / (o.a + 10), o.p) + Math.pow(Math.abs(p.z) / (o.b + 10), o.p);
      if (r < 1 && p.y < Y + ROOF.innerTopY + 14) return false;
    }
    return true;
  };
  for (let k = 0; k < 20 && !clear(y); k++) y += 25;
  const target = from.target.clone().lerp(to.target, 0.5);
  return { position: new Vector3(mid.x, y, mid.z), target, fov: (from.fov + to.fov) / 2, label: 'Geçiş' };
}

export function nearestSeat(layout: StadiumLayout, p: Vector3): number {
  const S = layout.seats;
  let best = -1;
  let bd = 4; // metres (squared check below)
  for (let i = 0; i < S.count; i++) {
    const e = seatEye(layout, i);
    const d = (e.x - p.x) ** 2 + (e.y + Y - p.y) ** 2 + (e.z - p.z) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

function dedupe(frames: KeyFrame[]): KeyFrame[] {
  const out: KeyFrame[] = [];
  for (const f of frames) {
    const last = out[out.length - 1];
    if (last && last.position.distanceTo(f.position) < 0.05 && last.target.distanceTo(f.target) < 0.05 && Math.abs(last.fov - f.fov) < 0.1) {
      last.label = f.label;
      continue;
    }
    out.push(f);
  }
  return out;
}

// ------------------------------------------------------------------ playback

export interface FlightSegment {
  label: string;
  start: number; // seconds
  end: number;
}

const ARC_STEPS = 512;

export class Flight {
  readonly frames: KeyFrame[];
  readonly duration: number;
  readonly segments: FlightSegment[];
  private readonly pos: CatmullRomCurve3;
  private readonly tgt: CatmullRomCurve3;
  private readonly times: number[];
  private readonly slopes: { a: number; b: number }[];
  private readonly n: number;
  /** per clip: cumulative arc length at ARC_STEPS sub-steps of the curve parameter */
  private readonly arc: Float64Array[] = [];

  constructor(frames: KeyFrame[], speed = 1) {
    if (frames.length < 2) frames = [frames[0], { ...frames[0], label: frames[0].label }];
    this.frames = frames;
    this.n = frames.length;
    this.pos = new CatmullRomCurve3(frames.map((f) => f.position.clone()), false, 'centripetal');
    this.tgt = new CatmullRomCurve3(frames.map((f) => f.target.clone()), false, 'centripetal');
    const segs = this.n - 1;
    for (let i = 0; i < segs; i++) {
      const tab = new Float64Array(ARC_STEPS + 1);
      let prev = this.rawPoint(i, 0);
      for (let k = 1; k <= ARC_STEPS; k++) {
        const p = this.rawPoint(i, k / ARC_STEPS);
        tab[k] = tab[k - 1] + p.distanceTo(prev);
        prev = p;
      }
      this.arc.push(tab);
    }
    // per-clip duration from distance and turning angle
    const lens: number[] = [];
    const durs: number[] = [];
    for (let i = 0; i < segs; i++) {
      const len = this.segmentLength(i);
      const d0 = frames[i].target.clone().sub(frames[i].position).normalize();
      const d1 = frames[i + 1].target.clone().sub(frames[i + 1].position).normalize();
      const ang = (Math.acos(Math.max(-1, Math.min(1, d0.dot(d1)))) * 180) / Math.PI;
      const fovD = Math.abs(frames[i + 1].fov - frames[i].fov);
      let dur = Math.min(3.0, Math.max(0.65, 0.25 + Math.sqrt(len) * 0.135 + ang / 100 + fovD / 50));
      // drone speed limit: slower close to the ground and the stands
      const hLow = Math.max(0, Math.min(frames[i].position.y, frames[i + 1].position.y) - Y);
      const hAvg = Math.max(0, (frames[i].position.y + frames[i + 1].position.y) / 2 - Y);
      const vMax = 34 + 0.72 * hAvg;
      dur = Math.max(dur, (1.5 * len) / vMax);
      // the first and last clips start/stop at rest: quintic peak acceleration ≈ 5.77·len/dur²
      if (i === 0 || i === segs - 1) {
        const aMax = 40 + 0.6 * hLow;
        dur = Math.max(dur, Math.sqrt((5.77 * len) / aMax));
      }
      void hLow;
      dur /= speed;
      lens.push(Math.max(len, 0.01));
      durs.push(dur);
    }
    // acceleration budget per clip (m/s²), gentler close to the stands
    const aMax = durs.map((_, i) => 40 + 0.6 * Math.max(0, Math.min(frames[i].position.y, frames[i + 1].position.y) - Y));
    let slopes = this.solveSlopes(lens, durs);
    // stretch any clip whose quintic profile would brake or accelerate too hard
    for (let iter = 0; iter < 16; iter++) {
      let changed = false;
      for (let i = 0; i < segs; i++) {
        if (Flight.peakAccel(lens[i], durs[i], slopes[i].a, slopes[i].b) > aMax[i]) {
          durs[i] *= 1.1;
          changed = true;
        }
      }
      if (!changed) break;
      slopes = this.solveSlopes(lens, durs);
    }
    this.slopes = slopes;
    this.times = [0];
    for (const d of durs) this.times.push(this.times[this.times.length - 1] + d);
    this.duration = this.times[this.times.length - 1];
    this.segments = durs.map((_, i) => ({ label: frames[i + 1].label, start: this.times[i], end: this.times[i + 1] }));
  }

  /** Knot speeds (continuous across clips) → per-clip end slopes in weight/second. */
  private solveSlopes(lens: number[], durs: number[]): { a: number; b: number }[] {
    const segs = durs.length;
    // world speed at each key frame: 0 at the ends, else the slower neighbour's mean speed,
    // limited so the quintic stays monotone on both sides (end slope ≤ 1.8 × secant)
    const v: number[] = [0];
    for (let i = 1; i < segs; i++) {
      let vi = Math.min(lens[i - 1] / durs[i - 1], lens[i] / durs[i]) * 0.9;
      vi = Math.min(vi, (1.8 / durs[i - 1]) * this.speedAt(i - 1, 1), (1.8 / durs[i]) * this.speedAt(i, 0));
      v.push(vi);
    }
    v.push(0);
    return durs.map((d, i) => ({
      a: Math.min(v[i] / this.speedAt(i, 0), 1.8 / d),
      b: Math.min(v[i + 1] / this.speedAt(i, 1), 1.8 / d),
    }));
  }

  /** Peak |acceleration| (m/s²) of a quintic clip of length len over T seconds. */
  static peakAccel(len: number, T: number, a: number, b: number): number {
    const m0 = a * T;
    const m1 = b * T;
    let peak = 0;
    for (let k = 0; k <= 32; k++) {
      const s = k / 32;
      const h1 = -36 * s + 96 * s * s - 60 * s * s * s;
      const h4 = -24 * s + 84 * s * s - 60 * s * s * s;
      const h5 = 60 * s - 180 * s * s + 120 * s * s * s;
      peak = Math.max(peak, Math.abs((len * (h1 * m0 + h4 * m1 + h5)) / (T * T)));
    }
    return peak;
  }

  private segmentLength(i: number): number {
    return this.arc[i][ARC_STEPS];
  }

  private rawPoint(i: number, u: number, out = new Vector3()): Vector3 {
    return this.pos.getPoint(Math.min(1, (i + u) / (this.n - 1)), out);
  }

  /** Curve parameter (0..1 within clip i) at arc-length fraction w. */
  private paramAt(i: number, w: number): number {
    const tab = this.arc[i];
    const L = tab[ARC_STEPS];
    if (L < 1e-6) return w;
    const target = w * L;
    let lo = 0;
    let hi = ARC_STEPS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (tab[mid] <= target) lo = mid;
      else hi = mid;
    }
    const seg = tab[hi] - tab[lo] || 1;
    return (lo + (target - tab[lo]) / seg) / ARC_STEPS;
  }

  /** Clips are traversed at uniform arc length: |dP/dw| equals the clip length. */
  private speedAt(i: number, _w: number): number {
    return Math.max(this.arc[i][ARC_STEPS], 1e-4);
  }

  /** Segment index and weight (0..1) at time `time`. */
  private locate(time: number): { i: number; w: number } {
    const t = Math.max(0, Math.min(this.duration, time));
    let i = 0;
    while (i < this.n - 2 && t > this.times[i + 1]) i++;
    const T0 = this.times[i];
    const T1 = this.times[i + 1];
    const h = T1 - T0;
    const s = h > 0 ? (t - T0) / h : 1;
    const { a, b } = this.slopes[i];
    // quintic Hermite from 0 to 1: end velocities a·h and b·h (in s units),
    // zero acceleration at both ends → speed is continuous and so is acceleration
    const s2 = s * s;
    const s3 = s2 * s;
    const s4 = s3 * s;
    const s5 = s4 * s;
    const h1 = s - 6 * s3 + 8 * s4 - 3 * s5;
    const h4 = -4 * s3 + 7 * s4 - 3 * s5;
    const h5 = 10 * s3 - 15 * s4 + 6 * s5;
    const w = h1 * a * h + h4 * b * h + h5;
    return { i, w: Math.max(0, Math.min(1, w)) };
  }

  poseAt(time: number, out: CameraPose): CameraPose {
    const { i, w } = this.locate(time);
    const t = Math.min(1, (i + this.paramAt(i, w)) / (this.n - 1));
    this.pos.getPoint(t, out.position);
    this.tgt.getPoint(t, out.target);
    const f0 = this.frames[i].fov;
    const f1 = this.frames[i + 1].fov;
    const k = w * w * (3 - 2 * w);
    out.fov = f0 + (f1 - f0) * k;
    return out;
  }

  segmentAt(time: number): FlightSegment {
    for (const s of this.segments) if (time <= s.end) return s;
    return this.segments[this.segments.length - 1];
  }
}
