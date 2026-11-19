import { state, setMode } from './state.js';
import { app } from './app.js';
import { flyTo } from './camera/flyTo.js';
import { createLookAround } from './camera/lookAround.js';
import { configureInteriorControls, onExitStadium, INTERIOR_START, INTERIOR_TARGET, OPENING_PATH } from './flow.js';
import { SECTION_BY_ID, standPoint } from './data/sections.js';

export const SECTION_FOV = 60, INTERIOR_FOV = 62;
const NEAR_SECTION = 0.5, NEAR_INTERIOR = 8;

let look = null;
const lerp = (a, b, t) => a + (b - a) * t;
const setProj = (fov, near) => {
  const c = app.camera;
  if (fov != null) c.fov = fov;
  if (near != null) c.near = near;
  c.updateProjectionMatrix();
};

// Kasenin üstünden (saha üzerinden) tribüne süzülen yol. A: sahanın üstünde yüksek, B: açıklıktan
// çatı iç halkasının altına geçiş. Yol çatı/tribün içinden geçmez.
function approach(def) {
  const { d, y } = def.viewpoint.local;
  const A = standPoint(def.stand, -14, Math.max(y + 16, 34));
  const B = standPoint(def.stand, 6, Math.min(y + 3, 24));
  return { A, B };
}

export function ensureLook() { return (look ||= createLookAround()); }
export const lookAround = () => look;

export async function selectSection(id) {
  const def = SECTION_BY_ID[id];
  if (!def) return false;
  if (state.mode !== 'interior' && state.mode !== 'section') return false;
  if (state.mode === 'section' && state.selectedSection === id) return false;
  const prevId = state.mode === 'section' ? state.selectedSection : null;
  const prev = prevId ? SECTION_BY_ID[prevId] : null;
  const lk = ensureLook();
  lk.stop();
  setMode('section', { selectedSection: id });
  const { A, B } = approach(def);
  const path = [];
  if (prev) { const p = approach(prev); path.push(p.B, p.A); }
  path.push(A, B);
  const fov0 = app.camera.fov;
  setProj(null, NEAR_SECTION);
  const ok = await flyTo({
    position: def.viewpoint.position,
    lookAt: def.viewpoint.lookAt,
    duration: prev ? 2.5 : 2.2,
    path,
    enable: false,
    onUpdate: (p) => { app.camera.fov = lerp(fov0, SECTION_FOV, Math.min(1, p * 1.2)); app.camera.updateProjectionMatrix(); },
  });
  if (!ok || state.selectedSection !== id || state.mode !== 'section') return false;
  app.controls.enabled = false;
  setProj(SECTION_FOV, NEAR_SECTION);
  lk.start();
  return true;
}

// Bölüm görünümünden kasenin genel görünümüne dön.
export async function leaveSection() {
  if (state.mode !== 'section') return false;
  const def = SECTION_BY_ID[state.selectedSection];
  look?.stop();
  setMode('interior');
  const fov0 = app.camera.fov;
  let nearBack = false;
  const path = def ? (() => { const { A, B } = approach(def); return [B, A, ...OPENING_PATH.slice(2)]; })() : [];
  const ok = await flyTo({
    position: INTERIOR_START,
    lookAt: INTERIOR_TARGET,
    duration: 2.2,
    path,
    enable: false,
    onUpdate: (p) => {
      app.camera.fov = lerp(fov0, INTERIOR_FOV, Math.min(1, p * 1.2));
      if (!nearBack && p > 0.3) { nearBack = true; app.camera.near = NEAR_INTERIOR; }
      app.camera.updateProjectionMatrix();
    },
  });
  if (!ok) return false;
  setProj(INTERIOR_FOV, NEAR_INTERIOR);
  configureInteriorControls();
  app.controls.enabled = true;
  app.controls.update();
  return true;
}

// Bir seviye geri: bölüm -> genel görünüm -> dışarı.
export function goBack() {
  if (state.mode === 'section') return leaveSection();
  if (state.mode === 'interior') return onExitStadium();
  return false;
}
