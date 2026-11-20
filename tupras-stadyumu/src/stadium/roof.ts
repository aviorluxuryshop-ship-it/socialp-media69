/**
 * Cable-spoke roof (Greisch / Bollinger+Grohmann): outer compression ring on 82
 * columns, radial girders, two inner tension rings forming a deep inner truss,
 * PTFE membrane bays arched between the radials, floodlights along the inner
 * edge, two hanging video screens.
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
  CanvasTexture,
  SRGBColorSpace,
  MeshBasicMaterial,
} from 'three';
import { GeoBuilder } from '../core/geo.ts';
import { FACADE, ROOF, ROOF_INNER_CURVE } from './config.ts';
import { waveAt, type StadiumLayout } from './layout.ts';
import type { StadiumMaterials } from './materials.ts';
import { Superellipse, TAU } from './shape.ts';

export interface RoofParts {
  group: Group;
  /** world-ish (stadium frame) positions of all floodlight fixtures */
  floodlights: Vector3[];
  innerCurve: Superellipse;
  ringHeight: (t: number) => number;
  innerTop: (t: number) => number;
}

export function buildRoof(layout: StadiumLayout, mats: StadiumMaterials): RoofParts {
  const group = new Group();
  group.name = 'roof';
  const outer = layout.outer;
  const inner = new Superellipse(ROOF_INNER_CURVE.a, ROOF_INNER_CURVE.b, ROOF_INNER_CURVE.p);
  const front = layout.front;

  // wave: the ring is highest mid-side / mid-end and dips at the corners
  const ringHeight = (t: number) => FACADE.ringY + (waveAt(front, t) - 0.55) * FACADE.ringWave * 2;
  const innerTop = (t: number) => ROOF.innerTopY + (waveAt(front, t) - 0.55) * 1.2;
  const innerBottom = (t: number) => ROOF.innerBottomY + (waveAt(front, t) - 0.55) * 0.8;

  const N = ROOF.radials;
  // radial stations evenly spaced along the outer ring
  const stations: number[] = [];
  for (let i = 0; i < N; i++) stations.push(outer.tAtU((i + 0.5) / N));
  // matching inner stations: same polar angle (radials point to the centre)
  const outerP = (t: number) => outer.offset(t, -0.9);
  const innerP = (t: number) => inner.point(t);

  // ---------------------------------------------------------- membrane
  const cols = N * 8;
  const rows = 16;
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= cols; i++) {
    const u = i / cols;
    const t = outer.tAtU(u);
    const bay = (u * N) % 1; // 0..1 across a bay (radials sit at 0.5 offset)
    const bayPhase = Math.abs(((bay + 0.5) % 1) - 0.5) * 2; // 0 at radial, 1 mid-bay
    const arch = Math.sin((bayPhase * Math.PI) / 2);
    const o = outerP(t);
    const ii = innerP(t);
    const yo = ringHeight(t) + 0.75;
    const yi = innerTop(t);
    for (let j = 0; j <= rows; j++) {
      const v = j / rows;
      const x = o.x + (ii.x - o.x) * v;
      const z = o.z + (ii.z - o.z) * v;
      // membrane spans between radials as shallow arches; the edge scallops inwards
      const lift = arch * (0.55 + 0.6 * Math.sin(v * Math.PI));
      const y = yo + (yi - yo) * v + lift;
      pos.push(x, y, z);
      const shade = 0.94 + arch * 0.06;
      col.push(shade, shade, shade);
      uv.push(u * 120, v * 12);
    }
  }
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j;
      const b = (i + 1) * (rows + 1) + j;
      // faces up (outer → inner is +v, around is +u)
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const mg = new BufferGeometry();
  mg.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  mg.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  mg.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  mg.setIndex(idx);
  mg.computeVertexNormals();
  // make sure the computed normals point up; flip winding if not
  {
    const n = mg.getAttribute('normal');
    let up = 0;
    for (let k = 0; k < n.count; k += 37) up += n.getY(k);
    if (up < 0) {
      for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
      mg.setIndex(idx);
      mg.computeVertexNormals();
    }
  }
  const top = new Mesh(mg, mats.membraneTop);
  top.name = 'membrane-top';
  top.castShadow = true;
  top.receiveShadow = true;
  const under = new Mesh(mg, mats.membraneUnder);
  under.name = 'membrane-under';
  under.receiveShadow = true;
  group.add(top, under);

  // ---------------------------------------------------------- steel
  const steel = new GeoBuilder();
  const dark = new GeoBuilder();
  const box = (g: GeoBuilder, a: Vector3, b: Vector3, w: number, h: number) => {
    // beam from a to b with width w (horizontal) and height h (vertical-ish)
    const dir = new Vector3().subVectors(b, a).normalize();
    const side = new Vector3().crossVectors(dir, new Vector3(0, 1, 0));
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize().multiplyScalar(w / 2);
    const up = new Vector3().crossVectors(side, dir).normalize().multiplyScalar(h / 2);
    const c = (p: Vector3, s: number, u: number) => [p.x + side.x * s + up.x * u, p.y + side.y * s + up.y * u, p.z + side.z * s + up.z * u];
    const a00 = c(a, -1, -1), a10 = c(a, 1, -1), a11 = c(a, 1, 1), a01 = c(a, -1, 1);
    const b00 = c(b, -1, -1), b10 = c(b, 1, -1), b11 = c(b, 1, 1), b01 = c(b, -1, 1);
    const U = [up.x, up.y, up.z], D = [-up.x, -up.y, -up.z], R = [side.x, side.y, side.z], L = [-side.x, -side.y, -side.z];
    g.quad(a01, a11, b11, b01, U);
    g.quad(a00, b00, b10, a10, D);
    g.quad(a10, b10, b11, a11, R);
    g.quad(a00, a01, b01, b00, L);
  };
  const ringTube = (g: GeoBuilder, curve: (t: number) => Vector3, w: number, h: number, segs = 328) => {
    for (let i = 0; i < segs; i++) {
      const t0 = (i / segs) * TAU;
      const t1 = ((i + 1) / segs) * TAU;
      box(g, curve(t0), curve(t1), w, h);
    }
  };
  // compression ring (dark grey, as in the street photos)
  dark.setGray(1);
  ringTube(dark, (t) => {
    const q = outer.offset(outer.tAtU(t / TAU), -0.9);
    const tt = outer.tAtU(t / TAU);
    return new Vector3(q.x, ringHeight(tt), q.z);
  }, FACADE.ringDepth, FACADE.ringHeight);
  // upper and lower tension rings
  steel.setGray(1);
  ringTube(steel, (t) => {
    const q = inner.point(t);
    return new Vector3(q.x, innerTop(t) - 0.2, q.z);
  }, 0.6, 0.6);
  ringTube(steel, (t) => {
    const q = inner.point(t);
    return new Vector3(q.x, innerBottom(t), q.z);
  }, 0.9, 0.9);

  const floodlights: Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const t = stations[i];
    const o = outerP(t);
    const ii = innerP(t);
    const yo = ringHeight(t);
    const A = new Vector3(o.x, yo, o.z);
    const B = new Vector3(ii.x, innerTop(t) - 0.2, ii.z);
    const Cb = new Vector3(ii.x, innerBottom(t), ii.z);
    // radial girder under the membrane
    steel.setGray(1);
    box(steel, A, B, 0.7, 1.1);
    // lower radial (cable/strut) from the ring base to the lower tension ring
    const A2 = new Vector3(o.x, yo - 1.4, o.z);
    box(steel, A2, Cb, 0.22, 0.22);
    // vertical strut of the inner truss
    box(steel, Cb, B, 0.5, 0.5);
    // diagonal bracing in the inner truss towards the next station
    const tn = stations[(i + 1) % N];
    const iin = innerP(tn);
    const Bn = new Vector3(iin.x, innerTop(tn) - 0.2, iin.z);
    box(steel, Cb, Bn, 0.25, 0.25);
    // posts between girder and lower radial (lens truss)
    for (const f of [0.33, 0.66]) {
      const top = A.clone().lerp(B, f);
      const bot = A2.clone().lerp(Cb, f);
      box(steel, bot, top, 0.18, 0.18);
    }
  }
  // floodlights: four fixtures per bay hung on the lower ring, aimed at the pitch
  const perBay = 4;
  for (let i = 0; i < N * perBay; i++) {
    const t = outer.tAtU((i + 0.5) / (N * perBay));
    const ii = innerP(t);
    floodlights.push(new Vector3(ii.x, innerBottom(t) - 0.55, ii.z));
  }
  const steelMesh = new Mesh(steel.build(false), mats.steelWhite);
  steelMesh.name = 'roof-steel';
  steelMesh.castShadow = true;
  steelMesh.receiveShadow = true;
  const darkMesh = new Mesh(dark.build(false), mats.steelDark);
  darkMesh.name = 'compression-ring';
  darkMesh.castShadow = true;
  group.add(steelMesh, darkMesh);

  // fixtures: dark housing + bright lens facing the pitch centre
  const housingGeo = new BoxGeometry(0.75, 0.55, 0.45);
  const lensGeo = new BoxGeometry(0.62, 0.42, 0.04);
  const housings = new InstancedMesh(housingGeo, mats.steelDark, floodlights.length);
  const lenses = new InstancedMesh(lensGeo, mats.floodlight, floodlights.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const one = new Vector3(1, 1, 1);
  floodlights.forEach((p, k) => {
    // aim at a point on the pitch on the far side of the centre
    const target = new Vector3(-p.x * 0.35, 0, -p.z * 0.35);
    const look = new Matrix4().lookAt(p, target, new Vector3(0, 1, 0));
    q.setFromRotationMatrix(look);
    m.compose(p, q, one);
    housings.setMatrixAt(k, m);
    const lp = p.clone().add(new Vector3().subVectors(target, p).normalize().multiplyScalar(0.24));
    m.compose(lp, q, one);
    lenses.setMatrixAt(k, m);
  });
  housings.computeBoundingSphere();
  lenses.computeBoundingSphere();
  housings.name = 'floodlight-housings';
  lenses.name = 'floodlight-lenses';
  group.add(housings, lenses);

  // ---------------------------------------------------------- video screens (12 × 8.3 m)
  const screenTex = screenTexture();
  const screenMat = new MeshBasicMaterial({ map: screenTex, toneMapped: true });
  for (const t of [Math.PI * 0.79, Math.PI * 0.21]) {
    // north-west and south-west corners, hung below the roof facing the centre
    const pIn = inner.point(t);
    const pOut = outer.point(t);
    const c = new Vector3(pIn.x + (pOut.x - pIn.x) * 0.28, 0, pIn.z + (pOut.z - pIn.z) * 0.28);
    c.y = innerBottom(t) - 1.2;
    const frame = new Mesh(new BoxGeometry(12.6, 8.9, 0.8), mats.dark);
    const face = new Mesh(new BoxGeometry(12, 8.3, 0.05), screenMat);
    const holder = new Group();
    holder.position.copy(c);
    holder.lookAt(0, c.y - 6, 0);
    face.position.z = 0.42;
    holder.add(frame, face);
    group.add(holder);
  }

  return { group, floodlights, innerCurve: inner, ringHeight, innerTop };
}

function screenTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 354;
  const g = c.getContext('2d')!;
  g.fillStyle = '#060606';
  g.fillRect(0, 0, c.width, c.height);
  // white / black halves like the match-day score graphic in the photos
  g.fillStyle = '#f4f4f4';
  g.fillRect(0, 0, c.width / 2, c.height);
  g.fillStyle = '#0b0b0b';
  g.font = '700 150px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('0', c.width * 0.25, c.height * 0.56);
  g.fillStyle = '#f4f4f4';
  g.fillText('0', c.width * 0.75, c.height * 0.56);
  g.font = '700 34px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.fillStyle = '#0b0b0b';
  g.fillText('BEŞİKTAŞ', c.width * 0.25, 50);
  g.fillStyle = '#f4f4f4';
  g.fillText('TÜPRAŞ STADYUMU', c.width * 0.75, 50);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
