import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { state, setMode } from './state.js';
import { isFlying, flyTo } from './camera/flyTo.js';
import { app } from './app.js';
import { getQuality } from './quality.js';
import { buildStadium } from './scene/stadium.js';
import { buildEnvironment } from './scene/environment.js';
import { createLighting, readHour } from './scene/lighting.js';
import { createOverlay } from './ui/overlay.js';
import { SECTIONS, SECTION_BY_ID } from './data/sections.js';
import './style.css';
import './ui/sections.css';
import { initSections } from './sections.js';
import { createSeats } from './scene/seats.js';
import { initPerf } from './perf.js';

const quality = getQuality();
state.quality = quality;

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: quality.antialias, powerPreference: 'high-performance',
});
renderer.setPixelRatio(quality.pixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 8, 6000);

const ui = createOverlay(document.getElementById('ui'));

const env = buildEnvironment(quality);
scene.add(env.group);
const stadium = buildStadium(quality);
scene.add(stadium.group);
const lighting = createLighting({ scene, renderer, quality, env, stadium });
// 3D koltuklar: yalnız iç görünümde, ilk girişte üretilir (dışarıda hiç koltuk çizilmez)
const seats = createSeats({ stadium, quality });
scene.add(seats.group);

// ---- Dış kamera ve kontroller ----
const TARGET = new THREE.Vector3(0, 8, 0);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.7;
controls.minDistance = 140;
controls.maxDistance = 900;
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = 1.4; // yerin altına inme
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45; // yavaş sinematik dönüş

let resumeTimer = 0;
controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resumeTimer); });
controls.addEventListener('end', () => {
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => { if (state.mode === 'exterior') controls.autoRotate = true; }, 4000);
});

function fitCamera(initial) {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const dist = 400 * (camera.aspect < 1 ? Math.pow(camera.aspect, -0.6) : 1);
  if (initial) {
    const dir = new THREE.Vector3(0.62, 0.30, 0.66).normalize();
    camera.position.copy(TARGET).addScaledVector(dir, dist);
  }
  camera.updateProjectionMatrix();
}
fitCamera(true);
window.addEventListener('resize', () => fitCamera(false));

// ---- Gün ışığı: yerel saat, her dakika güncellenir (?saat=21 ile zorlanır) ----
function tickClock() {
  const { hour, forced } = readHour();
  lighting.setHour(hour, forced);
  state.hour = hour;
  ui.setClock(hour, forced);
}
tickClock();
setInterval(tickClock, 60 * 1000);

// ---- Döngü ----
const clock = new THREE.Clock();
let frames = 0, rafId = 0;
function frame() {
  rafId = 0;
  if (document.hidden) return; // sekme gizliyken çizme (batarya)
  rafId = requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  const m = state.mode;
  // section modunda kamerayı lookAround kontrol eder (OrbitControls güncellenmez)
  if ((m === 'exterior' || m === 'interior') && !isFlying()) controls.update(dt);
  env.update(dt, camera);
  seats.update(dt, camera.position);
  for (const fn of app.frameCallbacks) fn(dt, t);
  renderer.render(scene, camera);
  if (++frames === 3) ui.hideLoader();
}
rafId = requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !rafId) { clock.getDelta(); rafId = requestAnimationFrame(frame); }
});

// ---- Sonraki adımlar için dışa açılanlar ----
Object.assign(app, {
  state, setMode, quality, renderer, scene, camera, controls, env, lighting,
  stadium, seats,
  sections: stadium.sections, // Map<id, THREE.Group>
  sectionDefs: SECTIONS, sectionById: SECTION_BY_ID,
  exteriorTarget: TARGET,
  ui, flyTo,
});
window.__arena = app; // hata ayıklama / testler
initSections();
initPerf();
