/**
 * Seat map generator — pure data, no Three.js.
 *
 * Produces every block (tribün bloğu), row (sıra) and seat (koltuk) with its
 * exact 3D position. The same data drives the concrete geometry, the seat
 * instances, the picking/mask passes, the camera targets and the ticket, so a
 * seat can never be in one place on screen and another place in the data.
 */
import {
  CATEGORIES,
  FRONT_CURVE,
  LOWER,
  LOWER_SECTORS,
  OUTER_CURVE,
  SECTOR_START_ANGLE,
  SUITES,
  UPPER,
  UPPER_SECTORS,
  standForAngle,
  type SectorDef,
  type StandId,
  type TierProfile,
} from './config.ts';
import { Superellipse, TAU, type Vec2 } from './shape.ts';

export type Tier = 'lower' | 'upper' | 'suite';

export interface RowProfile {
  /** riser line distance from the front curve */
  d: number;
  /** tread elevation above pitch */
  y: number;
}

export interface Vomitory {
  /** lateral span in metres along the row, measured from the block's t0 side at the tier front */
  rowFrom: number;
  rowTo: number; // inclusive
  /** centre of the opening as a lateral fraction of the block (0..1, t0 → t1) */
  u: number;
  width: number;
}

export interface Block {
  index: number;
  tier: Tier;
  code: string;
  label: string;
  kind: SectorDef['kind'] | 'suite';
  stand: StandId;
  /** curve parameter range (t1 may exceed 2π when the block wraps) */
  t0: number;
  t1: number;
  tc: number;
  rows: number;
  vomitories: Vomitory[];
  seatStart: number;
  seatCount: number;
  /** seat index (absolute) where each row starts; length rows + 1 */
  rowStart: number[];
  /** centre of the seats and bounding radius */
  center: [number, number, number];
  radius: number;
  category: number;
}

export interface SeatTable {
  count: number;
  pos: Float32Array; // x, y (floor of the tread), z
  yaw: Float32Array; // rotation about Y so local +Z faces the pitch
  block: Uint16Array;
  row: Uint8Array; // 1-based
  num: Uint16Array; // 1-based, left → right for the spectator
  shade: Uint8Array; // 0 white, 1 black, 2 VIP leather
  sold: Uint8Array; // 0 free, 1 sold, 2 not for sale (press)
  category: Uint8Array;
}

export interface StadiumLayout {
  front: Superellipse;
  outer: Superellipse;
  lowerProfile: RowProfile[];
  upperProfile: RowProfile[];
  blocks: Block[];
  seats: SeatTable;
  suiteBlocks: number[];
  totals: { lower: number; upper: number; suites: number; vip: number; press: number; all: number };
}

// ------------------------------------------------------------------ helpers

/** Deterministic hash → [0,1). */
export function hash3(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function smoothNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash3(xi, yi, seed);
  const b = hash3(xi + 1, yi, seed);
  const c = hash3(xi, yi + 1, seed);
  const d = hash3(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export function tierProfile(p: TierProfile): RowProfile[] {
  const rows: RowProfile[] = [];
  let y = p.firstRowY;
  for (let r = 0; r <= p.maxRows; r++) {
    rows.push({ d: p.firstRowD + r * p.tread, y });
    const k = p.maxRows > 1 ? Math.min(1, r / (p.maxRows - 1)) : 0;
    const rake = ((p.rakeFront + (p.rakeBack - p.rakeFront) * k) * Math.PI) / 180;
    y += p.tread * Math.tan(rake);
  }
  return rows; // maxRows + 1 entries: the last one is the back edge of the tier
}

/** Arc-length parametrisation of an offset of the front curve. */
export class OffsetArc {
  readonly length: number;
  private readonly cum: Float64Array;
  private readonly n: number;
  readonly base: Superellipse;
  readonly d: number;
  constructor(base: Superellipse, d: number, n = 4096) {
    this.base = base;
    this.d = d;
    this.n = n;
    this.cum = new Float64Array(n + 1);
    let prev = base.offset(0, d);
    let acc = 0;
    for (let i = 1; i <= n; i++) {
      const q = base.offset((i / n) * TAU, d);
      acc += Math.hypot(q.x - prev.x, q.z - prev.z);
      this.cum[i] = acc;
      prev = q;
    }
    this.length = acc;
  }
  arcAt(t: number): number {
    let tt = t % TAU;
    if (tt < 0) tt += TAU;
    const f = (tt / TAU) * this.n;
    const i = Math.floor(f);
    return this.cum[i] + (this.cum[Math.min(i + 1, this.n)] - this.cum[i]) * (f - i);
  }
  tAt(s: number): number {
    const turns = Math.floor(s / this.length);
    let ss = s - turns * this.length;
    let lo = 0;
    let hi = this.n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= ss) lo = mid;
      else hi = mid;
    }
    const seg = this.cum[hi] - this.cum[lo] || 1;
    return turns * TAU + ((lo + (ss - this.cum[lo]) / seg) / this.n) * TAU;
  }
}

/** Monotonic arc position on the base curve for any t (adds whole turns). */
function arcAbs(c: Superellipse, t: number): number {
  return Math.floor(t / TAU) * c.length + c.arcAt(t);
}

/** Lateral sampler: positions along the offset curve between t0 and t1 (t1 > t0). */
export function sampleSpan(front: Superellipse, t0: number, t1: number, d: number, n = 48) {
  const pts: Vec2[] = [];
  const ts: number[] = [];
  const cum: number[] = [0];
  const s0 = arcAbs(front, t0);
  const s1 = arcAbs(front, t1);
  for (let i = 0; i <= n; i++) {
    // uniform in base arc length → samples follow the curve, not the angle
    const s = s0 + ((s1 - s0) * i) / n;
    const t = i === 0 ? t0 : i === n ? t1 : front.tAt(s) + Math.floor(s / front.length) * TAU;
    ts.push(t);
    pts.push(front.offset(t, d));
    if (i > 0) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  }
  const length = cum[n];
  const tAtS = (s: number) => {
    if (s <= 0) return ts[0];
    if (s >= length) return ts[n];
    let i = 1;
    while (cum[i] < s) i++;
    const k = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return ts[i - 1] + (ts[i] - ts[i - 1]) * k;
  };
  return { length, tAtS };
}

/** Distance along the outward normal from front(t) to the outer facade curve. */
export function facadeDistance(front: Superellipse, outer: Superellipse, t: number): number {
  const p = front.point(t);
  const n = front.normal(t);
  const f = (d: number) => {
    const x = p.x + n.x * d;
    const z = p.z + n.z * d;
    return Math.pow(Math.abs(x) / outer.a, outer.p) + Math.pow(Math.abs(z) / outer.b, outer.p) - 1;
  };
  let lo = 0;
  let hi = 120;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * 0 at the corners of the front curve, 1 at the middle of each side/end.
 * Uses the superellipse "squareness" angle so the corner lands on the diagonal
 * of the rounded rectangle, not at 45° plan angle.
 */
export function waveAt(front: Superellipse, t: number): number {
  const q = front.point(t);
  const psi = Math.atan2(Math.abs(q.z) / front.b, Math.abs(q.x) / front.a);
  return Math.pow((1 + Math.cos(4 * psi)) / 2, 0.8);
}

export const UPPER_BACK_CLEARANCE = 1.9;
/** seat-pan centre behind the front edge (riser line) of its tread */
export const SEAT_SETBACK = 0.46;

export function upperRowsAt(front: Superellipse, outer: Superellipse, p: TierProfile, t: number): number {
  const wave = waveAt(front, t);
  const target = Math.round(p.minRows + (p.maxRows - p.minRows) * wave);
  const clear = facadeDistance(front, outer, t);
  const fit = Math.floor((clear - UPPER_BACK_CLEARANCE - p.firstRowD) / p.tread);
  return Math.max(Math.min(p.minRows, fit), Math.min(target, fit));
}

// ------------------------------------------------------------------ main

export function buildLayout(): StadiumLayout {
  const front = new Superellipse(FRONT_CURVE.a, FRONT_CURVE.b, FRONT_CURVE.p);
  const outer = new Superellipse(OUTER_CURVE.a, OUTER_CURVE.b, OUTER_CURVE.p);
  const lowerProfile = tierProfile(LOWER);
  const upperProfile = tierProfile(UPPER);

  // growable seat buffers
  let cap = 50000;
  let pos = new Float32Array(cap * 3);
  let yaw = new Float32Array(cap);
  let blockA = new Uint16Array(cap);
  let rowA = new Uint8Array(cap);
  let numA = new Uint16Array(cap);
  let shade = new Uint8Array(cap);
  let sold = new Uint8Array(cap);
  let cat = new Uint8Array(cap);
  let count = 0;
  const grow = () => {
    cap *= 2;
    const g = <T extends Float32Array | Uint16Array | Uint8Array>(a: T, k = 1): T => {
      const b = new (a.constructor as { new (n: number): T })(cap * k);
      b.set(a);
      return b;
    };
    pos = g(pos, 3);
    yaw = g(yaw);
    blockA = g(blockA);
    rowA = g(rowA);
    numA = g(numA);
    shade = g(shade);
    sold = g(sold);
    cat = g(cat);
  };

  const blocks: Block[] = [];
  const suiteBlocks: number[] = [];

  const pushSeat = (b: Block, x: number, y: number, z: number, faceYaw: number, row: number, num: number, sh: number, st: number) => {
    if (count >= cap) grow();
    pos[count * 3] = x;
    pos[count * 3 + 1] = y;
    pos[count * 3 + 2] = z;
    yaw[count] = faceYaw;
    blockA[count] = b.index;
    rowA[count] = row;
    numA[count] = num;
    shade[count] = sh;
    sold[count] = st;
    cat[count] = b.category;
    count++;
  };

  const categoryFor = (tier: Tier, def: SectorDef, stand: StandId, tc: number): number => {
    if (def.kind === 'vip') return 1;
    if (def.kind === 'press') return 7;
    if (def.kind === 'away') return 6;
    if (stand === 'GUNEY' || stand === 'KUZEY') return 5;
    // how central on the long side (0 = centre)
    const sideCentre = stand === 'BATI' ? Math.PI / 2 : (3 * Math.PI) / 2;
    let off = Math.abs(((tc - sideCentre + 3 * Math.PI) % TAU) - Math.PI);
    off = off / (Math.PI / 2);
    if (tier === 'lower') return off < 0.42 ? 2 : 3;
    return off < 0.42 ? 3 : 4;
  };

  const soldFor = (blockIdx: number, row: number, seat: number, kind: string): number => {
    if (kind === 'press') return 2;
    const base = kind === 'away' ? 0.25 : kind === 'vip' ? 0.55 : 0.5;
    const n = smoothNoise(seat / 7.5 + blockIdx * 13.1, row / 3.2, 7);
    const fine = hash3(blockIdx, row, seat);
    return n * 0.75 + fine * 0.35 > 0.95 - base * 0.75 ? 1 : 0;
  };

  const shadeFor = (tier: Tier, kind: string, blockIdx: number, row: number, seat: number): number => {
    if (kind === 'vip' || kind === 'press') return 2;
    const n = smoothNoise(seat / 4.0 + blockIdx * 31.7, row / 2.5, 3);
    const h = hash3(blockIdx * 7 + 1, row, seat);
    const v = h * 0.7 + n * 0.3;
    // lower tier: mostly white with black scattered; upper: mostly black with white
    if (tier === 'lower') return v < 0.27 ? 1 : 0;
    return v < 0.74 ? 1 : 0;
  };

  // --------------------------------------------------------- tiers
  const buildTier = (tier: 'lower' | 'upper', p: TierProfile, prof: RowProfile[], defs: SectorDef[]) => {
    const refD = p.firstRowD + (p.maxRows * p.tread) / 2;
    const arc = new OffsetArc(front, refD);
    const total = defs.reduce((s, d) => s + d.weight, 0);
    const sStart = arc.arcAt(SECTOR_START_ANGLE);
    let acc = 0;
    for (const def of defs) {
      const sa = sStart + (acc / total) * arc.length;
      acc += def.weight;
      const sb = sStart + (acc / total) * arc.length;
      let t0 = arc.tAt(sa);
      let t1 = arc.tAt(sb);
      if (t1 < t0) t1 += TAU;
      const tc = (t0 + t1) / 2;
      const stand = standForAngle(tc % TAU);

      // rows: lower tier is constant; the upper tier is the "wave" — highest at the
      // middle of each side and end, lowest at the corners — capped by the facade
      let rows = p.maxRows;
      if (tier === 'upper') {
        rows = upperRowsAt(front, outer, p, tc);
        for (const t of [t0, t1]) rows = Math.min(rows, upperRowsAt(front, outer, p, t) + 1);
        if (stand === 'DOGU') rows = Math.max(15, rows - 3); // kept low for the Bosphorus silhouette
      }

      const vomitories: Vomitory[] = [];
      if (def.kind !== 'press') {
        const nv = Math.max(1, Math.round(def.weight));
        for (let k = 0; k < nv; k++) {
          vomitories.push(
            tier === 'lower'
              ? { rowFrom: 9, rowTo: 14, u: (k + 0.5) / nv, width: 3.2 }
              : { rowFrom: 6, rowTo: 9, u: (k + 0.5) / nv, width: 3.0 },
          );
        }
      }

      const block: Block = {
        index: blocks.length,
        tier,
        code: def.code,
        label: def.kind === 'press' ? 'Basın Tribünü' : def.kind === 'vip' ? 'VIP Tribün' : `Blok ${def.code}`,
        kind: def.kind,
        stand,
        t0,
        t1,
        tc,
        rows,
        vomitories,
        seatStart: count,
        seatCount: 0,
        rowStart: [],
        center: [0, 0, 0],
        radius: 0,
        category: categoryFor(tier, def, stand, tc % TAU),
      };
      blocks.push(block);

      const pitch = def.kind === 'vip' ? 0.58 : p.seatPitch;
      for (let r = 0; r < rows; r++) {
        block.rowStart.push(count);
        const dSeat = prof[r].d + SEAT_SETBACK;
        const span = sampleSpan(front, t0, t1, dSeat);
        const avail = span.length - p.aisle;
        const n = Math.floor(avail / pitch);
        const pad = p.aisle / 2 + (avail - n * pitch) / 2;
        // vomitory exclusion zones in metres along this row
        const holes: [number, number][] = [];
        for (const v of vomitories) {
          if (r >= v.rowFrom && r <= v.rowTo) {
            const c = v.u * span.length;
            holes.push([c - v.width / 2 - 0.3, c + v.width / 2 + 0.3]);
          }
        }
        // create seats from the t1 end so that number 1 is on the spectator's left
        const rowSeats: { s: number }[] = [];
        for (let i = 0; i < n; i++) {
          const s = pad + pitch * (i + 0.5);
          if (holes.some(([a, b]) => s > a && s < b)) continue;
          rowSeats.push({ s });
        }
        rowSeats.reverse();
        rowSeats.forEach(({ s }, k) => {
          const t = span.tAtS(s);
          const q = front.offset(t, dSeat);
          const nn = front.normal(t);
          const num = k + 1;
          pushSeat(
            block,
            q.x,
            prof[r].y,
            q.z,
            Math.atan2(-nn.x, -nn.z),
            r + 1,
            num,
            shadeFor(tier, def.kind, block.index, r, num),
            soldFor(block.index, r, num, def.kind),
          );
        });
      }
      block.rowStart.push(count);
      block.seatCount = count - block.seatStart;
    }
  };

  buildTier('lower', LOWER, lowerProfile, LOWER_SECTORS);
  buildTier('upper', UPPER, upperProfile, UPPER_SECTORS);

  // --------------------------------------------------------- suites (loca)
  {
    const arc = new OffsetArc(front, SUITES.glassD);
    const sStart = arc.arcAt(SECTOR_START_ANGLE);
    for (let i = 0; i < SUITES.count; i++) {
      const sa = sStart + (i / SUITES.count) * arc.length;
      const sb = sStart + ((i + 1) / SUITES.count) * arc.length;
      let t0 = arc.tAt(sa);
      let t1 = arc.tAt(sb);
      if (t1 < t0) t1 += TAU;
      const tc = (t0 + t1) / 2;
      const stand = standForAngle(tc % TAU);
      const block: Block = {
        index: blocks.length,
        tier: 'suite',
        code: `L${String(i + 1).padStart(3, '0')}`,
        label: `Loca ${i + 1}`,
        kind: 'suite',
        stand,
        t0,
        t1,
        tc,
        rows: SUITES.balconyRows,
        vomitories: [],
        seatStart: count,
        seatCount: 0,
        rowStart: [],
        center: [0, 0, 0],
        radius: 0,
        category: 0,
      };
      blocks.push(block);
      suiteBlocks.push(block.index);
      const suiteSold = hash3(i, 99, 5) < 0.62 ? 1 : 0; // suites are sold as a whole box
      for (let r = 0; r < SUITES.balconyRows; r++) {
        block.rowStart.push(count);
        const dSeat = SUITES.frontD + r * 0.85 + SEAT_SETBACK;
        const span = sampleSpan(front, t0, t1, dSeat, 16);
        const n = SUITES.seatsPerRow;
        const pad = (span.length - n * SUITES.seatPitch) / 2;
        for (let k = 0; k < n; k++) {
          const s = pad + SUITES.seatPitch * (n - k - 0.5);
          const t = span.tAtS(s);
          const q = front.offset(t, dSeat);
          const nn = front.normal(t);
          pushSeat(block, q.x, SUITES.floorY + r * 0.38, q.z, Math.atan2(-nn.x, -nn.z), r + 1, k + 1, 2, suiteSold);
        }
      }
      block.rowStart.push(count);
      block.seatCount = count - block.seatStart;
    }
  }

  // --------------------------------------------------------- bounds
  for (const b of blocks) {
    let cx = 0,
      cy = 0,
      cz = 0;
    const n = Math.max(1, b.seatCount);
    for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
      cx += pos[i * 3];
      cy += pos[i * 3 + 1];
      cz += pos[i * 3 + 2];
    }
    cx /= n;
    cy /= n;
    cz /= n;
    let r = 0;
    for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
      r = Math.max(r, Math.hypot(pos[i * 3] - cx, pos[i * 3 + 1] - cy, pos[i * 3 + 2] - cz));
    }
    b.center = [cx, cy, cz];
    b.radius = r + 1.2;
  }

  const seats: SeatTable = {
    count,
    pos: pos.slice(0, count * 3),
    yaw: yaw.slice(0, count),
    block: blockA.slice(0, count),
    row: rowA.slice(0, count),
    num: numA.slice(0, count),
    shade: shade.slice(0, count),
    sold: sold.slice(0, count),
    category: cat.slice(0, count),
  };

  const sum = (f: (b: Block) => boolean) => blocks.filter(f).reduce((s, b) => s + b.seatCount, 0);
  const totals = {
    lower: sum((b) => b.tier === 'lower'),
    upper: sum((b) => b.tier === 'upper'),
    suites: sum((b) => b.tier === 'suite'),
    vip: sum((b) => b.kind === 'vip'),
    press: sum((b) => b.kind === 'press'),
    all: count,
  };

  return { front, outer, lowerProfile, upperProfile, blocks, seats, suiteBlocks, totals };
}

export function seatPrice(category: number): number {
  return CATEGORIES[category]?.price ?? 0;
}

/** World-space eye position for a seated spectator (pitch-level frame). */
export function seatEye(layout: StadiumLayout, i: number): { x: number; y: number; z: number; yaw: number } {
  const s = layout.seats;
  const yw = s.yaw[i];
  // eye ~1.18 m above the tread, ~0.12 m behind the seat-pan centre
  return {
    x: s.pos[i * 3] - Math.sin(yw) * 0.12,
    y: s.pos[i * 3 + 1] + 1.18,
    z: s.pos[i * 3 + 2] - Math.cos(yw) * 0.12,
    yaw: yw,
  };
}
