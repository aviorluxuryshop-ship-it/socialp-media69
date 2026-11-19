import * as THREE from 'three';
import { setMode, state } from './state.js';
import { app } from './app.js';
import { flyTo } from './camera/flyTo.js';
import { LAYOUT } from './data/sections.js';

// ---- Kontrol ayarları ----
export const INTERIOR_TARGET = new THREE.Vector3(0, 4, 0);

export function configureExteriorControls() {
  const c = app.controls;
  c.target.copy(app.exteriorTarget);
  c.minDistance = 140; c.maxDistance = 1500;
  c.minPolarAngle = 0.25; c.maxPolarAngle = 1.4;
  c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity;
  c.enablePan = false; c.rotateSpeed = 0.55; c.zoomSpeed = 0.7;
  c.autoRotate = true;
}

// İç görünüm: hedef saha merkezi. Kamera ÇATI ALTINDA, kasenin içinde kalır: OrbitControls küresel limitleri
// (mesafe/kutup açısı) + her karede clampInterior() ile kase/çatı hacmine sıkıştırma (aşağıya bakın).
export function configureInteriorControls() {
  const c = app.controls;
  c.target.copy(INTERIOR_TARGET);
  c.minDistance = 22; c.maxDistance = 92;
  c.minPolarAngle = 0.35; c.maxPolarAngle = 1.5;
  c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity;
  c.enablePan = false; c.rotateSpeed = 0.5; c.zoomSpeed = 0.7;
  c.enableDamping = true; c.dampingFactor = 0.07;
  c.autoRotate = false;
}

// Kase hacmi: yuvarlatılmış dikdörtgen kase çizgisine işaretli uzaklık (d>0 tribüne doğru), tribün yüzeyi ve çatı alt yüzü.
const { a: BA, b: BB, r: BR } = LAYOUT.bowl;
function bowlSd(x, z) {
  const qx = Math.abs(x) - (BA - BR), qz = Math.abs(z) - (BB - BR);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - BR;
}
const { tiers: T, roof: RF } = LAYOUT;
function standY(d) {
  if (d <= T.alt.d0) return 0.6;
  if (d <= T.alt.d1) return T.alt.y0 + ((d - T.alt.d0) / (T.alt.d1 - T.alt.d0)) * (T.alt.y1 - T.alt.y0);
  if (d <= T.koridor.d1) return T.koridor.y0 + ((d - T.koridor.d0) / (T.koridor.d1 - T.koridor.d0)) * (T.koridor.y1 - T.koridor.y0);
  return T.ust.y0 + ((Math.min(d, T.ust.d1) - T.ust.d0) / (T.ust.d1 - T.ust.d0)) * (T.ust.y1 - T.ust.y0);
}
// GLB çatı alt yüzü bu doğrusal eğrinin en fazla ~1.6 m altına sarkar (iç halka/kirişler); `roofY - 2.2` kamera sınırı
// GLB köşe noktalarına ≥1.05 m boşluk bırakır (blender/ çıktısından ölçüldü), yani kamera çatının içinden geçmez.
const roofY = (d) => RF.yIn + ((d - RF.dIn) / (RF.dOut - RF.dIn)) * (RF.yOut - RF.yIn);
const D_MAX = 36, OPEN_MAX_Y = 23;
const _g = new THREE.Vector3();
// Kamerayı kase içine, çatı altına ve tribün üstüne sıkıştırır (çatının üstüne/dışına çıkamaz).
export function clampInterior(cam) {
  const p = cam.position;
  let d = bowlSd(p.x, p.z);
  if (d > D_MAX) { // tribün arkasına geçme: merkeze doğru it
    for (let i = 0; i < 24 && d > D_MAX; i++) { p.x *= 0.97; p.z *= 0.97; d = bowlSd(p.x, p.z); }
  }
  const minY = (d < 0 ? 2.5 : standY(d) + 2.4);
  const maxY = d < RF.dIn ? OPEN_MAX_Y : Math.min(OPEN_MAX_Y + 6, roofY(d) - 2.2);
  p.y = Math.min(Math.max(p.y, minY), Math.max(minY, maxY));
  return p;
}

// İç modda gizlenen nesneler (performans): GLB dış kabuğu (cephe, güney binası, podyum) + dış çevre (gökyüzü/yıldızlar hariç).
// Çatı (üst + alt), kase kabuğu, bölümler ve saha içeriden görünür: kalır.
const KEEP_IN_ENV = new Set(['sky', 'stars']);
function setInteriorVisibility(interior) {
  for (const o of app.stadium.parts.exteriorOnly) o.visible = !interior;
  app.lighting.setInterior(interior);
  if (interior) app.seats.show(); else app.seats.hide(); // koltuklar yalnız içeride (ilk girişte üretilir)
  for (const o of app.env.group.children) if (!KEEP_IN_ENV.has(o.name)) o.visible = !interior;
}

const bump = (p, c, w) => Math.pow(Math.max(0, 1 - Math.abs(p - c) / w), 1.5);
let busy = false;

// Kuzey-Doğu köşesi, üst tribün üstü, çatı iç kenarının altında: karşıda Batı ana tribünü ve loca bandı görünür.
export const INTERIOR_START = [52, 24, -71];
// Çatı açıklığından (|x|<44, |z|<62) geçip çatı altına süzülen ara noktalar.
export const OPENING_PATH = [[60, 88, 40], [26, 52, -6], [30, 27, -26], [47, 22, -52]];
const INTERIOR_FOV = 62, EXTERIOR_FOV = 45;
function setFov(f) { app.camera.fov = f; app.camera.updateProjectionMatrix(); }
const lerp = (a, b, t) => a + (b - a) * t;

export async function onBuyTicket() {
  if (state.mode !== 'exterior' || busy) return;
  busy = true;
  const { camera, ui } = app;
  app.savedExteriorPos = camera.position.clone();
  app.controls.autoRotate = false;
  setMode('entering');
  let swapped = false;
  await flyTo({
    position: INTERIOR_START,
    lookAt: INTERIOR_TARGET,
    duration: 3.8,
    // cephe hattının üstünden gel, çatı açıklığından kaseye süzül, çatı altında köşe tribüne yerleş
    path: [[200, 120, 120], ...OPENING_PATH],
    onUpdate: (p) => {
      setFov(lerp(EXTERIOR_FOV, INTERIOR_FOV, Math.max(0, (p - 0.5) / 0.5)));
      ui.setFade(Math.min(0.95, bump(p, 0.52, 0.12) * 1.2));
      if (!swapped && p >= 0.52) { swapped = true; setInteriorVisibility(true); }
    },
  });
  if (!swapped) setInteriorVisibility(true);
  ui.setFade(0);
  configureInteriorControls();
  app.controls.update();
  busy = false;
  setMode('interior');
}

export async function onExitStadium() {
  if (!(state.mode === 'interior' || state.mode === 'section') || busy) return;
  busy = true;
  const { ui } = app;
  const dest = app.savedExteriorPos || new THREE.Vector3(250, 120, 270);
  setMode('entering');
  let swapped = false;
  await flyTo({
    position: dest,
    lookAt: app.exteriorTarget,
    duration: 2.2,
    path: [...OPENING_PATH].reverse().concat([[120, 90, 30]]),
    onUpdate: (p) => {
      setFov(lerp(INTERIOR_FOV, EXTERIOR_FOV, Math.min(1, p / 0.5)));
      ui.setFade(Math.min(0.95, bump(p, 0.2, 0.12) * 1.2));
      if (!swapped && p >= 0.2) { swapped = true; setInteriorVisibility(false); }
    },
  });
  if (!swapped) setInteriorVisibility(false);
  ui.setFade(0);
  configureExteriorControls();
  app.controls.update();
  busy = false;
  setMode('exterior');
}
