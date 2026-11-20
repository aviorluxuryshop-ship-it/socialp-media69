/**
 * Landmarks that need more than an extruded footprint: Dolmabahçe Clock Tower,
 * the Muayede Salonu dome, the second minaret of Dolmabahçe Mosque, the Süzer
 * Plaza crown and the 15 Temmuz Şehitler (Bosphorus) Bridge. Positions are
 * from OSM (see world.json → landmarks).
 */
import {
  BufferAttribute,
  BufferGeometry,
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  ConeGeometry,
} from 'three';
import type { World } from './data.ts';
import { addMinaret, type Buf } from './buildings.ts';

export interface LandmarksHandle {
  group: Group;
  update(time: number, night: number): void;
}

export function buildLandmarks(world: World): LandmarksHandle {
  const group = new Group();
  group.name = 'landmarks';
  const L = world.json.landmarks;
  const marble = new MeshStandardMaterial({ color: 0xf0ebe1, roughness: 0.55 });
  const lead = new MeshStandardMaterial({ color: 0x7f878d, roughness: 0.45, metalness: 0.4 });
  const gold = new MeshStandardMaterial({ color: 0xc9a54a, roughness: 0.35, metalness: 0.9 });

  // ---------------------------------------------------------- Dolmabahçe Clock Tower (27 m)
  {
    const [x, z] = L.clockTower.p as number[];
    const y = world.heightAt(x, z) - 0.3;
    const t = new Group();
    const tiers: [number, number, number][] = [
      [7.4, 0, 3.0],
      [6.2, 3.0, 7.0],
      [5.4, 10.0, 6.0],
      [4.6, 16.0, 5.0],
      [3.8, 21.0, 3.0],
    ];
    for (const [w, y0, h] of tiers) {
      const body = new Mesh(new BoxGeometry(w, h, w), marble);
      body.position.y = y0 + h / 2;
      const cornice = new Mesh(new BoxGeometry(w + 0.5, 0.35, w + 0.5), marble);
      cornice.position.y = y0 + h;
      t.add(body, cornice);
    }
    // clock faces
    const face = new MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.3, emissive: new Color(0xfff2d0), emissiveIntensity: 0 });
    const faceGeo = new CylinderGeometry(1.1, 1.1, 0.1, 24).rotateX(Math.PI / 2);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const f = new Mesh(faceGeo, face);
      f.position.set(Math.sin(a) * 2.75, 18.4, Math.cos(a) * 2.75);
      f.lookAt(Math.sin(a) * 10, 18.4, Math.cos(a) * 10);
      t.add(f);
    }
    const dome = new Mesh(new SphereGeometry(1.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), lead);
    dome.position.y = 24;
    const finial = new Mesh(new ConeGeometry(0.25, 2.4, 8), gold);
    finial.position.y = 26.6;
    t.add(dome, finial);
    t.position.set(x, y, z);
    t.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    t.userData.clockFace = face;
    group.add(t);
  }

  // ---------------------------------------------------------- Muayede Salonu dome (ceremonial hall, ~36 m)
  {
    const [x, z] = L.muayedeSalonu.p as number[];
    const y = world.heightAt(x, z) + 27;
    const drum = new Mesh(new CylinderGeometry(13.5, 13.5, 3.2, 40), marble);
    drum.position.set(x, y + 1.6, z);
    const dome = new Mesh(new SphereGeometry(13.2, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), lead);
    dome.scale.y = 0.62;
    dome.position.set(x, y + 3.2, z);
    const lantern = new Mesh(new CylinderGeometry(1.4, 1.6, 2.4, 12), marble);
    lantern.position.set(x, y + 3.2 + 13.2 * 0.62 + 1.0, z);
    for (const m of [drum, dome, lantern]) {
      m.castShadow = true;
      group.add(m);
    }
  }

  // ---------------------------------------------------------- Dolmabahçe Mosque: second minaret + dome lantern
  {
    const r = L.dolmabahceMosque.r as number[];
    const b: Buf = { pos: [], nor: [], col: [], info: [], fac: [], idx: [] };
    const x = r[2], z = r[3];
    addMinaret(b, x, world.heightAt(x, z) + 14, z, 30, 1.0, new Color('#e2dccf'), 0.5);
    group.add(meshFromBuf(b, marble));
  }

  // ---------------------------------------------------------- Süzer Plaza crown
  {
    const [x, z] = L.suzerPlaza.p as number[];
    // the tower stands on a slope: its extrusion starts at the lowest footprint point
    let base = world.heightAt(x, z);
    for (let k = 0; k < 12; k++) base = Math.min(base, world.heightAt(x + Math.cos(k * 0.5236) * 24, z + Math.sin(k * 0.5236) * 24));
    const y = base + 148;
    const crown = new Mesh(new ConeGeometry(15, 16, 4, 1), new MeshStandardMaterial({ color: 0x8aa0b4, roughness: 0.1, metalness: 0.85 }));
    crown.rotation.y = Math.PI / 4;
    crown.position.set(x, y + 8, z);
    const mast = new Mesh(new CylinderGeometry(0.4, 0.6, 14, 8), lead);
    mast.position.set(x, y + 22, z);
    group.add(crown, mast);
  }

  // ---------------------------------------------------------- 15 Temmuz Şehitler Köprüsü
  const bridge = buildBridge(world);
  group.add(bridge.group);

  return {
    group,
    update(time: number, night: number) {
      bridge.update(time, night);
      group.traverse((o) => {
        const f = o.userData.clockFace as MeshStandardMaterial | undefined;
        if (f) f.emissiveIntensity = night * 1.4;
      });
    },
  };
}

function meshFromBuf(b: Buf, mat: MeshStandardMaterial): Mesh {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(b.pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(b.nor), 3));
  g.setIndex(b.idx);
  const m = new Mesh(g, mat);
  m.castShadow = true;
  return m;
}

function buildBridge(world: World): { group: Group; update(time: number, night: number): void } {
  const L = world.json.landmarks.bridge;
  const [ax, az] = L.a as number[];
  const [bx, bz] = L.b as number[];
  const deckY = L.deck as number;
  const towerH = L.tower as number;
  const group = new Group();
  group.name = 'bosphorus-bridge';
  const len = Math.hypot(bx - ax, bz - az);
  const dirX = (bx - ax) / len, dirZ = (bz - az) / len;
  const sideX = -dirZ, sideZ = dirX;
  const P = (s: number, off: number, y: number): [number, number, number] => [ax + dirX * s + sideX * off, y, az + dirZ * s + sideZ * off];
  const steel = new MeshStandardMaterial({ color: 0xd9dcdd, roughness: 0.5, metalness: 0.4 });
  const halfW = 16.5;
  // deck
  const deck = new Mesh(new BoxGeometry(len, 3.2, halfW * 2), steel);
  deck.position.set((ax + bx) / 2, deckY, (az + bz) / 2);
  deck.rotation.y = -Math.atan2(dirZ, dirX);
  group.add(deck);
  // towers 243 m in from each end (main span 1074 m)
  const towerS = [243, len - 243];
  for (const s of towerS) {
    for (const off of [-halfW - 1, halfW + 1]) {
      const [x, , z] = P(s, off, 0);
      const leg = new Mesh(new BoxGeometry(5, towerH, 7), steel);
      leg.position.set(x, towerH / 2, z);
      leg.rotation.y = deck.rotation.y;
      group.add(leg);
    }
    for (const y of [deckY - 6, 110, towerH - 3]) {
      const [x, , z] = P(s, 0, 0);
      const beam = new Mesh(new BoxGeometry(5, 4, halfW * 2 + 4), steel);
      beam.position.set(x, y, z);
      beam.rotation.y = deck.rotation.y;
      group.add(beam);
    }
  }
  // main cables (catenary-ish parabola) + inclined hangers, as line segments
  const pts: number[] = [];
  const hang: number[] = [];
  const cableY = (s: number) => {
    const [t0, t1] = towerS;
    if (s < t0) return deckY + 2 + (towerH - deckY - 2) * (s / t0);
    if (s > t1) return deckY + 2 + (towerH - deckY - 2) * ((len - s) / (len - t1));
    const u = (s - t0) / (t1 - t0);
    const sag = towerH - (deckY + 5);
    return towerH - sag * (1 - Math.pow(2 * u - 1, 2));
  };
  for (const off of [-halfW, halfW]) {
    const step = 12;
    for (let s = 0; s < len; s += step) {
      const a = P(s, off, cableY(s));
      const b = P(Math.min(len, s + step), off, cableY(Math.min(len, s + step)));
      pts.push(...a, ...b);
    }
    for (let s = towerS[0] + 18; s < towerS[1]; s += 18) {
      // Bosphorus Bridge hangers are inclined (alternating)
      const k = Math.round(s / 18) % 2 ? 1 : -1;
      hang.push(...P(s, off, cableY(s)), ...P(s + k * 9, off, deckY + 1.6));
    }
  }
  const cableGeo = new BufferGeometry();
  cableGeo.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
  const cableMat = new LineBasicMaterial({ color: 0xcfd3d6 });
  const cables = new LineSegments(cableGeo, cableMat);
  const hangGeo = new BufferGeometry();
  hangGeo.setAttribute('position', new BufferAttribute(new Float32Array(hang), 3));
  const hangMat = new LineBasicMaterial({ color: 0xb8bcbf, transparent: true, opacity: 0.8 });
  const hangers = new LineSegments(hangGeo, hangMat);
  group.add(cables, hangers);
  const day = new Color(0xcfd3d6);
  const c = new Color();
  return {
    group,
    update(time: number, night: number) {
      // the bridge's LED façade cycles slowly through colours at night
      c.setHSL((time * 0.02) % 1, 0.75, 0.6);
      cableMat.color.copy(day).lerp(c.multiplyScalar(2.2), night);
      hangMat.color.copy(day).lerp(c, night);
    },
  };
}
