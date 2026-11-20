/**
 * Trees per chunk: OSM tree nodes and tree rows, plus deterministic scatter in
 * parks, woods and cemeteries (cypresses). Merged into one geometry per chunk.
 */
import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry } from 'three';
import { pointInRing, type World } from './data.ts';

export interface AreaIndex {
  cls: number;
  ring: [number, number][];
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export function indexAreas(world: World): AreaIndex[] {
  const out: AreaIndex[] = [];
  for (const [cls, flat] of world.json.areas) {
    if (cls !== 1 && cls !== 2 && cls !== 3) continue;
    const ring: [number, number][] = [];
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < flat.length; i += 2) {
      ring.push([flat[i], flat[i + 1]]);
      minX = Math.min(minX, flat[i]);
      maxX = Math.max(maxX, flat[i]);
      minZ = Math.min(minZ, flat[i + 1]);
      maxZ = Math.max(maxZ, flat[i + 1]);
    }
    out.push({ cls, ring, minX, minZ, maxX, maxZ });
  }
  return out;
}

function h2(x: number, z: number, s: number): number {
  const v = Math.sin(x * 127.1 + z * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

const crownProto = new IcosahedronGeometry(1, 0).toNonIndexed();
const crownPos = crownProto.getAttribute('position').array as Float32Array;

export function buildTreesGeometry(world: World, areas: AreaIndex[], osmTrees: number[] | undefined, x0: number, z0: number, size: number): BufferGeometry | null {
  const pts: [number, number, number][] = []; // x, z, type (0 broadleaf, 1 cypress)
  if (osmTrees) for (let i = 0; i < osmTrees.length; i += 2) pts.push([osmTrees[i], osmTrees[i + 1], 0]);
  for (const a of areas) {
    if (a.maxX < x0 || a.minX > x0 + size || a.maxZ < z0 || a.minZ > z0 + size) continue;
    const spacing = a.cls === 2 ? 7.5 : a.cls === 3 ? 9 : 12;
    const keep = a.cls === 2 ? 0.85 : a.cls === 3 ? 0.5 : 0.5;
    const sx = Math.max(x0, a.minX), ex = Math.min(x0 + size, a.maxX);
    const sz = Math.max(z0, a.minZ), ez = Math.min(z0 + size, a.maxZ);
    for (let gx = Math.floor(sx / spacing) * spacing; gx < ex; gx += spacing) {
      for (let gz = Math.floor(sz / spacing) * spacing; gz < ez; gz += spacing) {
        if (h2(gx, gz, 1) > keep) continue;
        const x = gx + (h2(gx, gz, 2) - 0.5) * spacing * 0.8;
        const z = gz + (h2(gx, gz, 3) - 0.5) * spacing * 0.8;
        if (x < x0 || x >= x0 + size || z < z0 || z >= z0 + size) continue;
        if (!pointInRing(x, z, a.ring)) continue;
        pts.push([x, z, a.cls === 3 ? 1 : 0]);
      }
    }
  }
  if (pts.length === 0) return null;
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const c = new Color();
  const trunkC = new Color('#4a3b2c');
  for (const [x, z, type] of pts) {
    if (world.isWater(x, z)) continue;
    const y = world.heightAt(x, z);
    const r = h2(x, z, 4);
    if (type === 1) {
      // cypress: tall dark cone
      const h = 9 + r * 7;
      const rad = 1.0 + r * 0.6;
      c.setHSL(0.3, 0.32, 0.13 + r * 0.05);
      const segs = 7;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
        const p0 = [x + Math.cos(a0) * rad, y + 0.5, z + Math.sin(a0) * rad];
        const p1 = [x + Math.cos(a1) * rad, y + 0.5, z + Math.sin(a1) * rad];
        const tip = [x, y + h, z];
        pos.push(...p0, ...tip, ...p1);
        const nm = [(Math.cos(a0) + Math.cos(a1)) / 2, 0.25, (Math.sin(a0) + Math.sin(a1)) / 2];
        for (let k = 0; k < 3; k++) {
          nor.push(...nm);
          col.push(c.r, c.g, c.b);
        }
      }
      continue;
    }
    const rad = 2.6 + r * 2.4;
    const hTr = 2.2 + r * 1.6;
    // trunk (triangular prism, cheap)
    for (let i = 0; i < 3; i++) {
      const a0 = (i / 3) * Math.PI * 2, a1 = ((i + 1) / 3) * Math.PI * 2;
      const rr = 0.22;
      const b0 = [x + Math.cos(a0) * rr, y, z + Math.sin(a0) * rr];
      const b1 = [x + Math.cos(a1) * rr, y, z + Math.sin(a1) * rr];
      const t0 = [b0[0], y + hTr + rad * 0.4, b0[2]];
      const t1 = [b1[0], y + hTr + rad * 0.4, b1[2]];
      const nm = [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)];
      pos.push(...b0, ...t0, ...b1, ...b1, ...t0, ...t1);
      for (let k = 0; k < 6; k++) {
        nor.push(...nm);
        col.push(trunkC.r, trunkC.g, trunkC.b);
      }
    }
    // crown: spherical normals so the low-poly shape shades round, dark Mediterranean greens
    c.setHSL(0.22 + r * 0.07, 0.32 + r * 0.14, 0.13 + h2(z, x, 5) * 0.07);
    const sy = 0.85 + r * 0.35;
    const cy = y + hTr + rad * sy;
    for (let k = 0; k < crownPos.length; k += 3) {
      const px = crownPos[k], py = crownPos[k + 1], pz = crownPos[k + 2];
      // jitter radius per vertex for an irregular canopy
      const j = 0.85 + 0.3 * h2(x + px * 3.1, z + pz * 2.7, py * 5.3);
      pos.push(x + px * rad * j, cy + py * rad * sy * j, z + pz * rad * j);
      const l = Math.hypot(px, py * 1.2, pz) || 1;
      nor.push(px / l, (py * 1.2) / l, pz / l);
      const shade = 0.72 + 0.4 * (py * 0.5 + 0.5);
      col.push(c.r * shade, c.g * shade, c.b * shade);
    }
  }
  if (pos.length === 0) return null;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  g.computeBoundingSphere();
  return g;
}
