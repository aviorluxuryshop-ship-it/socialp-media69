import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { state, setMode } from './state.js';
import { isFlying, flyTo } from './camera/flyTo.js';
import { app } from './app.js';
import { getQuality } from './quality.js';
import { buildStadium } from './scene/stadium.js';
import { loadShell } from './scene/shell.js';
import { buildEnvironment } from './scene/environment.js';
import { createLighting, readHour } from './scene/lighting.js';
import { createOverlay } from './ui/overlay.js';
import { SECTIONS, SECTION_BY_ID } from './data/sections.js';
import './style.css';
import './ui/sections.css';
import { initSections } from './sections.js';
import { createSeats } from './scene/seats.js';
import { initPerf } from './perf.js';
import { clampInterior } from './flow.js';

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
controls.maxDistance = 1500;
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

// Sinematik görünüm: Boğaz ve köprü arka planda kalsın diye otomatik dönüş sürekli dönmez, ±55° salınır.
const DIR0 = new THREE.Vector3(-0.92, 0.27, -0.34).normalize(); // Batı'dan bakış: stadyumun ardında Boğaz + köprü
const AZ0 = Math.atan2(DIR0.x, DIR0.z), SWAY = 0.95;
let swaySign = 1;
function sway() {
  let rel = controls.getAzimuthalAngle() - AZ0;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  if (rel < -SWAY) swaySign = -1; else if (rel > SWAY) swaySign = 1;
  controls.autoRotateSpeed = 0.45 * swaySign;
}

function fitCamera(initial) {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const dist = 400 * (camera.aspect < 1 ? Math.pow(camera.aspect, -0.6) : 1);
  if (initial) {
    camera.position.copy(TARGET).addScaledVector(DIR0, dist);
  }
  camera.updateProjectionMatrix();
}
fitCamera(true);
window.addEventListener('resize', () => fitCamera(false));

// ---- Başlatma: GLB kabuğu indirilirken çevre (world.js) üretilir; kabuk gelmeden ilk kare çizilmez ----
// Yükleme çubuğu GLB indirmesinin gerçek ilerlemesini gösterir (0.04 -> 0.80), ardından ayrıştırma/kurulum ve ilk kareler.
const nextPaint = () => new Promise((r) => { requestAnimationFrame(() => r()); setTimeout(r, 120); }); // gizli sekmede rAF çalışmaz

async function boot() {
  ui.setProgress(0.04);
  const shellP = loadShell(quality, renderer, (p) => ui.setProgress(0.04 + 0.76 * p));
  shellP.catch(() => {}); // hata aşağıda ele alınır (yakalanmamış reddedilme uyarısı çıkmasın)
  await nextPaint();       // yükleme ekranı çizilsin, indirme sürerken ana iş parçacığı meşgul olacak
  const env = buildEnvironment(quality);
  scene.add(env.group);
  let shell;
  try { shell = await shellP; } catch (err) {
    console.error('Stadyum modeli yüklenemedi:', err);
    ui.setLoaderError('Stadyum modeli yüklenemedi. Sayfayı yenileyin.');
    return;
  }
  ui.setProgress(0.88);
  const stadium = buildStadium(quality, shell);
  scene.add(stadium.group);
  const lighting = createLighting({ scene, renderer, quality, env, stadium });
  // 3D koltuklar: yalnız iç görünümde, ilk girişte üretilir (dışarıda hiç koltuk çizilmez)
  const seats = createSeats({ stadium, quality });
  scene.add(seats.group);
  ui.setProgress(0.95);

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
    if ((m === 'exterior' || m === 'interior') && !isFlying()) {
      if (m === 'exterior' && controls.autoRotate) sway();
      controls.update(dt);
      if (m === 'interior') clampInterior(camera); // çatı altında / kase içinde kal
    }
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
    stadium, seats, shell,
    sections: stadium.sections, // Map<id, THREE.Group>
    sectionDefs: SECTIONS, sectionById: SECTION_BY_ID,
    exteriorTarget: TARGET,
    ui, flyTo,
  });
  window.__arena = app; // hata ayıklama / testler
  initSections();
  initPerf();
}

boot();
