/**
 * Seats as instanced meshes: one pair (detailed / simple) per block, sharing
 * the same instance matrices and colours. LOD is picked per block from the
 * camera distance every frame; frustum culling works per block.
 */
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type Camera,
  type Material,
} from 'three';
import { SEAT_COLORS } from './config.ts';
import type { StadiumLayout } from './layout.ts';
import type { StadiumMaterials } from './materials.ts';

/** Box helper writing non-indexed triangles with flat normals. */
function pushBox(
  pos: number[],
  nor: number[],
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  tilt = 0,
  faces = 0b111111,
): void {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  const c = Math.cos(tilt), s = Math.sin(tilt);
  // rotate about X by tilt around the box centre (positive tilt leans the top backwards, −Z)
  const tr = (x: number, y: number, z: number): [number, number, number] => [cx + x, cy + y * c + z * s, cz - y * s + z * c];
  const tn = (x: number, y: number, z: number): [number, number, number] => [x, y * c + z * s, -y * s + z * c];
  const quad = (a: number[], b: number[], cc: number[], d: number[], n: number[]) => {
    for (const p of [a, b, cc, a, cc, d]) pos.push(p[0], p[1], p[2]);
    for (let i = 0; i < 6; i++) nor.push(n[0], n[1], n[2]);
  };
  const v = (x: number, y: number, z: number) => tr(x, y, z);
  if (faces & 1) quad(v(-hx, hy, hz), v(hx, hy, hz), v(hx, hy, -hz), v(-hx, hy, -hz), tn(0, 1, 0)); // top
  if (faces & 2) quad(v(-hx, -hy, -hz), v(hx, -hy, -hz), v(hx, -hy, hz), v(-hx, -hy, hz), tn(0, -1, 0)); // bottom
  if (faces & 4) quad(v(-hx, -hy, hz), v(hx, -hy, hz), v(hx, hy, hz), v(-hx, hy, hz), tn(0, 0, 1)); // front (+Z)
  if (faces & 8) quad(v(hx, -hy, -hz), v(-hx, -hy, -hz), v(-hx, hy, -hz), v(hx, hy, -hz), tn(0, 0, -1)); // back
  if (faces & 16) quad(v(hx, -hy, hz), v(hx, -hy, -hz), v(hx, hy, -hz), v(hx, hy, hz), tn(1, 0, 0)); // right
  if (faces & 32) quad(v(-hx, -hy, -hz), v(-hx, -hy, hz), v(-hx, hy, hz), v(-hx, hy, -hz), tn(-1, 0, 0)); // left
}

function geometry(pos: number[], nor: number[]): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
}

/** Detailed moulded seat (~34 triangles, ~46 for VIP). Local +Z faces the pitch. */
export function seatGeometryDetailed(vip = false): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const w = vip ? 0.5 : 0.44;
  // faces: 1 top, 2 bottom, 4 front, 8 back, 16 right, 32 left — the bottoms and
  // inner sides are never seen from a spectator's height, so they are skipped
  // seat pan, slightly raised at the front edge
  pushBox(pos, nor, 0, 0.42, 0.02, w, 0.05, 0.38, 0.06, 0b110101);
  // front lip
  pushBox(pos, nor, 0, 0.405, 0.2, w * 0.96, 0.05, 0.04, 0, 0b000101);
  // backrest in three panels forming a shallow bucket
  const backY = vip ? 0.7 : 0.66;
  const backH = vip ? 0.5 : 0.42;
  pushBox(pos, nor, 0, backY, -0.19, w * 0.62, backH, 0.04, 0.2, 0b001101);
  const side = w * 0.2;
  for (const sx of [-1, 1]) {
    const x = sx * (w * 0.31 + side / 2 - 0.01);
    pushBox(pos, nor, x, backY, -0.17, side, backH * 0.96, 0.04, 0.2, sx > 0 ? 0b011101 : 0b101101);
  }
  // pedestal (front face only)
  pushBox(pos, nor, 0, 0.2, -0.02, 0.07, 0.36, 0.07, 0, 0b000100);
  if (vip) {
    // armrests
    for (const sx of [-1, 1]) pushBox(pos, nor, sx * (w / 2 + 0.02), 0.6, -0.02, 0.04, 0.04, 0.34, 0, 0b110101);
  }
  return geometry(pos, nor);
}

/** Simple seat for distance (~20 triangles). */
export function seatGeometrySimple(): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  pushBox(pos, nor, 0, 0.42, 0.02, 0.44, 0.05, 0.38, 0.06, 0b000101);
  pushBox(pos, nor, 0, 0.66, -0.19, 0.44, 0.42, 0.045, 0.2, 0b001101);
  return geometry(pos, nor);
}

/** Very far seats: just the backrest as one quad (2 triangles). */
export function seatGeometryFar(): BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  pushBox(pos, nor, 0, 0.6, -0.17, 0.46, 0.56, 0.04, 0.2, 0b000100);
  return geometry(pos, nor);
}

export interface SeatMeshPair {
  seatStart: number;
  count: number;
  blocks: number[];
  detailed: InstancedMesh;
  simple: InstancedMesh;
  far: InstancedMesh;
  centre: Vector3;
  radius: number;
}

export type SeatVisualState = 'normal' | 'hover' | 'selected' | 'dim';

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3(1, 1, 1);
const _up = new Vector3(0, 1, 0);
const _c = new Color();

export class SeatSystem {
  readonly group = new Group();
  readonly pairs: SeatMeshPair[] = [];
  /** seat index → pair index */
  readonly pairOf: Uint16Array;
  availabilityMode = false;
  private readonly layout: StadiumLayout;
  private readonly overrides = new Map<number, SeatVisualState>();
  private readonly white = new Color(SEAT_COLORS.white);
  private readonly black = new Color(SEAT_COLORS.black);
  private readonly vip = new Color(SEAT_COLORS.vip);
  private readonly sold = new Color(SEAT_COLORS.sold);
  private readonly hover = new Color(0xffb15c);
  private readonly selected = new Color(0xff7a1a);
  detailDistance = 70;
  /** beyond this the backrest-only LOD is used (seats are a few pixels wide) */
  farDistance = 150;

  constructor(layout: StadiumLayout, mats: StadiumMaterials) {
    this.layout = layout;
    this.group.name = 'seats';
    this.pairOf = new Uint16Array(layout.seats.count);
    const gDet = seatGeometryDetailed(false);
    const gVip = seatGeometryDetailed(true);
    const gSim = seatGeometrySimple();
    const gFar = seatGeometryFar();

    // groups: every tier block on its own, suites in runs of 12
    const groups: number[][] = [];
    for (const b of layout.blocks) if (b.tier !== 'suite') groups.push([b.index]);
    for (let i = 0; i < layout.suiteBlocks.length; i += 12) groups.push(layout.suiteBlocks.slice(i, i + 12));

    for (const blockIdxs of groups) {
      const first = layout.blocks[blockIdxs[0]];
      const last = layout.blocks[blockIdxs[blockIdxs.length - 1]];
      const start = first.seatStart;
      const count = last.seatStart + last.seatCount - start;
      if (count === 0) continue;
      const vipLike = first.kind === 'vip' || first.kind === 'suite' || first.kind === 'press';
      const detailed = new InstancedMesh(vipLike ? gVip : gDet, mats.seatDetail as Material, count);
      const simple = new InstancedMesh(gSim, mats.seat as Material, count);
      const far = new InstancedMesh(gFar, mats.seat as Material, count);
      const matrices = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
      const colors = new InstancedBufferAttribute(new Float32Array(count * 3), 3);
      detailed.instanceMatrix = matrices;
      simple.instanceMatrix = matrices;
      far.instanceMatrix = matrices;
      detailed.instanceColor = colors;
      simple.instanceColor = colors;
      far.instanceColor = colors;
      const S = layout.seats;
      for (let k = 0; k < count; k++) {
        const i = start + k;
        _p.set(S.pos[i * 3], S.pos[i * 3 + 1], S.pos[i * 3 + 2]);
        _q.setFromAxisAngle(_up, S.yaw[i]);
        _m.compose(_p, _q, _s);
        _m.toArray(matrices.array, k * 16);
        this.pairOf[i] = this.pairs.length;
      }
      detailed.computeBoundingSphere();
      simple.boundingSphere = detailed.boundingSphere!.clone();
      far.boundingSphere = detailed.boundingSphere!.clone();
      far.castShadow = false;
      far.receiveShadow = true;
      far.visible = false;
      far.name = `seats-${first.code}-far`;
      detailed.castShadow = true;
      detailed.receiveShadow = true;
      simple.castShadow = false;
      simple.receiveShadow = true;
      detailed.name = `seats-${first.code}-det`;
      simple.name = `seats-${first.code}-sim`;
      detailed.visible = false;
      const pair: SeatMeshPair = {
        seatStart: start,
        count,
        blocks: blockIdxs,
        detailed,
        simple,
        far,
        centre: detailed.boundingSphere!.center.clone(),
        radius: detailed.boundingSphere!.radius,
      };
      detailed.userData.pair = this.pairs.length;
      simple.userData.pair = this.pairs.length;
      far.userData.pair = this.pairs.length;
      this.pairs.push(pair);
      this.group.add(detailed, simple, far);
    }
    this.refreshAllColors();
  }

  /**
   * Blocks drawn with one neutral (white) albedo while they are highlighted, so
   * the compositing pass can re-light them in orange exactly: with the mixed
   * black/white pattern the specular part of a black seat dominates its tiny
   * albedo and the black seats came out far brighter than the white ones.
   */
  private readonly neutral = new Set<number>();

  setNeutralBlocks(blocks: Iterable<number>): void {
    const next = new Set<number>();
    for (const b of blocks) if (b >= 0) next.add(b);
    const changed: number[] = [];
    for (const b of this.neutral) if (!next.has(b)) changed.push(b);
    for (const b of next) if (!this.neutral.has(b)) changed.push(b);
    if (!changed.length) return;
    this.neutral.clear();
    for (const b of next) this.neutral.add(b);
    for (const b of changed) {
      const blk = this.layout.blocks[b];
      if (!blk) continue;
      for (let i = blk.seatStart; i < blk.seatStart + blk.seatCount; i++) this.writeColor(i);
    }
  }

  baseColor(i: number, out: Color): Color {
    const S = this.layout.seats;
    if (this.availabilityMode && S.sold[i] !== 0) return out.copy(this.sold);
    if (this.neutral.has(S.block[i])) return out.copy(this.white);
    const sh = S.shade[i];
    return out.copy(sh === 0 ? this.white : sh === 1 ? this.black : this.vip);
  }

  private writeColor(i: number): void {
    const pair = this.pairs[this.pairOf[i]];
    const k = i - pair.seatStart;
    const st = this.overrides.get(i);
    if (st === 'hover') _c.copy(this.hover);
    else if (st === 'selected') _c.copy(this.selected);
    else this.baseColor(i, _c);
    if (st === 'dim') _c.multiplyScalar(0.35);
    const arr = pair.detailed.instanceColor!.array as Float32Array;
    arr[k * 3] = _c.r;
    arr[k * 3 + 1] = _c.g;
    arr[k * 3 + 2] = _c.b;
    pair.detailed.instanceColor!.needsUpdate = true;
  }

  refreshAllColors(): void {
    for (let i = 0; i < this.layout.seats.count; i++) this.writeColor(i);
  }

  setAvailabilityMode(on: boolean): void {
    if (this.availabilityMode === on) return;
    this.availabilityMode = on;
    this.refreshAllColors();
  }

  setState(i: number, st: SeatVisualState): void {
    if (st === 'normal') this.overrides.delete(i);
    else this.overrides.set(i, st);
    this.writeColor(i);
  }

  clearState(st: SeatVisualState): void {
    for (const [i, s] of Array.from(this.overrides)) {
      if (s === st) {
        this.overrides.delete(i);
        this.writeColor(i);
      }
    }
  }

  /** Per-frame LOD: detailed mesh only for blocks near the camera. */
  update(camera: Camera): void {
    const cam = camera.position;
    for (const p of this.pairs) {
      const d = cam.distanceTo(p.centre) - p.radius;
      const near = d < this.detailDistance;
      const far = d > this.farDistance;
      p.detailed.visible = near;
      // seat-on-concrete shadows only read up close: limit casters to the nearest blocks
      p.detailed.castShadow = d < 12;
      p.simple.visible = !near && !far;
      p.far.visible = far;
    }
  }

  /** Optional: force the detailed mesh everywhere (e.g. still renders). */
  forceDetail(on: boolean): void {
    for (const p of this.pairs) {
      p.detailed.visible = on;
      p.simple.visible = !on;
      p.far.visible = false;
    }
  }
}
