import * as THREE from 'three';
import { setMode, state } from './state.js';
import { app } from './app.js';
import { flyTo } from './camera/flyTo.js';

// ---- Kontrol ayarları ----
export const INTERIOR_TARGET = new THREE.Vector3(0, 4, 0);

export function configureExteriorControls() {
  const c = app.controls;
  c.target.copy(app.exteriorTarget);
  c.minDistance = 140; c.maxDistance = 900;
  c.minPolarAngle = 0.25; c.maxPolarAngle = 1.4;
  c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity;
  c.enablePan = false; c.rotateSpeed = 0.55; c.zoomSpeed = 0.7;
  c.autoRotate = true;
}

// İç görünüm: hedef saha merkezi; kamera çatı iç halkasının açıklığından/üstünden bakan bir kubbe
// üzerinde kalır (r>=40, kutup açısı <=0.95 rad => çatı ve tribünlerin içine girilemez).
export function configureInteriorControls() {
  const c = app.controls;
  c.target.copy(INTERIOR_TARGET);
  c.minDistance = 42; c.maxDistance = 96;
  c.minPolarAngle = 0.25; c.maxPolarAngle = 0.95;
  c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity;
  c.enablePan = false; c.rotateSpeed = 0.5; c.zoomSpeed = 0.7;
  c.enableDamping = true; c.dampingFactor = 0.07;
  c.autoRotate = false;
}

// İç modda gizlenen nesneler (performans): cephe + dış çevre (gökyüzü/yıldızlar hariç).
const KEEP_IN_ENV = new Set(['sky', 'stars']);
function setInteriorVisibility(interior) {
  app.stadium.parts.facade.visible = !interior;
  for (const o of app.env.group.children) if (!KEEP_IN_ENV.has(o.name)) o.visible = !interior;
}

const bump = (p, c, w) => Math.pow(Math.max(0, 1 - Math.abs(p - c) / w), 1.5);
let busy = false;

export const INTERIOR_START = [-58, 56, 16];
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
    // ana girişe (Doğu kemerli cephe) alçal, cephe hattını üstünden geç, kaseye süzül
    path: [[190, 70, 70], [118, 40, 8], [86, 45, 0], [40, 56, 0]],
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
    path: [[60, 62, 0], [130, 60, 20]],
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
