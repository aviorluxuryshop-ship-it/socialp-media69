import * as THREE from 'three';
import { LAYOUT, SECTIONS, STAND_PIECES } from '../data/sections.js';
import {
  pathSamples, loft, stairs, resample, LOOP_PIECES,
  seatTexture, pitchTexture, facadeTexture, archTexture, locaTexture, roofTexture, glowTexture,
} from './geometry.js';

// Tribün renk tonları (grafit; hafif farklar)
const SECTION_COLORS = {
  'kuzey-alt': 0x9aa0ac, 'kuzey-ust': 0xb4bac6,
  'guney-alt': 0x9aa0ac, 'guney-ust': 0xb4bac6,
  'dogu-alt': 0xa2a8b4, 'dogu-ust': 0xbcc2ce,
  'bati-alt': 0xa2a8b4, 'bati-ust': 0xbcc2ce,
  'bati-loca': 0xffffff,
};

export function buildStadium(quality) {
  const arc = quality.arcSegments;
  const { tiers, facade, roof } = LAYOUT;
  const root = new THREE.Group();
  root.name = 'stadium';

  const sections = new Map();      // id -> Object3D (Group)
  const nightMats = [];            // gece parlayan malzemeler { mat, max }
  const sectionsGroup = new THREE.Group(); sectionsGroup.name = 'sections';
  const structure = new THREE.Group(); structure.name = 'structure';
  root.add(sectionsGroup, structure);

  const standSamples = {};
  for (const [stand, pieces] of Object.entries(STAND_PIECES)) standSamples[stand] = pathSamples(pieces, arc);
  const loopSamples = pathSamples(LOOP_PIECES, arc);
  // kapalı çevre: ilk noktayı sona ekle
  loopSamples.push({ ...loopSamples[0] });

  // ---- Tribünler (her biri ayrı mesh) ----
  const seatAlt = seatTexture(LAYOUT.rowRise / (LAYOUT.rowRise + (tiers.alt.d1 - tiers.alt.d0) / Math.round((tiers.alt.y1 - tiers.alt.y0) / LAYOUT.rowRise)));
  const seatUst = seatTexture(LAYOUT.rowRise / (LAYOUT.rowRise + (tiers.ust.d1 - tiers.ust.d0) / Math.round((tiers.ust.y1 - tiers.ust.y0) / LAYOUT.rowRise)));
  const locaMap = locaTexture(false), locaEmi = locaTexture(true);

  const concrete = new THREE.MeshLambertMaterial({ color: 0x5a5d64, side: THREE.DoubleSide });

  for (const def of SECTIONS) {
    const s = standSamples[def.stand];
    const group = new THREE.Group();
    group.name = def.id;
    group.userData = { sectionId: def.id, def };
    let geo, mat;
    if (def.tier === 'koridor') {
      // loca bandı: cam cephe + üst kapak
      const t = tiers.koridor;
      geo = loft(s, [[t.d0, t.y0], [t.d0, t.y1], [t.d1, t.y1]], { uScale: 8, vLen: t.y1 - t.y0 });
      mat = new THREE.MeshLambertMaterial({
        map: locaMap, emissiveMap: locaEmi, emissive: 0xffffff, color: 0xffffff, side: THREE.DoubleSide,
      });
      mat.emissiveIntensity = 0;
      nightMats.push({ mat, max: 0.9, prop: 'emissiveIntensity' });
    } else {
      const t = tiers[def.tier];
      const st = stairs(t.d0, t.y0, t.d1, t.y1);
      let profile = st.pts;
      if (def.tier === 'ust') profile = [...profile, [facade.d, t.y1]]; // arka yürüme yolu
      geo = loft(s, profile, { uScale: 4.4, vLen: st.dd + st.dy });
      mat = new THREE.MeshLambertMaterial({
        map: def.tier === 'alt' ? seatAlt : seatUst,
        color: SECTION_COLORS[def.id],
        side: THREE.DoubleSide,
      });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = def.id + '-mesh';
    mesh.receiveShadow = true;
    mesh.userData.sectionId = def.id;
    group.add(mesh);
    sections.set(def.id, group);
    sectionsGroup.add(group);
  }

  // Alt/üst arasındaki koridor bandı (Batı hariç: orada loca var) + reklam panosu halkası
  for (const stand of ['kuzey', 'dogu', 'guney']) {
    const t = tiers.koridor;
    const m = new THREE.Mesh(loft(standSamples[stand], [[t.d0, t.y0], [t.d0, t.y1], [t.d1, t.y1]]), concrete);
    m.name = 'koridor-' + stand; m.receiveShadow = true;
    structure.add(m);
  }
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide });
  const board = new THREE.Mesh(loft(loopSamples, [[4.8, 0], [4.8, 1.2], [5.2, 1.2]]), boardMat);
  board.name = 'reklam-panosu';
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8, side: THREE.DoubleSide });
  const boardTrim = new THREE.Mesh(loft(loopSamples, [[4.78, 1.0], [4.78, 1.1]]), goldMat);
  structure.add(board, boardTrim);

  // ---- Dış cephe ----
  const facadeGroup = new THREE.Group(); facadeGroup.name = 'facade';
  const facadeMat = new THREE.MeshLambertMaterial({ map: facadeTexture(), side: THREE.DoubleSide });
  const wall = new THREE.Mesh(loft(loopSamples, [[facade.d, 0], [facade.d, facade.h]], { uScale: 6, vLen: facade.h }), facadeMat);
  wall.name = 'facade-wall'; wall.receiveShadow = true; wall.castShadow = true;
  facadeGroup.add(wall);
  // altın şerit (çatı kenarında)
  const trim = new THREE.Mesh(loft(loopSamples, [[facade.d + 0.45, facade.h - 1.2], [facade.d + 0.45, facade.h - 0.6]]), goldMat);
  trim.name = 'facade-trim';
  facadeGroup.add(trim);

  // dikey kolonlar (instanced)
  const cols = resample(loopSamples, facade.d + 0.55, 6);
  const colGeo = new THREE.BoxGeometry(1.1, facade.h - 0.8, 1.2);
  const colMat = new THREE.MeshLambertMaterial({ color: 0xeeebe4 });
  const colMesh = new THREE.InstancedMesh(colGeo, colMat, cols.length);
  colMesh.name = 'facade-columns'; colMesh.castShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  cols.forEach((c, i) => {
    q.setFromAxisAngle(up, Math.atan2(c.nx, c.nz));
    m4.compose(new THREE.Vector3(c.x, (facade.h - 0.8) / 2, c.z), q, one);
    colMesh.setMatrixAt(i, m4);
  });
  facadeGroup.add(colMesh);

  // Doğu cephesinde tarihi kemerli yüzey
  const { a, b, r } = LAYOUT.bowl;
  const archLen = 2 * (b - r) - 4;
  const archH = 22;
  const archMap = archTexture(false), archEmi = archTexture(true);
  const bays = Math.round(archLen / 5.8);
  archMap.repeat.set(bays, 1); archEmi.repeat.set(bays, 1);
  const archMat = new THREE.MeshLambertMaterial({ map: archMap, emissiveMap: archEmi, emissive: 0xffffff });
  archMat.emissiveIntensity = 0;
  nightMats.push({ mat: archMat, max: 0.85, prop: 'emissiveIntensity' });
  const archWall = new THREE.Mesh(new THREE.PlaneGeometry(archLen, archH), archMat);
  archWall.name = 'facade-historic-arches';
  archWall.rotation.y = Math.PI / 2;
  archWall.position.set(a + facade.d + 0.9, archH / 2, 0);
  facadeGroup.add(archWall);
  const archCap = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, archLen), goldMat);
  archCap.position.set(a + facade.d + 0.9, archH + 0.2, 0);
  facadeGroup.add(archCap);
  structure.add(facadeGroup);

  // ---- Çatı halkası ----
  const roofGroup = new THREE.Group(); roofGroup.name = 'roof';
  const rt = roofTexture();
  const roofMat = new THREE.MeshLambertMaterial({
    map: rt, color: 0xf2f4f7, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false,
  });
  const roofSpan = Math.hypot(roof.dOut - roof.dIn, roof.yOut - roof.yIn);
  const membrane = new THREE.Mesh(loft(loopSamples, [[roof.dIn, roof.yIn], [roof.dOut, roof.yOut]], { uScale: 8, vLen: roofSpan }), roofMat);
  membrane.name = 'roof-membrane'; membrane.renderOrder = 2;
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.45, metalness: 0.7, side: THREE.DoubleSide });
  const w = 0.35;
  const inner = new THREE.Mesh(loft(loopSamples, [
    [roof.dIn - w, roof.yIn - 0.5], [roof.dIn + w, roof.yIn - 0.5], [roof.dIn + w, roof.yIn + 0.5],
    [roof.dIn - w, roof.yIn + 0.5], [roof.dIn - w, roof.yIn - 0.5],
  ]), steelMat);
  inner.name = 'roof-inner-ring'; inner.castShadow = true;
  const outer = new THREE.Mesh(loft(loopSamples, [
    [roof.dOut - 0.6, roof.yOut - 0.9], [roof.dOut + 0.6, roof.yOut - 0.9], [roof.dOut + 0.6, roof.yOut + 0.4],
    [roof.dOut - 0.6, roof.yOut + 0.4], [roof.dOut - 0.6, roof.yOut - 0.9],
  ]), steelMat);
  outer.name = 'roof-outer-ring';
  roofGroup.add(membrane, inner, outer);
  structure.add(roofGroup);

  // ---- Saha ----
  const pitchGroup = new THREE.Group(); pitchGroup.name = 'pitch';
  const pitchMat = new THREE.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95, metalness: 0, emissive: 0x2fae44, emissiveIntensity: 0 });
  nightMats.push({ mat: pitchMat, max: 0.38, prop: 'emissiveIntensity' });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(LAYOUT.pitch.width, LAYOUT.pitch.length), pitchMat);
  pitch.rotation.x = -Math.PI / 2; pitch.position.y = 0.45; pitch.name = 'pitch-surface'; pitch.receiveShadow = true;
  const apronMat = new THREE.MeshLambertMaterial({ color: 0x2a6532, emissive: 0x1d7a2e, emissiveIntensity: 0 });
  nightMats.push({ mat: apronMat, max: 0.25, prop: 'emissiveIntensity' });
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(76, 113), apronMat);
  apron.rotation.x = -Math.PI / 2; apron.position.y = 0.3; apron.receiveShadow = true; apron.name = 'pitch-apron';
  pitchGroup.add(apron, pitch);
  // kaleler
  const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  for (const sgn of [-1, 1]) {
    const gz = sgn * LAYOUT.pitch.length / 2;
    const g = new THREE.Group(); g.position.z = gz;
    const post = new THREE.BoxGeometry(0.16, 2.44, 0.16), bar = new THREE.BoxGeometry(7.32, 0.16, 0.16);
    for (const px of [-3.66, 3.66]) { const p = new THREE.Mesh(post, goalMat); p.position.set(px, 1.22, 0); g.add(p); }
    const cb = new THREE.Mesh(bar, goalMat); cb.position.set(0, 2.44, 0); g.add(cb);
    pitchGroup.add(g);
  }
  root.add(pitchGroup);

  // ---- Işık kuleleri ----
  const towers = new THREE.Group(); towers.name = 'light-towers';
  const headMat = new THREE.MeshStandardMaterial({ color: 0x222428, emissive: 0xfff1cf, emissiveIntensity: 0.05, roughness: 0.5 });
  nightMats.push({ mat: headMat, max: 3.2, base: 0.05, prop: 'emissiveIntensity' });
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x8a8d94, roughness: 0.5, metalness: 0.6 });
  const glowTex = glowTexture();
  const glowSprites = [];
  const cxz = [(a - r), (b - r)], rr = (r + 52) * Math.SQRT1_2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const g = new THREE.Group();
    const x = sx * (cxz[0] + rr), z = sz * (cxz[1] + rr);
    g.position.set(x, 0, z);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 50, 8), mastMat); mast.position.y = 25; mast.castShadow = true;
    const head = new THREE.Mesh(new THREE.BoxGeometry(9, 5.5, 1.2), headMat); head.position.y = 51.5;
    g.add(mast, head);
    g.lookAt(0, 0, 0); // başlık sahaya bakar
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.scale.set(36, 36, 1); sp.position.set(x, 51.5, z);
    glowSprites.push(sp);
    towers.add(g, sp);
  }
  root.add(towers);

  // ---- Gece ----
  function setNight(n) {
    for (const o of nightMats) o.mat[o.prop] = (o.base || 0) + n * o.max;
    for (const sp of glowSprites) sp.material.opacity = n * 0.95;
  }
  setNight(0);

  return {
    group: root,
    sections,                         // Map<id, Group>
    sectionList: SECTIONS.map((d) => sections.get(d.id)),
    parts: { structure, sectionsGroup, roof: roofGroup, facade: facadeGroup, pitch: pitchGroup, towers },
    pitch, setNight,
  };
}
