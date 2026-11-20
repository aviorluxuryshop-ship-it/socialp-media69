/**
 * Playing surface and pitch furniture: striped grass with markings, goals with
 * nets, corner flags, LED perimeter boards, dugouts on the west side.
 */
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
} from 'three';
import { PITCH } from './config.ts';
import type { StadiumMaterials } from './materials.ts';
import { boardTexture } from '../core/textures.ts';

export function buildPitch(mats: StadiumMaterials): Group {
  const group = new Group();
  group.name = 'pitch';
  const grass = new Mesh(new PlaneGeometry(PITCH.grassHalfX * 2, PITCH.grassHalfZ * 2), mats.grass);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  grass.name = 'grass';
  group.add(grass);

  const white = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 });
  // goals: 7.32 × 2.44, posts Ø12 cm, nets 2 m deep
  for (const s of [-1, 1]) {
    const goal = new Group();
    const x = s * (PITCH.length / 2);
    const post = new CylinderGeometry(0.06, 0.06, 2.44, 12);
    for (const z of [-3.66, 3.66]) {
      const p = new Mesh(post, white);
      p.position.set(x + s * 0.06, 1.22, z);
      p.castShadow = true;
      goal.add(p);
    }
    const bar = new Mesh(new CylinderGeometry(0.06, 0.06, 7.44, 12), white);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x + s * 0.06, 2.44, 0);
    bar.castShadow = true;
    goal.add(bar);
    // net: top, back, sides
    const net = mats.netting;
    const top = new Mesh(new PlaneGeometry(2.0, 7.32), net);
    top.rotation.set(-Math.PI / 2, 0, 0);
    top.position.set(x + s * 1.06, 2.3, 0);
    const back = new Mesh(new PlaneGeometry(7.32, 2.3), net);
    back.rotation.y = Math.PI / 2;
    back.position.set(x + s * 2.06, 1.15, 0);
    goal.add(top, back);
    for (const z of [-3.66, 3.66]) {
      const side = new Mesh(new PlaneGeometry(2.0, 2.4), net);
      side.position.set(x + s * 1.06, 1.2, z);
      goal.add(side);
    }
    group.add(goal);
  }

  // corner flags
  const flagMat = new MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  const flagCloth = new MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8, side: 2 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pole = new Mesh(new CylinderGeometry(0.02, 0.02, 1.5, 6), flagMat);
      pole.position.set((sx * PITCH.length) / 2, 0.75, (sz * PITCH.width) / 2);
      const cloth = new Mesh(new PlaneGeometry(0.45, 0.35), flagCloth);
      cloth.position.set((sx * PITCH.length) / 2 + 0.22 * -sx, 1.32, (sz * PITCH.width) / 2);
      group.add(pole, cloth);
    }
  }

  // LED perimeter boards
  const tex = boardTexture();
  const boardMat = mats.boards;
  const boardBack = new MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.7 });
  const addBoard = (cx: number, cz: number, len: number, rotY: number, repeat: number) => {
    const t = tex.clone();
    t.wrapS = RepeatWrapping;
    t.repeat.set(repeat, 1);
    t.needsUpdate = true;
    const g = new Group();
    const body = new Mesh(new BoxGeometry(len, 0.9, 0.35), boardBack);
    body.position.y = 0.45;
    body.castShadow = true;
    const face = new Mesh(new PlaneGeometry(len, 0.8), boardMat.clone());
    (face.material as typeof boardMat).map = t;
    face.position.set(0, 0.47, 0.18);
    g.add(body, face);
    g.position.set(cx, 0, cz);
    g.rotation.y = rotY;
    group.add(g);
  };
  const zb = PITCH.width / 2 + 4.2;
  const xb = PITCH.length / 2 + 4.6;
  // touchline boards (face the pitch), leaving a gap at the halfway line on the west side
  addBoard(-27, zb, 50, Math.PI, 6);
  addBoard(27, zb, 50, Math.PI, 6);
  addBoard(0, -zb, 108, 0, 12);
  // behind the goals, angled at the corners
  for (const s of [-1, 1]) {
    addBoard(s * xb, -20, 26, (-s * Math.PI) / 2, 3);
    addBoard(s * xb, 20, 26, (-s * Math.PI) / 2, 3);
  }

  // dugouts (west side, either side of the halfway line)
  const shellMat = new MeshStandardMaterial({ color: 0x0e0f11, roughness: 0.4, metalness: 0.2 });
  const roofMat = new MeshStandardMaterial({ color: 0x9fb3c0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 });
  for (const s of [-1, 1]) {
    const d = new Group();
    const base = new Mesh(new BoxGeometry(14, 0.5, 2.2), shellMat);
    base.position.y = 0.25;
    const back = new Mesh(new BoxGeometry(14, 2.0, 0.12), shellMat);
    back.position.set(0, 1.0, 1.05);
    const roof = new Mesh(new BoxGeometry(14, 0.06, 2.4), roofMat);
    roof.position.set(0, 2.05, -0.05);
    roof.rotation.x = -0.08;
    const seats = new Mesh(new BoxGeometry(13.4, 0.45, 0.6), new MeshStandardMaterial({ color: 0xe9e9e9, roughness: 0.5 }));
    seats.position.set(0, 0.72, 0.6);
    d.add(base, back, roof, seats);
    for (const c of [d, base, back, seats]) c.castShadow = true;
    d.position.set(s * 12, 0, PITCH.width / 2 + 2.6);
    group.add(d);
  }
  return group;
}
