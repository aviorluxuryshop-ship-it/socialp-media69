/**
 * The concrete bowl: stepped terraces block by block (with aisles, vomitories,
 * parapets), the suite ring between the tiers, the upper-tier fascia with its
 * LED ribbon, the soffit under the upper tier and the pitch-level run-off.
 *
 * All geometry is derived from the same layout as the seats, so every seat
 * sits exactly on its tread.
 */
import { DoubleSide, Group, Mesh, MeshStandardMaterial, Shape, ShapeGeometry, Path, BufferGeometry, BufferAttribute } from 'three';
import { GeoBuilder } from '../core/geo.ts';
import { FASCIA, LOWER, PITCH, SUITES, UPPER, type TierProfile } from './config.ts';
import { sampleSpan, type Block, type RowProfile, type StadiumLayout } from './layout.ts';
import type { StadiumMaterials } from './materials.ts';
import type { Superellipse } from './shape.ts';

type V3 = [number, number, number];

// seating decks read dark in every photo (seat shadow + darker sealed concrete)
const C_CONCRETE = 0.62;
const C_RISER = 0.5;
const C_AISLE = 0.92;
const NOSING: V3 = [1.25, 1.05, 0.45];
const C_VOM = 0.12;
const C_PARAPET = 0.96;

function P(front: Superellipse, t: number, d: number, y: number): V3 {
  const q = front.offset(t, d);
  return [q.x, y, q.z];
}

const UP: V3 = [0, 1, 0];
const DOWN: V3 = [0, -1, 0];
/** horizontal direction towards the pitch centre from point p */
const IN = (p: V3): V3 => [-p[0], 0, -p[2]];
/** horizontal direction away from the pitch centre */
const OUT = (p: V3): V3 => [p[0], 0, p[2]];
const SUB = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

interface Lateral {
  /** curve parameter at fraction u for the given offset distance */
  tAt: (u: number) => number;
  length: number;
}

function lateral(front: Superellipse, b: { t0: number; t1: number }, d: number): Lateral {
  const s = sampleSpan(front, b.t0, b.t1, d, 40);
  return { tAt: (u) => s.tAtS(u * s.length), length: s.length };
}

/** Sorted unique u stops between u0 and u1 with at most `step` metres between them. */
function stops(u0: number, u1: number, len: number, step: number, extra: number[] = []): number[] {
  const n = Math.max(1, Math.ceil(((u1 - u0) * len) / step));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(u0 + ((u1 - u0) * i) / n);
  for (const e of extra) if (e > u0 && e < u1) out.push(e);
  return Array.from(new Set(out.map((v) => Math.round(v * 1e6) / 1e6))).sort((a, b) => a - b);
}

export interface BowlMeshes {
  group: Group;
  /** meshes carrying a per-vertex blockId attribute (used by the mask pass) */
  blockMeshes: Mesh[];
}

export function buildBowl(layout: StadiumLayout, mats: StadiumMaterials): BowlMeshes {
  const front = layout.front;
  const group = new Group();
  group.name = 'bowl';
  const blockMeshes: Mesh[] = [];

  const tiers: { tier: 'lower' | 'upper'; prof: RowProfile[]; p: TierProfile }[] = [
    { tier: 'lower', prof: layout.lowerProfile, p: LOWER },
    { tier: 'upper', prof: layout.upperProfile, p: UPPER },
  ];

  for (const { tier, prof, p } of tiers) {
    const g = new GeoBuilder();
    g.uvScale = 3;
    const blocks = layout.blocks.filter((b) => b.tier === tier);
    blocks.forEach((b, bi) => {
      const prev = blocks[(bi - 1 + blocks.length) % blocks.length];
      const next = blocks[(bi + 1) % blocks.length];
      g.blockId = b.index + 1; // 0 = no block
      buildBlockTerrace(g, front, b, prof, p, tier, prev.rows, next.rows);
    });
    const mesh = new Mesh(g.build(), mats.concrete);
    mesh.name = `${tier}-terraces`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    blockMeshes.push(mesh);
  }

  group.add(...buildSuites(layout, mats));
  group.add(...buildFascia(layout, mats));
  group.add(buildSoffit(layout, mats));
  group.add(buildRunoff(front, mats));
  return { group, blockMeshes };
}

// ---------------------------------------------------------------- terraces

function buildBlockTerrace(
  g: GeoBuilder,
  front: Superellipse,
  b: Block,
  prof: RowProfile[],
  p: TierProfile,
  tier: 'lower' | 'upper',
  prevRows: number,
  nextRows: number,
): void {
  const rows = b.rows;
  const half = p.aisle / 2;
  const yBelow = (r: number) => (r === 0 ? (tier === 'lower' ? -0.02 : FASCIA.topY + 1.3) : prof[r - 1].y);

  for (let r = 0; r < rows; r++) {
    const d0 = prof[r].d;
    const d1 = prof[r + 1].d;
    const y = prof[r].y;
    const yPrev = yBelow(r);
    const latF = lateral(front, b, d0);
    const latB = lateral(front, b, d1);
    const ua = half / latF.length;
    const holes = b.vomitories
      .filter((v) => r >= v.rowFrom && r <= v.rowTo)
      .map((v) => [v.u - v.width / 2 / latF.length, v.u + v.width / 2 / latF.length] as [number, number]);
    const cuts = holes.flat();
    const us = stops(ua, 1 - ua, latF.length, 2.2, cuts);
    const inHole = (u0: number, u1: number) => holes.some(([a, c]) => (u0 + u1) / 2 > a && (u0 + u1) / 2 < c);
    // occlusion: rows under the upper-tier overhang get less sky; the upper deck is darker still
    const ao = tier === 'lower' ? 1 - Math.max(0, (r - 18) / (rows - 18)) * 0.35 : 0.62;

    for (let i = 0; i < us.length - 1; i++) {
      const u0 = us[i];
      const u1 = us[i + 1];
      if (inHole(u0, u1)) continue;
      const ta0 = latF.tAt(u0), ta1 = latF.tAt(u1);
      const tb0 = latB.tAt(u0), tb1 = latB.tAt(u1);
      // tread
      g.setGray(C_CONCRETE * ao);
      g.quad(P(front, ta0, d0, y), P(front, tb0, d1, y), P(front, tb1, d1, y), P(front, ta1, d0, y), UP);
      // riser in front of the tread (faces the pitch)
      g.setGray(C_RISER * ao);
      const rp = P(front, ta0, d0, yPrev);
      g.quad(rp, P(front, ta0, d0, y), P(front, ta1, d0, y), P(front, ta1, d0, yPrev), IN(rp));
    }

    // aisles: half on each side of the block, two steps per row with yellow nosing
    for (const [ux0, ux1] of [
      [0, ua],
      [1 - ua, 1],
    ] as [number, number][]) {
      const ta0 = latF.tAt(ux0), ta1 = latF.tAt(ux1);
      const tb0 = latB.tAt(ux0), tb1 = latB.tAt(ux1);
      const dm = (d0 + d1) / 2;
      const latM = lateral(front, b, dm);
      const tm0 = latM.tAt(ux0), tm1 = latM.tAt(ux1);
      const yNext = prof[r + 1].y;
      const yMid = y + (yNext - y) / 2;
      const yPrevMid = r === 0 ? yPrev : yPrev + (y - yPrev) / 2;
      const ref = P(front, ta0, d0, y);
      g.setGray(C_AISLE * ao);
      // lower step
      g.quad(P(front, ta0, d0, y), P(front, tm0, dm, y), P(front, tm1, dm, y), P(front, ta1, d0, y), UP);
      g.setGray(C_RISER * ao);
      g.quad(P(front, ta0, d0, yPrevMid), P(front, ta0, d0, y), P(front, ta1, d0, y), P(front, ta1, d0, yPrevMid), IN(ref));
      // upper half step
      g.setGray(C_AISLE * ao);
      g.quad(P(front, tm0, dm, yMid), P(front, tb0, d1, yMid), P(front, tb1, d1, yMid), P(front, tm1, dm, yMid), UP);
      g.setGray(C_RISER * ao);
      g.quad(P(front, tm0, dm, y), P(front, tm0, dm, yMid), P(front, tm1, dm, yMid), P(front, tm1, dm, y), IN(ref));
      // nosing strips
      g.setColor(NOSING[0] * ao, NOSING[1] * ao, NOSING[2] * ao);
      g.quad(P(front, ta0, d0, y + 0.004), P(front, ta0, d0 + 0.06, y + 0.004), P(front, ta1, d0 + 0.06, y + 0.004), P(front, ta1, d0, y + 0.004), UP);
      g.quad(P(front, tm0, dm, yMid + 0.004), P(front, tm0, dm + 0.06, yMid + 0.004), P(front, tm1, dm + 0.06, yMid + 0.004), P(front, tm1, dm, yMid + 0.004), UP);
    }
  }

  // ---- front parapet (row 0)
  {
    const d0 = prof[0].d;
    const lat = lateral(front, b, d0);
    const us = stops(0, 1, lat.length, 2.2);
    const yTop = prof[0].y + 0.95;
    const yBot = tier === 'lower' ? -0.02 : FASCIA.topY + 1.3;
    for (let i = 0; i < us.length - 1; i++) {
      const t0 = lat.tAt(us[i]), t1 = lat.tAt(us[i + 1]);
      const ref = P(front, t0, d0, yTop);
      g.setGray(C_PARAPET);
      // back face (towards seats)
      g.quad(P(front, t1, d0, prof[0].y), P(front, t1, d0, yTop), P(front, t0, d0, yTop), P(front, t0, d0, prof[0].y), OUT(ref));
      // cap
      g.quad(P(front, t0, d0 - 0.25, yTop), P(front, t0, d0, yTop), P(front, t1, d0, yTop), P(front, t1, d0 - 0.25, yTop), UP);
      // front face (towards pitch)
      g.setGray(C_RISER);
      g.quad(P(front, t0, d0 - 0.25, yBot), P(front, t0, d0 - 0.25, yTop), P(front, t1, d0 - 0.25, yTop), P(front, t1, d0 - 0.25, yBot), IN(ref));
    }
  }

  // ---- vomitories
  for (const v of b.vomitories) {
    const rf = v.rowFrom;
    const rt = Math.min(v.rowTo, rows - 1);
    if (rf >= rows) continue;
    const dF = prof[rf].d;
    const dB = prof[rt + 1].d;
    const floorY = prof[rf - 1]?.y ?? prof[rf].y;
    const latF = lateral(front, b, dF);
    const latB = lateral(front, b, dB);
    const uL = v.u - v.width / 2 / latF.length;
    const uR = v.u + v.width / 2 / latF.length;
    const tFL = latF.tAt(uL), tFR = latF.tAt(uR);
    const tBL = latB.tAt(uL), tBR = latB.tAt(uR);
    // floor
    g.setGray(0.42);
    g.quad(P(front, tFL, dF, floorY), P(front, tBL, dB, floorY), P(front, tBR, dB, floorY), P(front, tFR, dF, floorY), UP);
    // dark tunnel mouth at the back, up to the tread above
    g.setGray(C_VOM);
    const yTop = prof[rt].y;
    const mouth = P(front, tBL, dB, floorY);
    g.quad(mouth, P(front, tBL, dB, yTop), P(front, tBR, dB, yTop), P(front, tBR, dB, floorY), IN(mouth));
    const centre = P(front, latF.tAt(v.u), dF, floorY);
    // side walls following the steps + 1 m guard
    for (const [uu, side] of [
      [uL, 1],
      [uR, -1],
    ] as [number, number][]) {
      for (let r = rf; r <= rt; r++) {
        const da = prof[r].d;
        const db = prof[r + 1].d;
        const ta = lateral(front, b, da).tAt(uu);
        const tb = lateral(front, b, db).tAt(uu);
        const top = prof[r].y + 1.0;
        g.setGray(0.55);
        const a = P(front, ta, da, floorY);
        const bb = P(front, tb, db, floorY);
        const c = P(front, tb, db, top);
        const d = P(front, ta, da, top);
        const toOpening = SUB(centre, a);
        toOpening[1] = 0;
        g.quad(a, bb, c, d, toOpening);
        // wall cap
        const ta2 = lateral(front, b, da).tAt(uu - side * (0.2 / latF.length));
        const tb2 = lateral(front, b, db).tAt(uu - side * (0.2 / latF.length));
        g.quad(d, c, P(front, tb2, db, top), P(front, ta2, da, top), UP);
        // outer face of the guard wall above the treads beside the opening
        const away: V3 = [-toOpening[0], 0, -toOpening[2]];
        g.quad(P(front, ta2, da, prof[r].y), P(front, tb2, db, prof[r].y), P(front, tb2, db, top), P(front, ta2, da, top), away);
      }
    }
  }

  // ---- back wall + walkway behind the last row
  {
    const dB = prof[rows].d;
    const yTop = prof[rows - 1].y;
    const lat = lateral(front, b, dB);
    const us = stops(0, 1, lat.length, 2.2);
    for (let i = 0; i < us.length - 1; i++) {
      const t0 = lat.tAt(us[i]), t1 = lat.tAt(us[i + 1]);
      const ref = P(front, t0, dB, yTop);
      if (tier === 'upper') {
        g.setGray(C_PARAPET);
        // parapet behind the top row
        g.quad(P(front, t0, dB, yTop), P(front, t0, dB, yTop + 1.15), P(front, t1, dB, yTop + 1.15), P(front, t1, dB, yTop), IN(ref));
        g.quad(P(front, t0, dB, yTop + 1.15), P(front, t0, dB + 0.3, yTop + 1.15), P(front, t1, dB + 0.3, yTop + 1.15), P(front, t1, dB, yTop + 1.15), UP);
        g.setGray(0.82);
        // outer back face down to the soffit line
        g.quad(P(front, t1, dB + 0.3, yTop - 3.2), P(front, t1, dB + 0.3, yTop + 1.15), P(front, t0, dB + 0.3, yTop + 1.15), P(front, t0, dB + 0.3, yTop - 3.2), OUT(ref));
      } else {
        // step up to the suite balcony level
        g.setGray(C_RISER * 0.75);
        g.quad(P(front, t0, dB, yTop), P(front, t0, dB, SUITES.floorY), P(front, t1, dB, SUITES.floorY), P(front, t1, dB, yTop), IN(ref));
        g.setGray(0.72);
        g.quad(P(front, t0, dB, SUITES.floorY), P(front, t0, SUITES.frontD, SUITES.floorY), P(front, t1, SUITES.frontD, SUITES.floorY), P(front, t1, dB, SUITES.floorY), UP);
      }
    }
  }

  // ---- side caps where the neighbouring block has fewer rows (upper-tier wave)
  for (const [nRows, u] of [
    [prevRows, 0],
    [nextRows, 1],
  ] as [number, number][]) {
    if (nRows >= rows) continue;
    const yBase = prof[Math.max(0, nRows - 1)].y - 3.0;
    for (let r = nRows; r < rows; r++) {
      const da = prof[r].d;
      const db = prof[r + 1].d;
      const lat = lateral(front, b, da);
      const ta = lat.tAt(u);
      const tb = lateral(front, b, db).tAt(u);
      const top = prof[r].y + 1.0;
      // face away from the block, towards the shorter neighbour
      const away = SUB(P(front, ta, da, 0), P(front, lat.tAt(u === 0 ? 0.1 : 0.9), da, 0));
      g.setGray(0.86);
      g.quad(P(front, ta, da, yBase), P(front, tb, db, yBase), P(front, tb, db, top), P(front, ta, da, top), away);
    }
  }
}

// ---------------------------------------------------------------- suites

function buildSuites(layout: StadiumLayout, mats: StadiumMaterials): Mesh[] {
  const front = layout.front;
  const shell = new GeoBuilder();
  const interior = new GeoBuilder();
  const glassG = new GeoBuilder();
  const frames = new GeoBuilder();
  const S = SUITES;
  const r0Y = S.floorY;
  const r1Y = S.floorY + 0.38;
  const d0 = S.frontD;
  const d1 = S.frontD + 0.85;
  const d2 = S.frontD + 1.7;
  for (const bi of layout.suiteBlocks) {
    const b = layout.blocks[bi];
    shell.blockId = b.index + 1;
    const n = 6;
    const ts = (d: number) => {
      const s = sampleSpan(front, b.t0, b.t1, d, 8);
      return Array.from({ length: n + 1 }, (_, i) => s.tAtS((i / n) * s.length));
    };
    const tF = ts(d0), tM = ts(d1), tB = ts(d2), tG = ts(S.glassD), tR = ts(S.backD);
    for (let i = 0; i < n; i++) {
      const [a, c] = [i, i + 1];
      const ref = P(front, tF[a], d0, r0Y);
      shell.setGray(0.86);
      // balcony treads
      shell.quad(P(front, tF[a], d0, r0Y), P(front, tM[a], d1, r0Y), P(front, tM[c], d1, r0Y), P(front, tF[c], d0, r0Y), UP);
      shell.quad(P(front, tM[a], d1, r1Y), P(front, tB[a], d2, r1Y), P(front, tB[c], d2, r1Y), P(front, tM[c], d1, r1Y), UP);
      shell.quad(P(front, tB[a], d2, r1Y), P(front, tG[a], S.glassD, r1Y), P(front, tG[c], S.glassD, r1Y), P(front, tB[c], d2, r1Y), UP);
      shell.setGray(0.78);
      shell.quad(P(front, tM[a], d1, r0Y), P(front, tM[a], d1, r1Y), P(front, tM[c], d1, r1Y), P(front, tM[c], d1, r0Y), IN(ref));
      // balcony front kerb
      shell.setGray(0.9);
      shell.quad(P(front, tF[c], d0, r0Y), P(front, tF[c], d0, r0Y + 0.35), P(front, tF[a], d0, r0Y + 0.35), P(front, tF[a], d0, r0Y), IN(ref));
      // interior room
      interior.setGray(0.9);
      interior.quad(P(front, tG[a], S.glassD, r1Y), P(front, tR[a], S.backD, r1Y), P(front, tR[c], S.backD, r1Y), P(front, tG[c], S.glassD, r1Y), UP);
      interior.setGray(1.0);
      interior.quad(P(front, tR[a], S.backD, r1Y), P(front, tR[a], S.backD, S.ceilingY), P(front, tR[c], S.backD, S.ceilingY), P(front, tR[c], S.backD, r1Y), IN(ref));
      interior.setGray(1.2);
      interior.quad(P(front, tG[c], S.glassD, S.ceilingY), P(front, tR[c], S.backD, S.ceilingY), P(front, tR[a], S.backD, S.ceilingY), P(front, tG[a], S.glassD, S.ceilingY), DOWN);
      // glass front
      glassG.quad(P(front, tG[c], S.glassD, r1Y), P(front, tG[c], S.glassD, S.ceilingY), P(front, tG[a], S.glassD, S.ceilingY), P(front, tG[a], S.glassD, r1Y), IN(ref));
      // balcony handrail (thin dark bar)
      frames.setGray(1);
      frames.quad(P(front, tF[a], d0 - 0.02, r0Y + 1.02), P(front, tF[a], d0 - 0.02, r0Y + 1.08), P(front, tF[c], d0 - 0.02, r0Y + 1.08), P(front, tF[c], d0 - 0.02, r0Y + 1.02), IN(ref));
      frames.quad(P(front, tF[a], d0 - 0.02, r0Y + 1.08), P(front, tF[a], d0 + 0.06, r0Y + 1.08), P(front, tF[c], d0 + 0.06, r0Y + 1.08), P(front, tF[c], d0 - 0.02, r0Y + 1.08), UP);
    }
    // partition between suites (at t0): low screen on the balcony + full wall inside
    {
      const tf = tF[0], tg = tG[0], tr = tR[0];
      const along = SUB(P(front, tF[1], d0, 0), P(front, tF[0], d0, 0));
      const back: V3 = [-along[0], 0, -along[2]];
      shell.setGray(0.95);
      shell.quad(P(front, tf, d0, r0Y), P(front, tg, S.glassD, r0Y), P(front, tg, S.glassD, r0Y + 1.15), P(front, tf, d0, r0Y + 1.15), along);
      shell.quad(P(front, tf, d0, r0Y), P(front, tg, S.glassD, r0Y), P(front, tg, S.glassD, r0Y + 1.15), P(front, tf, d0, r0Y + 1.15), back);
      interior.setGray(0.8);
      interior.quad(P(front, tg, S.glassD, r1Y), P(front, tr, S.backD, r1Y), P(front, tr, S.backD, S.ceilingY), P(front, tg, S.glassD, S.ceilingY), along);
      interior.quad(P(front, tg, S.glassD, r1Y), P(front, tr, S.backD, r1Y), P(front, tr, S.backD, S.ceilingY), P(front, tg, S.glassD, S.ceilingY), back);
      // mullions on the glass at the suite boundary and the centre
      for (const tt of [tG[0], tG[3]]) {
        const q = front.offset(tt, S.glassD - 0.03);
        const nn = front.normal(tt);
        const tx = -nn.z * 0.05, tz = nn.x * 0.05;
        frames.quad([q.x - tx, r1Y, q.z - tz], [q.x - tx, S.ceilingY, q.z - tz], [q.x + tx, S.ceilingY, q.z + tz], [q.x + tx, r1Y, q.z + tz], [-nn.x, 0, -nn.z]);
      }
    }
  }
  const shellMesh = new Mesh(shell.build(), mats.concrete);
  shellMesh.name = 'suites-shell';
  shellMesh.receiveShadow = true;
  shellMesh.castShadow = true;
  const interiorMesh = new Mesh(interior.build(false), mats.suiteInterior);
  interiorMesh.name = 'suites-interior';
  const glassMat = new MeshStandardMaterial({
    color: 0x1a2229,
    roughness: 0.05,
    metalness: 0.85,
    transparent: true,
    opacity: 0.58,
    envMapIntensity: 1.3,
    side: DoubleSide,
    depthWrite: false,
  });
  const glassMesh = new Mesh(glassG.build(false), glassMat);
  glassMesh.name = 'suites-glass';
  glassMesh.renderOrder = 2;
  const frameMesh = new Mesh(frames.build(false), mats.steelDark);
  frameMesh.name = 'suites-frames';
  return [shellMesh, interiorMesh, glassMesh, frameMesh];
}

// ---------------------------------------------------------------- fascia / LED ribbon

function buildFascia(layout: StadiumLayout, mats: StadiumMaterials): Mesh[] {
  const front = layout.front;
  const n = 720;
  const d = FASCIA.d;
  const top = layout.upperProfile[0].y + 0.95;
  const clad = new GeoBuilder();
  // LED band runs continuously; u follows arc length so the text is not stretched
  const ledPos: number[] = [];
  const ledUv: number[] = [];
  const ledIdx: number[] = [];
  let arc = 0;
  let prev = front.offset(0, d);
  const ledBottom = FASCIA.bottomY + 0.12;
  const ledTop = FASCIA.bottomY + 1.12;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const q = front.offset(t, d - 0.01);
    if (i > 0) arc += Math.hypot(q.x - prev.x, q.z - prev.z);
    prev = q;
    ledPos.push(q.x, ledBottom, q.z, q.x, ledTop, q.z);
    ledUv.push(arc / 32, 0, arc / 32, 1);
    if (i < n) {
      const k = i * 2;
      ledIdx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
    if (i < n) {
      const t1 = ((i + 1) / n) * Math.PI * 2;
      const ref = P(front, t, d, top);
      clad.setGray(0.16);
      // black cladding above and below the LED band
      clad.quad(P(front, t, d, ledTop), P(front, t, d, top), P(front, t1, d, top), P(front, t1, d, ledTop), IN(ref));
      clad.quad(P(front, t, d, FASCIA.bottomY), P(front, t, d, ledBottom), P(front, t1, d, ledBottom), P(front, t1, d, FASCIA.bottomY), IN(ref));
      clad.setGray(0.55);
      // top cap back to the first upper row
      clad.quad(P(front, t, d, top), P(front, t, layout.upperProfile[0].d - 0.25, top), P(front, t1, layout.upperProfile[0].d - 0.25, top), P(front, t1, d, top), UP);
      // underside edge
      clad.quad(P(front, t1, d, FASCIA.bottomY), P(front, t1, d + 0.6, FASCIA.bottomY), P(front, t, d + 0.6, FASCIA.bottomY), P(front, t, d, FASCIA.bottomY), DOWN);
    }
  }
  const ledGeo = new BufferGeometry();
  ledGeo.setAttribute('position', new BufferAttribute(new Float32Array(ledPos), 3));
  ledGeo.setAttribute('uv', new BufferAttribute(new Float32Array(ledUv), 2));
  ledGeo.setIndex(ledIdx);
  ledGeo.computeVertexNormals();
  const ledMesh = new Mesh(ledGeo, mats.led);
  ledMesh.name = 'led-ribbon';
  const cladMesh = new Mesh(clad.build(false), mats.dark);
  cladMesh.name = 'fascia';
  cladMesh.castShadow = true;
  cladMesh.receiveShadow = true;
  return [cladMesh, ledMesh];
}

// ---------------------------------------------------------------- soffit under the upper tier

function buildSoffit(layout: StadiumLayout, mats: StadiumMaterials): Mesh {
  const front = layout.front;
  const prof = layout.upperProfile;
  const g = new GeoBuilder();
  for (const b of layout.blocks.filter((x) => x.tier === 'upper')) {
    const lat = lateral(front, b, prof[0].d);
    const us = stops(0, 1, lat.length, 2.5);
    // profile in (d, y): fascia bottom → follow the rake 2 m under the treads
    const pts: [number, number][] = [[FASCIA.d + 0.6, FASCIA.bottomY]];
    for (let r = 0; r <= b.rows; r++) {
      const yy = Math.max(FASCIA.bottomY, prof[Math.min(r, b.rows - 1)].y - 2.1);
      pts.push([prof[r].d, yy]);
    }
    pts.push([prof[b.rows].d + 0.3, prof[b.rows - 1].y - 3.2]);
    for (let k = 0; k < pts.length - 1; k++) {
      const [da, ya] = pts[k];
      const [db, yb] = pts[k + 1];
      for (let i = 0; i < us.length - 1; i++) {
        const t0 = lateral(front, b, da).tAt(us[i]);
        const t1 = lateral(front, b, da).tAt(us[i + 1]);
        const t2 = lateral(front, b, db).tAt(us[i + 1]);
        const t3 = lateral(front, b, db).tAt(us[i]);
        g.setGray(0.62);
        g.quad(P(front, t0, da, ya), P(front, t1, da, ya), P(front, t2, db, yb), P(front, t3, db, yb), DOWN);
      }
    }
  }
  const m = new Mesh(g.build(false), mats.concrete);
  m.name = 'upper-soffit';
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}

// ---------------------------------------------------------------- run-off ground

function buildRunoff(front: Superellipse, mats: StadiumMaterials): Mesh {
  const outer = new Shape();
  const n = 256;
  for (let i = 0; i <= n; i++) {
    const q = front.offset((i / n) * Math.PI * 2, -0.25);
    if (i === 0) outer.moveTo(q.x, q.z);
    else outer.lineTo(q.x, q.z);
  }
  const hole = new Path();
  const hx = PITCH.grassHalfX, hz = PITCH.grassHalfZ;
  hole.moveTo(-hx, -hz);
  hole.lineTo(-hx, hz);
  hole.lineTo(hx, hz);
  hole.lineTo(hx, -hz);
  hole.lineTo(-hx, -hz);
  outer.holes.push(hole);
  const geo = new ShapeGeometry(outer, 1);
  geo.rotateX(Math.PI / 2);
  // ShapeGeometry is in XY; rotating +90° about X maps y→z but flips the face: fix normals
  const nrm = geo.getAttribute('normal');
  for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
  const idx = geo.getIndex()!;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const m = new Mesh(geo, mats.runoff);
  m.position.y = -0.01;
  m.receiveShadow = true;
  m.name = 'runoff';
  return m;
}
