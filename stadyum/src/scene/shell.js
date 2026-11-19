import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Stadyum kabuğu: Blender ile üretilmiş `public/models/tupras.glb` (bkz. blender/README.md).
// Dış cephe, çatı (üst/alt), saha, kapalı kase kabuğu ve güney binası buradan gelir.
// Tek sefer yüklenir (modül düzeyinde önbellek) ve sahnede kalır: içeri/dışarı geçişte yeniden yüklenmez, yalnızca
// `visible` ile açılıp kapanır.

export const MODEL_URL = `${import.meta.env.BASE_URL}models/tupras.glb`;
const FALLBACK_BYTES = 2468128;  // content-length gelmezse ilerleme tahmini için
const ROOF_LOW_SIZE = 2048;      // düşük kalitede çatı dokusu bu boyuta indirilir
const GRASS_GLOW = 0x2fae44;
// Blender malzemeleri Cycles'a göre koyu: sahnede yalnızca yarım küre + güneş ışığı var (ortam haritası yok), dik yüzeyler
// neredeyse siyah kalıyor. Koyu çelik/podyum rengi çarpanla açılır; cam gündüz gökyüzünü, gece sıcak ışığı yansıtır.
const COLOR_BOOST = { steel_dark: 2.6, podium_dark: 2.4 };
const GLASS_DAY = new THREE.Color(0xd8dde6), GLASS_NIGHT = new THREE.Color(0xffd9a0);

let cache = null;

// Yükleme + kurulum. Aynı sayfa ömründe ikinci çağrı aynı Promise'i döndürür.
// onProgress(0..1): yalnız ağ indirmesi (ayrıştırma/GPU yükü ayrıca bildirilmez).
export function loadShell(quality, renderer, onProgress) {
  if (!cache) {
    const t0 = performance.now();
    cache = new GLTFLoader().loadAsync(MODEL_URL, (e) => {
      onProgress?.(Math.min(1, e.loaded / (e.total || FALLBACK_BYTES)));
    }).then((gltf) => {
      const tNet = performance.now();
      const shell = setupShell(gltf, quality, renderer);
      shell.stats.loadMs = Math.round(tNet - t0);
      shell.stats.setupMs = Math.round(performance.now() - tNet);
      return shell;
    }).catch((err) => { cache = null; throw err; });
  }
  return cache;
}

function disposeNode(node) {
  node.traverse((o) => { o.geometry?.dispose(); });
}

function setupShell(gltf, quality, renderer) {
  const root = gltf.scene;
  root.name = 'shell';

  // üst düzey düğümler (Blender nesneleri): çok malzemeli olanlar Group olarak gelir
  const nodes = {};
  for (const ch of [...root.children]) nodes[ch.name] = ch;

  // Sitenin emissive `floodlight-units` projektörleri kalıyor: GLB'nin koyu projektör gövdeleri hiç çizilmez.
  if (nodes.roof_lights) { root.remove(nodes.roof_lights); disposeNode(nodes.roof_lights); delete nodes.roof_lights; }

  // ---- malzemeler ----
  // Ortam haritası yok: metalness>0 malzemeler yansıtacak bir şey bulamayıp siyaha döner -> hepsi 0.
  const mats = {};
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    m.metalness = 0;
    if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
    mats[m.name] = m;
    o.userData.shell = true;
  });
  for (const m of Object.values(mats)) {
    if (!m.map) continue;
    m.map.anisotropy = Math.min(m === mats.roof_fabric || m === mats.pitch ? 8 : 4, maxAniso);
  }
  for (const [name, k] of Object.entries(COLOR_BOOST)) mats[name]?.color.multiplyScalar(k);
  // cam: ortam haritası olmadığı için pürüzsüz yüzey siyah yansıma verir; hafif mat kalsın
  if (mats.facade_glass) mats.facade_glass.roughness = Math.max(mats.facade_glass.roughness, 0.35);

  // ---- çatı dokusu: 4096² JPEG; düşük kalitede (veya GPU sınırı düşükse) 2048²'ye indirilir ----
  const roofMat = mats.roof_fabric;
  const stats = {
    triangles: 0, roofTexture: roofMat?.map?.image ? `${roofMat.map.image.width}x${roofMat.map.image.height}` : '-',
    loadMs: 0, setupMs: 0,
  };
  let roofScaled = false;
  function downscaleRoof(size = ROOF_LOW_SIZE) {
    const tex = roofMat?.map;
    const img = tex?.image;
    if (roofScaled || !img || img.width <= size) return false;
    roofScaled = true;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, size, size);
    const small = new THREE.CanvasTexture(cv);
    small.colorSpace = THREE.SRGBColorSpace;
    small.flipY = tex.flipY;                 // glTF dokuları flipY=false; yön aynı kalsın
    small.wrapS = tex.wrapS; small.wrapT = tex.wrapT;
    small.minFilter = tex.minFilter; small.magFilter = tex.magFilter;
    small.anisotropy = tex.anisotropy;
    roofMat.map = small;
    roofMat.needsUpdate = true;
    tex.dispose();                           // GPU'da tutulduysa 4096² serbest kalır
    if (img.close) img.close();              // ImageBitmap belleğini bırak
    stats.roofTexture = `${size}x${size}`;
    return true;
  }
  const lowTex = quality.name === 'low' || renderer.capabilities.maxTextureSize < 4096;
  if (lowTex) downscaleRoof(Math.min(ROOF_LOW_SIZE, renderer.capabilities.maxTextureSize));

  // ---- gölge ----
  for (const name of ['pitch', 'stands_lower', 'concourse', 'stands_upper']) {
    nodes[name]?.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  }
  for (const name of ['facade', 'south_building']) {
    nodes[name]?.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  }

  // ---- gece: çatı üstü kısılır, saha parlar, cam hafif aydınlanır ----
  if (mats.pitch) {
    mats.pitch.emissive.set(0xffffff); mats.pitch.emissiveMap = mats.pitch.map; mats.pitch.emissiveIntensity = 0;
  }
  if (mats.grass) { mats.grass.emissive.set(GRASS_GLOW); mats.grass.emissiveIntensity = 0; }
  if (mats.facade_glass) { mats.facade_glass.emissiveMap = mats.facade_glass.map; mats.facade_glass.emissiveIntensity = 3.4; }
  function setNight(n) {
    if (roofMat) roofMat.color.setScalar(1 - 0.5 * n);
    if (mats.pitch) mats.pitch.emissiveIntensity = 0.4 * n;
    if (mats.grass) mats.grass.emissiveIntensity = 0.3 * n;
    if (mats.facade_glass) mats.facade_glass.emissive.copy(GLASS_DAY).lerp(GLASS_NIGHT, n);
  }
  setNight(0);

  // ---- gruplar: çatı (üst + alt), iç modda gizlenenler ----
  const roof = new THREE.Group(); roof.name = 'roof';
  if (nodes.roof_top) roof.add(nodes.roof_top);
  if (nodes.roof_under) roof.add(nodes.roof_under);
  root.add(roof);

  // statik: dönüşümler sıfırlanmış; her karede matris güncellemesi gerekmez
  root.updateMatrixWorld(true);
  root.traverse((o) => { o.matrixAutoUpdate = false; });
  root.traverse((o) => {
    if (o.isMesh) {
      const g = o.geometry;
      stats.triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  });

  return {
    group: root,
    nodes: { ...nodes, roof },
    materials: mats,
    stats,
    setNight,
    downscaleRoof,
  };
}
