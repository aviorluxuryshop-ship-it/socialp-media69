import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYOUT, SECTIONS, standPoint } from '../data/sections.js';
import { resample } from './geometry.js';

// Üç boyutlu koltuklar: yalnızca iç görünümde (kase / bölüm) gösterilir, ilk girişte tembel üretilir.
// Her bölüm, yol boyunca parçalara (chunk) ayrılır; her parça ayrı bir InstancedMesh'tir, böylece
// three.js görüş alanı dışındaki parçaları (kamera arkası) çizmez.

const SPACING = 0.5;        // koltuk aralığı (m)
const BACK_OFFSET = 0.36;   // koltuk merkezi, sıranın arka kenarından bu kadar önde
const MAX_FULL = 45000;     // yüksek kalitede toplam örnek sınırı
const CHUNK_LEN = 18;       // yaklaşık parça uzunluğu (m)
const NEAR_SKIP = 1.3;      // kamera noktasına yatay mesafe: bu içindeki koltuklar atlanır

const ACCENT = { kuzey: 0x4f79c9, guney: 0xc9524f, dogu: 0xd2a640, bati: 0x3fb0a6 };
const WHITE = new THREE.Color(0x24252b), DARK = new THREE.Color(0xf0f0f3);

// Alçak poligonlu koltuk (20 üçgen): gövde/minder bloğu + sırt; alt yüzler yok. Yerel +Z = sahaya bakış.
function seatGeometry() {
  const box = (w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    g.translate(x, y, z);
    // alt yüzü at (BoxGeometry yüz sırası: +x,-x,+y,-y,+z,-z; her yüz 6 köşe)
    const keep = [];
    for (let f = 0; f < 6; f++) if (f !== 3) keep.push(f);
    const pos = g.attributes.position, nor = g.attributes.normal;
    const np = new Float32Array(keep.length * 18), nn = new Float32Array(keep.length * 18);
    keep.forEach((f, i) => { np.set(pos.array.subarray(f * 18, f * 18 + 18), i * 18); nn.set(nor.array.subarray(f * 18, f * 18 + 18), i * 18); });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(np, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
    g.dispose();
    return out;
  };
  const parts = [
    box(0.46, 0.36, 0.4, 0, 0.18, 0),          // gövde + minder
    box(0.46, 0.42, 0.07, 0, 0.55, -0.235),    // sırt
  ];
  const g = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return g;
}

export function createSeats({ stadium, quality }) {
  const group = new THREE.Group();
  group.name = 'seats';
  group.visible = false;

  // Bölüm başına bir malzeme: vurgu (altın) bu malzemenin rengiyle yapılır.
  const materials = new Map();
  for (const def of SECTIONS) {
    if (def.tier === 'koridor') continue;
    materials.set(def.id, new THREE.MeshLambertMaterial({ color: 0xffffff }));
  }

  let built = false;
  let geo = null;
  const meshes = [];
  const stats = { instances: 0, meshes: 0 };

  function build() {
    built = true;
    geo = seatGeometry();
    const lowQ = quality.name === 'low';
    const accentCol = {};
    for (const k of Object.keys(ACCENT)) accentCol[k] = new THREE.Color(ACCENT[k]);

    // 1) tüm koltukları üret (sınıf: (i + sıra) % 3, düşük kalitede yalnız sınıf 0)
    const pending = []; // { def, chunks: [ number[] ] }
    let total = 0;
    for (const def of SECTIONS) {
      if (def.tier === 'koridor') continue;
      const t = LAYOUT.tiers[def.tier];
      const rows = Math.max(1, Math.round((t.y1 - t.y0) / LAYOUT.rowRise));
      const dd = (t.d1 - t.d0) / rows, dy = (t.y1 - t.y0) / rows;
      const samples = stadium.standSamples[def.stand];
      const vp = standPoint(def.stand, def.viewpoint.local.d, 0);
      const vpTread = def.viewpoint.local.y - 1.2;
      const midLen = resample(samples, (t.d0 + t.d1) / 2, SPACING).length * SPACING;
      const nch = Math.max(2, Math.round(midLen / CHUNK_LEN));
      const chunks = Array.from({ length: nch }, () => []);
      for (let k = 0; k < rows; k++) {
        const dEnd = t.d0 + dd * (k + 1);
        const y = t.y0 + dy * (k + 1);
        const pts = resample(samples, dEnd - BACK_OFFSET, SPACING);
        const n = pts.length;
        for (let i = 0; i < n; i++) {
          const cls = (i + k) % 3;
          if (lowQ && cls !== 0) continue;
          const p = pts[i];
          // kamera noktasına çok yakın koltukları atla (yakın düzlemde kesilmesin)
          if (Math.hypot(p.x - vp[0], p.z - vp[2]) < NEAR_SKIP && Math.abs(y - vpTread) < 1.5) continue;
          // sakin desen: çoğu beyaz, çiftli koyu çapraz, 8 sırada bir bölge rengi şeridi
          const colorId = k % 8 === 3 ? 2 : (((i >> 2) + k) % 4 === 0) ? 1 : 0;
          const c = Math.min(nch - 1, Math.floor((i / n) * nch));
          chunks[c].push(p.x, y, p.z, Math.atan2(-p.nx, -p.nz), cls, colorId);
          total++;
        }
      }
      pending.push({ def, chunks });
    }
    const dropCls2 = !lowQ && total > MAX_FULL;

    // 2) parça başına InstancedMesh (sınıfa göre sıralı: ilk n0 örnek = seyrek küme)
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    for (const { def, chunks } of pending) {
      const mat = materials.get(def.id);
      chunks.forEach((arr, ci) => {
        const nTot = arr.length / 6;
        if (!nTot) return;
        const order = [[], [], []];
        for (let j = 0; j < nTot; j++) order[arr[j * 6 + 4]].push(j);
        if (dropCls2) order[2] = [];
        const flat = order[0].concat(order[1], order[2]);
        const mesh = new THREE.InstancedMesh(geo, mat, flat.length);
        mesh.name = `seats-${def.id}-${ci}`;
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        mesh.receiveShadow = quality.shadows;
        flat.forEach((j, idx) => {
          const o = j * 6;
          pos.set(arr[o], arr[o + 1], arr[o + 2]);
          q.setFromAxisAngle(up, arr[o + 3]);
          m4.compose(pos, q, one);
          mesh.setMatrixAt(idx, m4);
          const cid = arr[o + 5];
          col.copy(cid === 0 ? WHITE : cid === 1 ? DARK : accentCol[def.stand]);
          mesh.setColorAt(idx, col);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere(); // r169+: örnekleri kapsar -> frustum culling doğru çalışır
        mesh.computeBoundingBox();
        mesh.userData.full = flat.length;
        mesh.userData.sparse = order[0].length;
        mesh.userData.sectionId = null; // ışın izlemeye dahil değil
        group.add(mesh);
        meshes.push(mesh);
        stats.instances += flat.length;
      });
    }
    stats.meshes = meshes.length;
    stats.full = stats.instances;
    acc = 1;
    if (quality.seatsSparse) setDensity('low');
  }

  // 'low': yalnız seyrek küme (her 3. koltuk, çapraz dağılım); 'high': tümü.
  function setDensity(name) {
    quality.seatsSparse = name === 'low';
    stats.instances = 0;
    for (const m of meshes) {
      m.count = name === 'low' ? m.userData.sparse : m.userData.full;
      stats.instances += m.count;
    }
    acc = 1; // LOD'u hemen yenile
  }

  // Mesafe LOD'u (0.4 sn'de bir): yüksek kalitede tüm koltuklar (çok uzak olanlar hariç), düşükte seyrek küme + yakın bölge.
  const FAR_D = 150;
  let acc = 0;
  function update(dt, camPos) {
    if (!built || !group.visible) return;
    acc += dt;
    if (acc < 0.4) return;
    acc = 0;
    let n = 0;
    for (const m of meshes) {
      const d = m.boundingSphere.center.distanceTo(camPos) - m.boundingSphere.radius;
      const sparse = quality.seatsSparse;
      // uzak parçalar çizilmez (boyalı doku yeterli); düşük kalitede eşik daha yakın
      if (d > (sparse ? 80 : FAR_D)) { m.visible = false; continue; }
      m.visible = true;
      m.count = sparse ? m.userData.sparse : m.userData.full;
      n += m.count;
    }
    stats.instances = n;
  }

  return {
    group, materials, stats, update,
    get built() { return built; },
    meshes,
    show() { if (!built) build(); group.visible = true; },
    hide() { group.visible = false; },
    setDensity,
  };
}
