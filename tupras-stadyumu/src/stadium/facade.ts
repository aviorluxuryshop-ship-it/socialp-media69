/**
 * Outer shell: 82 cream stone piers (küfeki), a lintel band, slender steel
 * columns up to the compression ring, a dark glass curtain wall with floor
 * slab bands behind the piers, and the plaza around the stadium.
 */
import { BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three';
import { GeoBuilder } from '../core/geo.ts';
import { FACADE } from './config.ts';
import type { StadiumLayout } from './layout.ts';
import type { StadiumMaterials } from './materials.ts';
import { TAU } from './shape.ts';

type V3 = [number, number, number];

export function buildFacade(layout: StadiumLayout, mats: StadiumMaterials, ringHeight: (t: number) => number): Group {
  const group = new Group();
  group.name = 'facade';
  const outer = layout.outer;
  const stone = new GeoBuilder();
  stone.uvScale = 6;
  const steel = new GeoBuilder();
  const glass = new GeoBuilder();
  const slabs = new GeoBuilder();
  const N = FACADE.columns;
  const ground = -0.3;

  const at = (t: number, d: number, y: number): V3 => {
    const q = outer.offset(t, d);
    return [q.x, y, q.z];
  };
  const OUTD = (t: number): V3 => {
    const n = outer.normal(t);
    return [n.x, 0, n.z];
  };
  const IND = (t: number): V3 => {
    const n = outer.normal(t);
    return [-n.x, 0, -n.z];
  };

  // piers: centred on the radial stations of the roof
  for (let i = 0; i < N; i++) {
    const tc = outer.tAtU((i + 0.5) / N);
    const s = outer.arcAt(tc);
    const t0 = outer.tAt(s - FACADE.pierWidth / 2);
    const t1 = outer.tAt(s + FACADE.pierWidth / 2);
    const dO = -0.9 + FACADE.pierDepth / 2;
    const dI = -0.9 - FACADE.pierDepth / 2;
    const top = FACADE.pierTopY;
    stone.setGray(1);
    // outer face
    stone.quad(at(t0, dO, ground), at(t1, dO, ground), at(t1, dO, top), at(t0, dO, top), OUTD(tc));
    // sides
    const tang = (a: number, b: number): V3 => {
      const p = outer.point(a);
      const q = outer.point(b);
      return [q.x - p.x, 0, q.z - p.z];
    };
    stone.setGray(0.93);
    stone.quad(at(t0, dI, ground), at(t0, dO, ground), at(t0, dO, top), at(t0, dI, top), tang(t1, t0));
    stone.quad(at(t1, dO, ground), at(t1, dI, ground), at(t1, dI, top), at(t1, dO, top), tang(t0, t1));
    stone.setGray(0.8);
    stone.quad(at(t1, dI, ground), at(t0, dI, ground), at(t0, dI, top), at(t1, dI, top), IND(tc));
    // steel column from pier top to the compression ring
    const rh = ringHeight(tc) - FACADE.ringHeight / 2;
    const c = outer.offset(tc, -0.9);
    const n = outer.normal(tc);
    const tx = -n.z, tz = n.x;
    const w = 0.28;
    const corners = (y: number): V3[] => [
      [c.x - tx * w - n.x * w, y, c.z - tz * w - n.z * w],
      [c.x + tx * w - n.x * w, y, c.z + tz * w - n.z * w],
      [c.x + tx * w + n.x * w, y, c.z + tz * w + n.z * w],
      [c.x - tx * w + n.x * w, y, c.z - tz * w + n.z * w],
    ];
    const b = corners(top);
    const tt = corners(rh);
    steel.setGray(1);
    for (let k = 0; k < 4; k++) {
      const k1 = (k + 1) % 4;
      const mid: V3 = [(b[k][0] + b[k1][0]) / 2 - c.x, 0, (b[k][2] + b[k1][2]) / 2 - c.z];
      steel.quad(b[k], b[k1], tt[k1], tt[k], mid);
    }
  }

  // lintel band tying the pier heads together + base plinth
  const segs = 410;
  for (let i = 0; i < segs; i++) {
    const t0 = (i / segs) * TAU;
    const t1 = ((i + 1) / segs) * TAU;
    const dO = -0.9 + FACADE.pierDepth / 2 + 0.05;
    const dI = -0.9 - FACADE.pierDepth / 2;
    const yb = FACADE.pierTopY - 1.25;
    const yt = FACADE.pierTopY;
    stone.setGray(1);
    stone.quad(at(t0, dO, yb), at(t1, dO, yb), at(t1, dO, yt), at(t0, dO, yt), OUTD(t0));
    stone.setGray(0.95);
    stone.quad(at(t0, dI, yt), at(t0, dO, yt), at(t1, dO, yt), at(t1, dI, yt), [0, 1, 0]);
    stone.setGray(0.7);
    stone.quad(at(t0, dO, yb), at(t0, dI, yb), at(t1, dI, yb), at(t1, dO, yb), [0, -1, 0]);
    stone.setGray(0.85);
    stone.quad(at(t0, dI, yb), at(t1, dI, yb), at(t1, dI, yt), at(t0, dI, yt), IND(t0));
    // plinth
    stone.setGray(0.82);
    stone.quad(at(t0, dO + 0.25, ground), at(t1, dO + 0.25, ground), at(t1, dO + 0.25, 0.9), at(t0, dO + 0.25, 0.9), OUTD(t0));
    stone.quad(at(t0, dO, 0.9), at(t0, dO + 0.25, 0.9), at(t1, dO + 0.25, 0.9), at(t1, dO, 0.9), [0, 1, 0]);

    // curtain wall behind the piers
    const dg = -2.4;
    glass.quad(at(t0, dg, ground), at(t1, dg, ground), at(t1, dg, yb), at(t0, dg, yb), OUTD(t0));
    // floor slab edges visible through the openings
    for (const y of [5.2, 10.8, 16.4]) {
      slabs.setGray(0.86);
      slabs.quad(at(t0, dg + 0.06, y), at(t1, dg + 0.06, y), at(t1, dg + 0.06, y + 0.55), at(t0, dg + 0.06, y + 0.55), OUTD(t0));
    }
    // ceiling closing the gap between curtain wall and lintel
    stone.setGray(0.6);
    stone.quad(at(t0, dg, yb), at(t1, dg, yb), at(t1, dI, yb), at(t0, dI, yb), [0, -1, 0]);
  }

  const stoneMesh = new Mesh(stone.build(false), mats.stone);
  stoneMesh.name = 'facade-stone';
  stoneMesh.castShadow = true;
  stoneMesh.receiveShadow = true;
  const steelMesh = new Mesh(steel.build(false), mats.steelDark);
  steelMesh.name = 'facade-columns';
  steelMesh.castShadow = true;
  const glassMat = new MeshStandardMaterial({ color: 0x232c33, roughness: 0.08, metalness: 0.9, envMapIntensity: 1.1 });
  const glassMesh = new Mesh(glass.build(false), glassMat);
  glassMesh.name = 'facade-glass';
  glassMesh.receiveShadow = true;
  const slabMesh = new Mesh(slabs.build(false), mats.concrete);
  slabMesh.name = 'facade-slabs';
  group.add(stoneMesh, steelMesh, glassMesh, slabMesh);
  group.add(buildGates(layout));
  return group;
}

/** Entrance gates between piers: dark portal, canopy, numbered sign. */
function buildGates(layout: StadiumLayout): Group {
  const outer = layout.outer;
  const g = new Group();
  g.name = 'gates';
  const N = FACADE.columns;
  const portalMat = new MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.9 });
  const canopyMat = new MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.5, metalness: 0.4 });
  const frameMat = new MeshStandardMaterial({ color: 0xcfc6b2, roughness: 0.7 });
  // ten gates spread around, skipping the south-east end where Eski Açık stands
  const gaps = [3, 11, 19, 27, 34, 48, 55, 62, 70, 77];
  gaps.forEach((gap, k) => {
    const t = outer.tAtU(((gap + 1) % N) / N);
    const q = outer.offset(t, -2.3);
    const n = outer.normal(t);
    const holder = new Group();
    holder.position.set(q.x, 0, q.z);
    holder.lookAt(q.x + n.x, 0, q.z + n.z);
    const portal = new Mesh(new PlaneGeometry(4.0, 3.9), portalMat);
    portal.position.set(0, 1.65, 0.02);
    const frame = new Mesh(new BoxGeometry(4.6, 0.35, 0.5), frameMat);
    frame.position.set(0, 3.75, 0.2);
    const canopy = new Mesh(new BoxGeometry(5.2, 0.18, 2.8), canopyMat);
    canopy.position.set(0, 4.25, 1.3);
    canopy.castShadow = true;
    const sign = new Mesh(new PlaneGeometry(2.4, 0.62), new MeshStandardMaterial({ map: gateSign(k + 1), roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.0 }));
    sign.position.set(0, 4.75, 1.0);
    sign.userData.gateSign = true;
    holder.add(portal, frame, canopy, sign);
    g.add(holder);
  });
  return g;
}

function gateSign(n: number): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 40px "Barlow Condensed", "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`KAPI ${n}`, 128, 35);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function outerPointAt(layout: StadiumLayout, t: number, d: number): Vector3 {
  const q = layout.outer.offset(t, d);
  return new Vector3(q.x, 0, q.z);
}
