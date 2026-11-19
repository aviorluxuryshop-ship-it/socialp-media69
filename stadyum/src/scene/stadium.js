import * as THREE from 'three';
import { LAYOUT, SECTIONS, STAND_PIECES } from '../data/sections.js';
import { pathSamples, loft, stairs, resample, LOOP_PIECES, seatTexture, locaTexture } from './geometry.js';

// Tribün renk tonları: dokuyla çarpılır; neredeyse beyaz, hafif tribün tonu.
const SECTION_COLORS = {
  'kuzey-alt': 0xdfe6f2, 'kuzey-ust': 0xeef2f9,
  'guney-alt': 0xf2dfe0, 'guney-ust': 0xf9eeee,
  'dogu-alt': 0xf3ead6, 'dogu-ust': 0xfaf4e6,
  'bati-alt': 0xdcefee, 'bati-ust': 0xeefaf9,
  'bati-loca': 0xffffff,
};

const SPOT_MAX = 14000;

// Prosedürel kısım: bölümler (seçim/vurgu), reklam panosu, loca camı, çatı altı projektörleri (gece), goller.
// Dış kabuk (cephe, çatı, saha, kase kabuğu, güney binası) `shell` (GLB, bkz. shell.js) olarak dışarıdan verilir.
export function buildStadium(quality, shell) {
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

  // Alt/üst arasındaki koridor bandı (beton) GLB `concourse` düğümündedir; Batı'daki loca camı yukarıdaki bölüm mesh'idir.
  // Reklam panosu halkası:
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide });
  const board = new THREE.Mesh(loft(loopSamples, [[4.8, 0], [4.8, 1.2], [5.2, 1.2]]), boardMat);
  board.name = 'reklam-panosu';
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8, side: THREE.DoubleSide });
  const boardTrim = new THREE.Mesh(loft(loopSamples, [[4.78, 1.0], [4.78, 1.1]]), goldMat);
  structure.add(board, boardTrim);

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

  // ---- Kaleler: saha yüzeyi + çevre çimi GLB'de (`pitch`); kaleler GLB'de olmadığı için burada kalır ----
  const goalsGroup = new THREE.Group(); goalsGroup.name = 'goals';
  const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  for (const sgn of [-1, 1]) {
    const gz = sgn * LAYOUT.pitch.length / 2;
    const g = new THREE.Group(); g.position.z = gz;
    const post = new THREE.BoxGeometry(0.16, 2.44, 0.16), bar = new THREE.BoxGeometry(7.32, 0.16, 0.16);
    for (const px of [-3.66, 3.66]) { const p = new THREE.Mesh(post, goalMat); p.position.set(px, 1.22, 0); g.add(p); }
    const cb = new THREE.Mesh(bar, goalMat); cb.position.set(0, 2.44, 0); g.add(cb);
    goalsGroup.add(g);
  }
  root.add(goalsGroup, shell.group);

  // ---- Gece ----
  function setNight(n) {
    for (const o of nightMats) o.mat[o.prop] = (o.base || 0) + n * o.max;
    shell.setNight(n);               // GLB: çatı üstü kısılır, saha/cam hafif parlar
    for (const l of spots) l.intensity = n * SPOT_MAX;
  }
  setNight(0);

  const n = shell.nodes;
  return {
    group: root,
    sections,                         // Map<id, Group>
    sectionList: SECTIONS.map((d) => sections.get(d.id)),
    standSamples,
    shell,                            // GLB kabuğu (shell.js): malzemeler, istatistik, downscaleRoof()
    parts: {
      structure, sectionsGroup, floods: floodGroup, goals: goalsGroup,
      roof: n.roof,                   // GLB roof_top + roof_under
      facade: n.facade,               // GLB cephe
      pitch: n.pitch,                 // GLB saha + çevre çimi
      southBuilding: n.south_building,
      podium: n.podium,
      // iç modda çizilmeyecekler (kameranın göremediği dış kabuk)
      exteriorOnly: [n.facade, n.south_building, n.podium].filter(Boolean),
    },
    pitch: n.pitch, setNight,
  };
}
