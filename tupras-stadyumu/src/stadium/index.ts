import { Group, Mesh, type Material } from 'three';
import { PITCH_ELEVATION } from './config.ts';
import { buildLayout, type StadiumLayout } from './layout.ts';
import { StadiumMaterials } from './materials.ts';
import { buildBowl } from './bowl.ts';
import { SeatSystem } from './seats.ts';
import { buildRoof, type RoofParts } from './roof.ts';
import { buildFacade } from './facade.ts';
import { buildPitch } from './pitch.ts';
import { buildEskiAcik } from './eskiAcik.ts';

export interface Stadium {
  group: Group;
  layout: StadiumLayout;
  materials: StadiumMaterials;
  seats: SeatSystem;
  roof: RoofParts;
  /** meshes with a per-vertex blockId attribute (terraces) */
  blockMeshes: Mesh[];
  stats: { triangles: number; meshes: number };
}

export function buildStadium(eskiAcikFootprint: number[]): Stadium {
  const layout = buildLayout();
  const materials = new StadiumMaterials();
  const group = new Group();
  group.name = 'stadium';
  group.position.y = PITCH_ELEVATION;

  const bowl = buildBowl(layout, materials);
  const seats = new SeatSystem(layout, materials);
  const roof = buildRoof(layout, materials);
  const facade = buildFacade(layout, materials, roof.ringHeight);
  const pitch = buildPitch(materials);
  const eski = buildEskiAcik(eskiAcikFootprint, materials);
  group.add(bowl.group, seats.group, roof.group, facade, pitch, eski);

  let triangles = 0;
  let meshes = 0;
  group.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    meshes++;
    const g = m.geometry;
    const n = g.index ? g.index.count : g.getAttribute('position').count;
    const inst = (m as unknown as { count?: number }).count ?? 1;
    triangles += (n / 3) * ((m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh ? inst : 1);
  });
  void (null as unknown as Material);
  return { group, layout, materials, seats, roof, blockMeshes: bowl.blockMeshes, stats: { triangles: Math.round(triangles), meshes } };
}
