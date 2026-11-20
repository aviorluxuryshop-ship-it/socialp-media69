/**
 * World data: OSM-derived features and SRTM terrain, in the stadium frame.
 * Provides terrain height and land/water queries for any (x, z).
 */
import { PITCH_ELEVATION, OUTER_CURVE } from '../stadium/config.ts';

/** ring: counter-clockwise outline; holes: clockwise courtyards (multipolygon inner rings) */
export type BuildingRec = [kind: number, height: number, minHeight: number, variant: number, ring: number[], holes?: number[][]];
export type RoadRec = [cls: number, width: number, lit: number, bridge: number, pts: number[]];
export type AreaRec = [cls: number, ring: number[]];

interface GridInfo {
  nx: number;
  ny: number;
  step: number;
  e0: number;
  n0: number;
}

export interface WorldJson {
  meta: { origin: [number, number]; bearing: number; mlat: number; mlon: number; chunk: number; attribution: string };
  terrain: { near: GridInfo; far: GridInfo; coast: { nx: number; ny: number; res: number; e0: number; n0: number; units: number } };
  site: number[];
  eskiAcik: number[];
  buildings: Record<string, BuildingRec[]>;
  trees: Record<string, number[]>;
  roads: RoadRec[];
  areas: AreaRec[];
  landmarks: Record<string, Record<string, number[] | number>>;
  /** tunnel mouths: x, z, direction into the tunnel (dx, dz), road width */
  portals?: number[][];
}

export class World {
  readonly json: WorldJson;
  private readonly near: Int16Array;
  private readonly far: Int16Array;
  private readonly coast: Int8Array;
  private readonly sb: number;
  private readonly cb: number;
  readonly site: [number, number][];
  /** chunk-grid bounds (inclusive chunk indices) */
  readonly chunkMin: [number, number];
  readonly chunkMax: [number, number];

  constructor(json: WorldJson, terrain: ArrayBuffer, coast: ArrayBuffer) {
    this.json = json;
    const nn = json.terrain.near.nx * json.terrain.near.ny;
    this.near = new Int16Array(terrain, 0, nn);
    this.far = new Int16Array(terrain, nn * 2, json.terrain.far.nx * json.terrain.far.ny);
    this.coast = new Int8Array(coast);
    const b = (json.meta.bearing * Math.PI) / 180;
    this.sb = Math.sin(b);
    this.cb = Math.cos(b);
    this.site = [];
    for (let i = 0; i < json.site.length; i += 2) this.site.push([json.site[i], json.site[i + 1]]);
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const key of Object.keys(json.buildings)) {
      const [cx, cz] = key.split(',').map(Number);
      minX = Math.min(minX, cx);
      minZ = Math.min(minZ, cz);
      maxX = Math.max(maxX, cx);
      maxZ = Math.max(maxZ, cz);
    }
    this.chunkMin = [minX, minZ];
    this.chunkMax = [maxX, maxZ];
  }

  get chunkSize(): number {
    return this.json.meta.chunk;
  }

  /** stadium frame → east/north metres (the transform is its own inverse) */
  toENU(x: number, z: number): [number, number] {
    return [x * this.sb + z * this.cb, x * this.cb - z * this.sb];
  }

  fromENU(e: number, n: number): [number, number] {
    return [e * this.sb + n * this.cb, e * this.cb - n * this.sb];
  }

  /** Unit vector in the stadium frame for a compass bearing (deg from north, clockwise). */
  bearingVector(deg: number): [number, number] {
    const r = (deg * Math.PI) / 180;
    return this.fromENU(Math.sin(r), Math.cos(r));
  }

  private sampleGrid(g: GridInfo, data: Int16Array, e: number, n: number): number | null {
    const fx = (e - g.e0) / g.step;
    const fy = (n - g.n0) / g.step;
    if (fx < 0 || fy < 0 || fx > g.nx - 1 || fy > g.ny - 1) return null;
    const x0 = Math.min(g.nx - 2, Math.floor(fx));
    const y0 = Math.min(g.ny - 2, Math.floor(fy));
    const tx = fx - x0;
    const ty = fy - y0;
    const i = y0 * g.nx + x0;
    const a = data[i], b = data[i + 1], c = data[i + g.nx], d = data[i + g.nx + 1];
    return (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty) / 10;
  }

  /** Signed distance to the OSM coastline (m, + = land) or null outside its raster. */
  coastDistance(x: number, z: number): number | null {
    const [e, n] = this.toENU(x, z);
    const c = this.json.terrain.coast;
    const fx = (e - c.e0) / c.res;
    const fy = (n - c.n0) / c.res;
    if (fx < 0 || fy < 0 || fx > c.nx - 1 || fy > c.ny - 1) return null;
    const x0 = Math.min(c.nx - 2, Math.floor(fx));
    const y0 = Math.min(c.ny - 2, Math.floor(fy));
    const tx = fx - x0;
    const ty = fy - y0;
    const i = y0 * c.nx + x0;
    const a = this.coast[i], b = this.coast[i + 1], cc = this.coast[i + c.nx], d = this.coast[i + c.nx + 1];
    return ((a + (b - a) * tx + (cc - a) * ty + (a - b - cc + d) * tx * ty) * c.units);
  }

  /** Raw DEM height (m above sea level) without coast or stadium shaping. */
  demHeight(x: number, z: number): number {
    const [e, n] = this.toENU(x, z);
    const h = this.sampleGrid(this.json.terrain.near, this.near, e, n);
    if (h !== null) {
      // fade into the far grid near the edge of the near grid
      const g = this.json.terrain.near;
      const fx = (e - g.e0) / g.step, fy = (n - g.n0) / g.step;
      const edge = Math.min(fx, fy, g.nx - 1 - fx, g.ny - 1 - fy);
      if (edge < 3) {
        const f = this.sampleGrid(this.json.terrain.far, this.far, e, n) ?? h;
        return f + (h - f) * (edge / 3);
      }
      return h;
    }
    return this.sampleGrid(this.json.terrain.far, this.far, e, n) ?? -12;
  }

  /** Distance from the stadium site outline (0 inside). */
  siteDistance(x: number, z: number): number {
    if (pointInRing(x, z, this.site)) return 0;
    let best = Infinity;
    const s = this.site;
    for (let i = 0; i < s.length; i++) {
      const [ax, az] = s[i];
      const [bx, bz] = s[(i + 1) % s.length];
      best = Math.min(best, segDist(x, z, ax, az, bx, bz));
    }
    return best;
  }

  /** Final ground height used by terrain, buildings, trees and roads. */
  heightAt(x: number, z: number): number {
    // inside the stadium shell the stadium's own floor takes over
    const inBowl = Math.pow(Math.abs(x) / (OUTER_CURVE.a - 3), OUTER_CURVE.p) + Math.pow(Math.abs(z) / (OUTER_CURVE.b - 3), OUTER_CURVE.p);
    if (inBowl < 1) return PITCH_ELEVATION - 1.2;
    let h = this.demHeight(x, z);
    // stadium platform: the pitch level, blended out over 60 m
    const rr = Math.hypot(x / (OUTER_CURVE.a + 18), z / (OUTER_CURVE.b + 18));
    const sd = Math.min(this.siteDistance(x, z), rr < 1 ? 0 : (rr - 1) * 90);
    if (sd < 60) {
      const k = smoothstep(0, 60, sd);
      h = PITCH_ELEVATION + (h - PITCH_ELEVATION) * k;
    }
    const c = this.coastDistance(x, z);
    if (c !== null) {
      if (c <= 0) return Math.max(-9, c * 1.2 - 0.6);
      const k = smoothstep(0, 4, c);
      return Math.max(0.2, 1.6 * k + (Math.max(h, 1.6) - 1.6 * k) * k);
    }
    // outside the OSM raster the far DEM already encodes water as −12
    return h;
  }

  isWater(x: number, z: number): boolean {
    const c = this.coastDistance(x, z);
    if (c !== null) return c < 0;
    return this.demHeight(x, z) < 0;
  }
}

export function pointInRing(x: number, z: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi) inside = !inside;
  }
  return inside;
}

function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  let t = ((px - ax) * dx + (pz - az) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export async function loadWorld(base = './data/'): Promise<World> {
  const [j, t, c] = await Promise.all([
    fetch(base + 'world.json').then((r) => r.json() as Promise<WorldJson>),
    fetch(base + 'terrain.bin').then((r) => r.arrayBuffer()),
    fetch(base + 'coast.bin').then((r) => r.arrayBuffer()),
  ]);
  return new World(j, t, c);
}
