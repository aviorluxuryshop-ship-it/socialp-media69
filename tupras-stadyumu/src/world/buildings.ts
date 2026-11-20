/**
 * City buildings from OSM footprints, merged per chunk.
 *
 * Façade windows are generated in the shader from a per-vertex (u = metres
 * along the façade, v = metres above the base) parameterisation, so they cost
 * no geometry. At night a hash lights a share of the windows.
 */
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  MeshStandardMaterial,
  ShapeUtils,
  Vector2,
  type IUniform,
} from 'three';
import type { BuildingRec, World } from './data.ts';

// Istanbul façade palette: creams, sands, pale greys and a few pastels
const FACADE_COLORS = [
  '#cdbfa6', '#b9a88e', '#d6cab5', '#a9a39a', '#c8b39a', '#ddd1bd', '#b3a996', '#c4b6a2',
  '#c79f82', '#cdb98a', '#9da69f', '#bfae9d', '#d2c3ac', '#a8988a', '#e0d6c6', '#b7aa8f',
].map((c) => new Color(c));
const ROOF_COLORS = [new Color('#8f5a43'), new Color('#7d7a76'), new Color('#9a968f'), new Color('#a0624a')];
const KIND_COLORS: Record<number, Color> = {
  1: new Color('#f1ece2'), // palace / historic: white marble
  2: new Color('#6e8295'), // glass towers
  3: new Color('#d6d0c4'), // mosques: limestone
};

export interface BuildingUniforms {
  uNight: IUniform<number>;
}

export function createBuildingMaterial(uniforms: BuildingUniforms): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.0 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = uniforms.uNight;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aInfo;\nattribute vec2 aFacade;\nvarying vec3 vInfo;\nvarying vec2 vFacade;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvInfo = aInfo;\nvFacade = aFacade;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uNight;
varying vec3 vInfo;   // kind, isRoof, seed
varying vec2 vFacade; // metres along façade, metres above base
float bhash(vec3 p){ p = fract(p*0.3183099+vec3(0.71,0.113,0.419)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float wMask = 0.0;
float lit = 0.0;
vec2 bCell = vec2(0.0);
if (vInfo.y < 0.5) {
  float kind = vInfo.x;
  float bayW = kind > 1.5 && kind < 2.5 ? 1.6 : 3.1;
  float flH = kind > 0.5 && kind < 1.5 ? 4.6 : 3.2;
  vec2 cell = vec2(vFacade.x / bayW, vFacade.y / flH);
  bCell = cell;
  vec2 f = fract(cell);
  float wx = kind > 1.5 && kind < 2.5 ? step(0.06, f.x) * step(f.x, 0.94) : step(0.24, f.x) * step(f.x, 0.76);
  float wy = kind > 1.5 && kind < 2.5 ? step(0.12, f.y) * step(f.y, 0.9) : step(0.3, f.y) * step(f.y, 0.82);
  float ground = step(1.0, cell.y);
  wMask = wx * wy * ground;
  // screen-space filtering: when a window cell shrinks below ~2 px, fade the
  // hard grid into its average coverage so distant façades do not shimmer
  vec2 fwc = fwidth(cell);
  float blur = smoothstep(0.3, 0.85, max(fwc.x, fwc.y));
  float meanW = kind > 1.5 && kind < 2.5 ? 0.69 : 0.27;
  wMask = mix(wMask, meanW * ground, blur);
  // mosques: no regular window grid
  if (kind > 2.5) wMask *= step(0.5, fract(cell.x * 0.5));
  vec3 glass = kind > 1.5 && kind < 2.5 ? vec3(0.16, 0.22, 0.28) : vec3(0.07, 0.08, 0.09);
  diffuseColor.rgb = mix(diffuseColor.rgb, glass, wMask * 0.88);
  float h = bhash(vec3(floor(cell), vInfo.z * 97.0));
  float share = kind > 0.5 && kind < 1.5 ? 0.0 : (kind > 1.5 && kind < 2.5 ? 0.3 : 0.42);
  lit = mix(wMask * step(1.0 - share, h), wMask * share, blur);
}
`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.12, wMask);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
float warm = bhash(vec3(vFacade.x * 0.37, vInfo.z * 13.0, 5.0));
vec3 winCol = mix(vec3(1.0, 0.72, 0.42), vec3(0.85, 0.9, 1.0), step(0.75, warm));
totalEmissiveRadiance += winCol * lit * uNight * (0.9 + 0.9 * bhash(vec3(floor(bCell.y), vInfo.z, 3.0)));
// floodlit historic façades at night
totalEmissiveRadiance += (vInfo.x > 0.5 && vInfo.x < 1.5 && vInfo.y < 0.5) ? vec3(1.0, 0.86, 0.66) * 0.22 * uNight * (1.0 - wMask) : vec3(0.0);
`,
      );
  };
  m.customProgramCacheKey = () => 'tupras-buildings-v1';
  return m;
}

interface Buf {
  pos: number[];
  nor: number[];
  col: number[];
  info: number[];
  fac: number[];
  idx: number[];
}

function vtx(b: Buf, x: number, y: number, z: number, nx: number, ny: number, nz: number, c: Color, info: number[], fu: number, fv: number): number {
  b.pos.push(x, y, z);
  b.nor.push(nx, ny, nz);
  b.col.push(c.r, c.g, c.b);
  b.info.push(info[0], info[1], info[2]);
  b.fac.push(fu, fv);
  return b.pos.length / 3 - 1;
}

/** Dome (hemisphere) + optional drum, appended to the buffer. */
function addDome(b: Buf, cx: number, cy: number, cz: number, r: number, color: Color, seed: number, segs = 16, rings = 6): void {
  const info = [3, 1, seed];
  const base = b.pos.length / 3;
  for (let j = 0; j <= rings; j++) {
    const phi = (j / rings) * (Math.PI / 2);
    for (let i = 0; i <= segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      const nx = Math.cos(th) * Math.cos(phi);
      const ny = Math.sin(phi);
      const nz = Math.sin(th) * Math.cos(phi);
      vtx(b, cx + nx * r, cy + ny * r, cz + nz * r, nx, ny, nz, color, info, 0, 0);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const a = base + j * (segs + 1) + i;
      const c = a + segs + 1;
      b.idx.push(a, c, a + 1, a + 1, c, c + 1);
    }
  }
}

/** Minaret: slender prism, balcony ring, pointed cap. */
export function addMinaret(b: Buf, x: number, y0: number, z: number, h: number, r: number, color: Color, seed: number): void {
  const info = [3, 1, seed];
  const segs = 10;
  const ring = (y: number, rr: number) => {
    const s = b.pos.length / 3;
    for (let i = 0; i <= segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      vtx(b, x + Math.cos(th) * rr, y, z + Math.sin(th) * rr, Math.cos(th), 0, Math.sin(th), color, info, 0, 0);
    }
    return s;
  };
  const tube = (ya: number, yb: number, ra: number, rb: number) => {
    const a = ring(ya, ra);
    const c = ring(yb, rb);
    for (let i = 0; i < segs; i++) b.idx.push(a + i, c + i, a + i + 1, a + i + 1, c + i, c + i + 1);
  };
  tube(y0, y0 + h * 0.72, r, r * 0.92);
  tube(y0 + h * 0.72, y0 + h * 0.75, r * 1.6, r * 1.6);
  tube(y0 + h * 0.75, y0 + h * 0.86, r * 0.8, r * 0.78);
  // cone
  const a = ring(y0 + h * 0.86, r * 0.95);
  const tip = vtx(b, x, y0 + h, z, 0, 1, 0, new Color('#6d7378'), info, 0, 0);
  for (let i = 0; i < segs; i++) b.idx.push(a + i, tip, a + i + 1);
}

export function buildBuildingsGeometry(world: World, recs: BuildingRec[]): BufferGeometry | null {
  const b: Buf = { pos: [], nor: [], col: [], info: [], fac: [], idx: [] };
  for (let bi = 0; bi < recs.length; bi++) {
    const [kind, height, minH, variant, ringFlat, holeRings] = recs[bi];
    const n = ringFlat.length / 2;
    if (n < 3) continue;
    let base = Infinity;
    let cx = 0, cz = 0;
    for (let i = 0; i < n; i++) {
      const x = ringFlat[i * 2], z = ringFlat[i * 2 + 1];
      base = Math.min(base, world.heightAt(x, z));
      cx += x;
      cz += z;
    }
    cx /= n;
    cz /= n;
    if (base < 0.5 && world.isWater(cx, cz)) continue; // piers / bad data over water
    base -= 0.8; // sink slightly so slopes never show a gap
    const seed = ((Math.abs(ringFlat[0] * 13.37 + ringFlat[1] * 7.77) % 1000) / 1000) + 0.001;
    const wallColor = (KIND_COLORS[kind] ?? FACADE_COLORS[(variant * 2 + Math.floor(seed * 2)) % FACADE_COLORS.length]).clone();
    // gentle per-building tint so the fabric is not uniform
    wallColor.offsetHSL(0, 0, (seed - 0.5) * 0.06);
    const top = base + 0.8 + height;
    const bottom = base + minH;
    const info = [kind, 0, seed];
    // walls: the outline (counter-clockwise) and any courtyards (clockwise, facing in)
    const holes = holeRings ?? [];
    for (const rf of [ringFlat, ...holes]) {
      const m = rf.length / 2;
      let acc = 0;
      for (let i = 0; i < m; i++) {
        const x1 = rf[i * 2], z1 = rf[i * 2 + 1];
        const j = (i + 1) % m;
        const x2 = rf[j * 2], z2 = rf[j * 2 + 1];
        const len = Math.hypot(x2 - x1, z2 - z1);
        if (len < 0.05) continue;
        // counter-clockwise in (x, z): outward normal = (dz, −dx)
        const nx = (z2 - z1) / len, nz = -(x2 - x1) / len;
        const shade = 0.9 + 0.1 * Math.abs(nx); // fake bounce variation per orientation
        const c = wallColor.clone().multiplyScalar(shade * 0.92);
        const a = vtx(b, x1, bottom, z1, nx, 0, nz, c, info, acc, bottom - base);
        const bb = vtx(b, x2, bottom, z2, nx, 0, nz, c, info, acc + len, bottom - base);
        const cc = vtx(b, x2, top, z2, nx, 0, nz, c, info, acc + len, top - base);
        const d = vtx(b, x1, top, z1, nx, 0, nz, c, info, acc, top - base);
        b.idx.push(a, cc, bb, a, d, cc);
        acc += len;
      }
    }
    // roof (with the courtyards left open)
    const contour: Vector2[] = [];
    for (let i = 0; i < n; i++) contour.push(new Vector2(ringFlat[i * 2], ringFlat[i * 2 + 1]));
    const holePts = holes.map((rf) => {
      const out: Vector2[] = [];
      for (let i = 0; i < rf.length; i += 2) out.push(new Vector2(rf[i], rf[i + 1]));
      return out;
    });
    // (triangulateShape drops duplicated end points in place: read the vertices back after it)
    const tris = ShapeUtils.triangulateShape(contour, holePts);
    const roofPts = [...contour, ...holePts.flat()];
    const roofColor =
      kind === 1 ? new Color('#b9b6ae') : kind === 2 ? new Color('#5d6670') : kind === 3 ? new Color('#7f868c') : ROOF_COLORS[Math.floor(seed * 997) % ROOF_COLORS.length].clone();
    if (kind === 0 && height > 24) roofColor.set('#8e8a83');
    const rinfo = [kind, 1, seed];
    const r0 = b.pos.length / 3;
    for (const p of roofPts) vtx(b, p.x, top, p.y, 0, 1, 0, roofColor, rinfo, 0, 0);
    for (const t of tris) {
      // face up: triangulateShape returns CCW in (x, z) which faces −Y with x right / z down → flip
      b.idx.push(r0 + t[0], r0 + t[2], r0 + t[1]);
    }
    // mosques: dome and minaret
    if (kind === 3) {
      let r = 0;
      for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(ringFlat[i * 2] - cx, ringFlat[i * 2 + 1] - cz));
      const domeR = Math.min(14, r * 0.55);
      addDome(b, cx, top - domeR * 0.05, cz, domeR, new Color('#8a9196'), seed);
      const mx = ringFlat[0], mz = ringFlat[1];
      addMinaret(b, mx, top - 2, mz, Math.max(22, height * 1.9), 1.0, new Color('#ddd7cb'), seed);
    }
  }
  if (b.idx.length === 0) return null;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(b.pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(b.nor), 3));
  g.setAttribute('color', new BufferAttribute(new Float32Array(b.col), 3));
  g.setAttribute('aInfo', new BufferAttribute(new Float32Array(b.info), 3));
  g.setAttribute('aFacade', new BufferAttribute(new Float32Array(b.fac), 2));
  const vcount = b.pos.length / 3;
  g.setIndex(vcount > 65535 ? new BufferAttribute(new Uint32Array(b.idx), 1) : new BufferAttribute(new Uint16Array(b.idx), 1));
  g.computeBoundingSphere();
  return g;
}

export type { Buf };
export { vtx, addDome };
