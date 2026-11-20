/**
 * Eski Açık — the preserved 1947 İnönü Stadium stand at the south-east end:
 * a curved stone colonnade (today the BJK museum) between two stone towers,
 * with the historic iron gate between them. Footprint from OSM (way 489743779).
 */
import { BoxGeometry, CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, DoubleSide } from 'three';
import { GeoBuilder } from '../core/geo.ts';
import { OUTER_CURVE } from './config.ts';

/** clearance between the facade curve and the colonnade's back wall (m): outside the piers */
const OUTER_CURVE_GAP = 1.6;
import type { StadiumMaterials } from './materials.ts';

type V3 = [number, number, number];

/** footprint ring (x,z pairs) in the stadium frame */
export function buildEskiAcik(footprint: number[], mats: StadiumMaterials): Group {
  const group = new Group();
  group.name = 'eski-acik';
  // the OSM ring is a crescent: split it into its outer and inner arcs
  const pts: [number, number][] = [];
  for (let i = 0; i < footprint.length; i += 2) pts.push([footprint[i], footprint[i + 1]]);
  // the colonnade wraps the stadium's south-east end: it follows the facade's
  // footprint (OUTER_CURVE) right outside the piers, over the z span of the OSM
  // crescent, so it reads as part of the stadium rather than a free wall
  const zs = pts.map((p) => p[1]);
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  const zMid = (zMin + zMax) / 2;
  const half = Math.min((zMax - zMin) / 2, OUTER_CURVE.b * 0.62);
  const depth = 9;
  const gap = OUTER_CURVE_GAP;
  const height = 10.5;
  const { a: ca, b: cb, p: cp } = OUTER_CURVE;
  /** point on the facade curve at u ∈ [−1, 1] across the crescent, with its outward normal */
  const C = (u: number) => {
    const z = zMid + u * half;
    const x = ca * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / cb, cp)), 1 / cp);
    const nx = (cp / ca) * Math.pow(x / ca, cp - 1);
    const nz = (cp / cb) * Math.pow(Math.abs(z) / cb, cp - 1) * Math.sign(z);
    const l = Math.hypot(nx, nz) || 1;
    return { x, z, nx: nx / l, nz: nz / l };
  };
  const P = (u: number, off: number, y: number): V3 => {
    const c = C(u);
    return [c.x + c.nx * off, y, c.z + c.nz * off];
  };
  const N = (u: number, sgn = 1): V3 => {
    const c = C(u);
    return [c.nx * sgn, 0, c.nz * sgn];
  };
  const g = new GeoBuilder();
  g.uvScale = 5;
  const segs = 40;
  const ri = gap;
  const ro = gap + depth;
  // back wall against the facade, top and the outer colonnade
  for (let i = 0; i < segs; i++) {
    const a0 = -1 + (2 * i) / segs;
    const a1 = -1 + (2 * (i + 1)) / segs;
    g.setGray(1);
    // outer colonnade wall, with a plinth and cornice
    g.quad(P(a0, ro, 0), P(a1, ro, 0), P(a1, ro, height), P(a0, ro, height), N(a0));
    g.setGray(0.96);
    g.quad(P(a0, ri, height - 0.6), P(a1, ri, height - 0.6), P(a1, ro, height), P(a0, ro, height), [0, 1, 0]);
    // cornice lip
    g.setGray(1.05);
    g.quad(P(a0, ro + 0.45, height - 0.5), P(a1, ro + 0.45, height - 0.5), P(a1, ro + 0.45, height + 0.15), P(a0, ro + 0.45, height + 0.15), N(a0));
    g.quad(P(a0, ro, height + 0.15), P(a1, ro, height + 0.15), P(a1, ro + 0.45, height + 0.15), P(a0, ro + 0.45, height + 0.15), [0, 1, 0]);
    // tall arched openings between pilasters: dark recessed panels
    const am = (a0 + a1) / 2;
    const w = (a1 - a0) * 0.32;
    g.setGray(0.22);
    g.quad(P(am - w, ro + 0.02, 1.2), P(am + w, ro + 0.02, 1.2), P(am + w, ro + 0.02, height - 2.2), P(am - w, ro + 0.02, height - 2.2), N(am));
  }
  // end walls joining the towers
  for (const u of [-1, 1]) {
    const n = C(u);
    const side: V3 = [-n.nz * u, 0, n.nx * u];
    g.setGray(0.92);
    g.quad(P(u, ri, 0), P(u, ro, 0), P(u, ro, height), P(u, ri, height - 0.6), side);
  }
  const body = new Mesh(g.build(false), mats.stone);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // towers at both ends (≈ 8 × 8 × 19 m, slit windows, cornice)
  const towerMat = mats.stonePlain;
  const slitMat = new MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const u = s * 1.04;
    const p = P(u, gap + depth / 2, 0);
    const n = C(u);
    const tower = new Group();
    const body = new Mesh(new BoxGeometry(8.2, 19, 8.2), towerMat);
    body.position.y = 9.5;
    const cap = new Mesh(new BoxGeometry(8.9, 0.7, 8.9), towerMat);
    cap.position.y = 19.2;
    const cap2 = new Mesh(new BoxGeometry(7.6, 1.0, 7.6), towerMat);
    cap2.position.y = 20.0;
    tower.add(body, cap, cap2);
    for (let k = 0; k < 4; k++) {
      const slit = new Mesh(new PlaneGeometry(0.55, 1.1), slitMat);
      slit.position.set(0, 4 + k * 3.6, 4.12);
      tower.add(slit);
      const slit2 = slit.clone();
      slit2.position.z = -4.12;
      slit2.rotation.y = Math.PI;
      tower.add(slit2);
      const slit3 = slit.clone();
      slit3.position.set(4.12, 4 + k * 3.6, 0);
      slit3.rotation.y = Math.PI / 2;
      tower.add(slit3);
    }
    tower.position.set(p[0], 0, p[2]);
    tower.rotation.y = -Math.atan2(n.nz, n.nx);
    tower.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    group.add(tower);
  }

  // historic iron gate at the centre of the arc
  const gateMat = new MeshStandardMaterial({ color: 0x15161a, roughness: 0.35, metalness: 0.75 });
  const gp = P(0, ro + 0.6, 0);
  const gate = new Group();
  for (const s of [-1, 1]) {
    const pier = new Mesh(new BoxGeometry(1.4, 6.5, 1.4), towerMat);
    pier.position.set(0, 3.25, s * 4.2);
    gate.add(pier);
  }
  for (let k = -3.4; k <= 3.4; k += 0.32) {
    const bar = new Mesh(new BoxGeometry(0.05, 4.8, 0.05), gateMat);
    bar.position.set(0, 2.4, k);
    gate.add(bar);
  }
  const rail = new Mesh(new BoxGeometry(0.08, 0.12, 7.0), gateMat);
  rail.position.set(0, 4.7, 0);
  gate.add(rail);
  gate.position.set(gp[0], 0, gp[2]);
  group.add(gate);

  // the "Beşiktaş JK" wordmark letters on the plaza (seen in the entrance photo)
  const sign = wordmarkSign();
  // on the plaza in front of the south tower, facing Dolmabahçe Caddesi
  const sp = P(-0.92, ro + 16, 0);
  sign.position.set(sp[0], 0, sp[2]);
  sign.rotation.y = Math.PI / 2 - 0.25;
  group.add(sign);
  return group;
}

function wordmarkSign(): Group {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 200px "Inter", "Helvetica Neue", Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('Beşiktaş JK', c.width / 2, c.height / 2 + 6);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const mat = new MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: DoubleSide, roughness: 0.4 });
  const g = new Group();
  const letters = new Mesh(new PlaneGeometry(14, 3.5), mat);
  letters.position.y = 2.25;
  letters.castShadow = true;
  const plinth = new Mesh(new BoxGeometry(14.5, 0.5, 1.2), new MeshStandardMaterial({ color: 0x111214, roughness: 0.6 }));
  plinth.position.y = 0.25;
  g.add(letters, plinth);
  return g;
}
