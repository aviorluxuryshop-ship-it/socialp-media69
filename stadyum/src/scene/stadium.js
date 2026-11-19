import * as THREE from 'three';
import { LAYOUT, SECTIONS, STAND_PIECES } from '../data/sections.js';
import {
  pathSamples, loft, stairs, resample, LOOP_PIECES,
  seatTexture, pitchTexture, facadeTexture, archTexture, locaTexture, roofTopTexture, roofUnderTexture, planarRoofUV,
} from './geometry.js';

// Tribün renk tonları: dokuyla çarpılır; neredeyse beyaz, hafif tribün tonu.
const SECTION_COLORS = {
  'kuzey-alt': 0xdfe6f2, 'kuzey-ust': 0xeef2f9,
  'guney-alt': 0xf2dfe0, 'guney-ust': 0xf9eeee,
  'dogu-alt': 0xf3ead6, 'dogu-ust': 0xfaf4e6,
  'bati-alt': 0xdcefee, 'bati-ust': 0xeefaf9,
  'bati-loca': 0xffffff,
};

const SPOT_MAX = 14000;

export function buildStadium(quality) {
  const arc = quality.arcSegments;
  const { tiers, facade, roof, bowl } = LAYOUT;
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

  const concrete = new THREE.MeshLambertMaterial({ color: 0xa4a7ae, side: THREE.DoubleSide });

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
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xe3d8bf, side: THREE.DoubleSide });
  const trim = new THREE.Mesh(loft(loopSamples, [[facade.d + 0.7, facade.h - 1.6], [facade.d + 0.7, facade.h - 0.2], [facade.d - 0.2, facade.h - 0.2]]), stoneMat);
  trim.name = 'facade-trim';
  facadeGroup.add(trim);

  // dikey kolonlar (instanced)
  const cols = resample(loopSamples, facade.d + 0.55, 4.2);
  const colGeo = new THREE.BoxGeometry(1.5, facade.h - 0.8, 1.4);
  const colMat = new THREE.MeshLambertMaterial({ color: 0xe9dfc8 });
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
  const archCap = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, archLen), stoneMat);
  archCap.position.set(a + facade.d + 0.9, archH + 0.2, 0);
  facadeGroup.add(archCap);
  structure.add(facadeGroup);

  // ---- Çatı halkası (opak: üstte beyaz membran, altta gri halat/panel yüzeyi) ----
  const roofGroup = new THREE.Group(); roofGroup.name = 'roof';
  const roofSpan = Math.hypot(roof.dOut - roof.dIn, roof.yOut - roof.yIn);
  const roofGeo = loft(loopSamples, [[roof.dIn, roof.yIn], [roof.dOut, roof.yOut]], { uScale: 8, vLen: roofSpan });
  // hangi yüzün yukarı baktığını normalden bul (loft sarım yönü)
  const upFront = roofGeo.attributes.normal.getY(0) > 0;
  const topMat = new THREE.MeshLambertMaterial({ map: roofTopTexture(quality.name === 'high' ? 3072 : 2048), color: 0xffffff, side: upFront ? THREE.FrontSide : THREE.BackSide });
  const underMat = new THREE.MeshLambertMaterial({ map: roofUnderTexture(), color: 0xffffff, side: upFront ? THREE.BackSide : THREE.FrontSide });
  const membrane = new THREE.Mesh(planarRoofUV(roofGeo), topMat); membrane.name = 'roof-membrane';
  const underside = new THREE.Mesh(roofGeo, underMat); underside.name = 'roof-underside';
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xd5d8dd, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide });
  const w = 0.5;
  const ring = (d, y, hw, hu, hd, mat, name) => {
    const m = new THREE.Mesh(loft(loopSamples, [
      [d - hw, y - hd], [d + hw, y - hd], [d + hw, y + hu], [d - hw, y + hu], [d - hw, y - hd],
    ]), mat);
    m.name = name; return m;
  };
  const inner = ring(roof.dIn, roof.yIn, w, 0.35, 0.8, darkSteel, 'roof-inner-ring');
  const outer = ring(roof.dOut, roof.yOut, 0.9, 0.5, 1.4, steelMat, 'roof-outer-ring');
  roofGroup.add(membrane, underside, inner, outer);

  // alt yüzde radyal halatlar (tek LineSegments)
  const spokes = resample(loopSamples, roof.dIn, 7);
  const sp = [];
  for (const c of spokes) {
    sp.push(c.x + c.nx * 0, roof.yIn - 0.2, c.z + c.nz * 0);
    sp.push(c.x + c.nx * (roof.dOut - roof.dIn), roof.yOut - 0.2, c.z + c.nz * (roof.dOut - roof.dIn));
  }
  const spokeGeo = new THREE.BufferGeometry(); spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const spokeLines = new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({ color: 0x3b3f47 }));
  spokeLines.name = 'roof-cables';
  roofGroup.add(spokeLines);

  // çatı üstü yazıları ve kartal: roofTopTexture içinde (tek tuval)
  structure.add(roofGroup);

  // ---- Çatı altı LED projektör halkası (instanced) + az sayıda gerçek SpotLight ----
  const floodGroup = new THREE.Group(); floodGroup.name = 'roof-floodlights';
  const unitMat = new THREE.MeshStandardMaterial({ color: 0x2b2d32, emissive: 0xfff3d6, emissiveIntensity: 0.0, roughness: 0.5 });
  nightMats.push({ mat: unitMat, max: 3.4, prop: 'emissiveIntensity' });
  const units = resample(loopSamples, roof.dIn + 0.9, 2.4);
  const unitMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.9, 0.7), unitMat, units.length);
  unitMesh.name = 'floodlight-units';
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qp = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    const ax = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, 1, 0);
    units.forEach((c, i) => {
      q.setFromAxisAngle(up, Math.atan2(-c.nx, -c.nz)); // yerel +Z merkeze bakar
      qp.setFromAxisAngle(ax, 0.55);                    // aşağı eğim (sahaya)
      q.multiply(qp);
      m4.compose(new THREE.Vector3(c.x, roof.yIn - 1.0, c.z), q, one);
      unitMesh.setMatrixAt(i, m4);
    });
  }
  floodGroup.add(unitMesh);
  const spots = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const sl = new THREE.SpotLight(0xfff1d8, 0, 0, 0.75, 0.75, 1.6);
    sl.position.set(sx * 40, roof.yIn - 2, sz * 58);
    sl.target.position.set(-sx * 8, 0, -sz * 14);
    sl.castShadow = false;
    spots.push(sl); floodGroup.add(sl, sl.target);
  }
  root.add(floodGroup);

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

  // ---- Gece ----
  function setNight(n) {
    for (const o of nightMats) o.mat[o.prop] = (o.base || 0) + n * o.max;
    topMat.color.setScalar(1 - 0.5 * n);
    for (const l of spots) l.intensity = n * SPOT_MAX;
  }
  setNight(0);

  return {
    group: root,
    sections,                         // Map<id, Group>
    sectionList: SECTIONS.map((d) => sections.get(d.id)),
    standSamples,
    parts: { structure, sectionsGroup, roof: roofGroup, facade: facadeGroup, pitch: pitchGroup, floods: floodGroup },
    pitch, setNight,
  };
}
