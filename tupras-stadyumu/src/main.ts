import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles.css';

import { Clock, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { detectQuality } from './core/quality.ts';
import { Engine } from './core/engine.ts';
import { loadWorld } from './world/data.ts';
import { buildStadium } from './stadium/index.ts';
import { PITCH_ELEVATION } from './stadium/config.ts';
import { paintGround } from './world/ground.ts';
import { groundMaterial, buildFarTerrain } from './world/terrain.ts';
import { createBuildingMaterial } from './world/buildings.ts';
import { ChunkStreamer, treeMaterial } from './world/streaming.ts';
import { buildWater } from './world/water.ts';
import { buildLandmarks } from './world/landmarks.ts';
import { buildFarCity } from './world/farCity.ts';
import { SunClock } from './lighting/sun.ts';
import { Atmosphere } from './lighting/atmosphere.ts';

const params = new URLSearchParams(location.search);

async function main() {
  const container = document.getElementById('viewport')!;
  const loading = document.getElementById('loading')!;
  const progress = document.getElementById('loading-progress')!;
  const step = (txt: string, p: number) => {
    progress.textContent = txt;
    (document.getElementById('loading-bar') as HTMLElement).style.transform = `scaleX(${p})`;
    return new Promise((r) => requestAnimationFrame(() => r(null)));
  };

  const quality = detectQuality();
  const engine = new Engine(container, quality);
  const { scene, camera, renderer } = engine;

  await step('Şehir verisi yükleniyor', 0.1);
  const world = await loadWorld();
  engine.setWorld(world);

  await step('Tüpraş Stadyumu kuruluyor', 0.3);
  const stadium = buildStadium(world.json.eskiAcik);
  scene.add(stadium.group);

  await step('Boğaz ve çevre hazırlanıyor', 0.55);
  const detailCover = paintGround(world, 0, 0, 1600, 2048);
  const wideSize = Math.max(4000, world.chunkSize * 2 * Math.max(...world.chunkMax.map(Math.abs), ...world.chunkMin.map(Math.abs)) + 800);
  const wideCover = paintGround(world, 0, 0, wideSize, quality.tier === 'high' ? 4096 : 2048);
  const groundDetail = groundMaterial(detailCover, { uNight: engine.uNight });
  const groundWide = groundMaterial(wideCover, { uNight: engine.uNight });
  const buildingsMat = createBuildingMaterial({ uNight: engine.uNight });
  const streamer = new ChunkStreamer(world, { groundDetail, groundWide, buildings: buildingsMat, trees: treeMaterial() }, detailCover, wideCover, quality);
  scene.add(streamer.group);
  const far = buildFarTerrain(world, streamer.halfExtent, ChunkStreamer.PINNED_RADIUS);
  scene.add(far);
  const farCity = buildFarCity(world, engine.uNight, quality.tier === 'low' ? 120 : 80, 0);
  scene.add(farCity);
  const water = buildWater();
  scene.add(water.mesh);
  const landmarks = buildLandmarks(world);
  scene.add(landmarks.group);

  await step('Işık ve atmosfer', 0.75);
  const clock = new SunClock();
  const tParam = params.get('t');
  if (tParam) {
    const [h, m] = tParam.split(':').map(Number);
    clock.setOverride(h * 60 + (m || 0));
  }
  const atmosphere = new Atmosphere(world, scene, renderer, quality, PITCH_ELEVATION);

  // camera & controls (STEP 01 inspection)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxDistance = 6000;
  const camP = params.get('cam');
  const lookP = params.get('look');
  camera.position.set(-260, PITCH_ELEVATION + 210, 330);
  controls.target.set(0, PITCH_ELEVATION + 8, 0);
  if (camP) camera.position.fromArray(camP.split(',').map(Number));
  if (lookP) controls.target.fromArray(lookP.split(',').map(Number));
  if (params.get('fov')) camera.fov = Number(params.get('fov'));
  camera.updateProjectionMatrix();
  controls.update();

  await step('Görünür alan yükleniyor', 0.9);
  camera.updateMatrixWorld();
  streamer.primeAll(camera);
  atmosphere.update(clock.now().sun, camera.position, 0, true);

  const hud = document.getElementById('debug')!;
  const debug = params.has('debug');
  hud.hidden = !debug;
  const timeLabel = document.getElementById('time-label')!;
  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  const liveBtn = document.getElementById('time-live')!;
  timeSlider.addEventListener('input', () => {
    clock.setOverride(Number(timeSlider.value));
  });
  liveBtn.addEventListener('click', () => clock.setOverride(null));

  const timer = new Clock();
  let frames = 0;
  let acc = 0;
  let fps = 0;
  let elapsed = 0;
  const tmp = new Vector3();
  function frame() {
    const dt = Math.min(0.1, timer.getDelta());
    elapsed += dt;
    controls.update();
    // never let the free camera dip under the terrain
    const ground = world.heightAt(camera.position.x, camera.position.z) + 1.6;
    if (camera.position.y < ground) camera.position.y = ground;
    const ts = clock.now();
    atmosphere.update(ts.sun, camera.position, dt);
    const f = atmosphere.factors;
    engine.uNight.value = f.night * 0.9 + f.lights * 0.1;
    groundDetail.emissiveIntensity = groundWide.emissiveIntensity = f.night * 0.5;
    stadium.materials.setAtmosphere(f.day, f.lights);
    streamer.setNight(f.night);
    water.update(elapsed);
    water.setNight(f.night);
    landmarks.update(elapsed, f.night);
    streamer.update(camera);
    stadium.seats.update(camera);
    engine.updateClipPlanes();
    renderer.render(scene, camera);

    timeLabel.textContent = ts.label;
    if (ts.live) timeSlider.value = String(Math.round(ts.wallMinutes));
    liveBtn.classList.toggle('active', ts.live);
    frames++;
    acc += dt;
    if (acc > 0.5) {
      fps = frames / acc;
      frames = 0;
      acc = 0;
      if (debug) {
        const info = renderer.info;
        hud.textContent = [
          `${fps.toFixed(0)} fps · ${quality.tier} · ${engine.reversedDepth ? 'reversed-z' : 'near ' + camera.near.toFixed(2)}`,
          `draw ${info.render.calls} · tris ${(info.render.triangles / 1000).toFixed(0)}k`,
          `chunks ${streamer.stats.loaded} (lod0 ${streamer.stats.lod0}) · queue ${streamer.stats.queued} · pool ${streamer.stats.pooled}`,
          `geo ${info.memory.geometries} · tex ${info.memory.textures}`,
          `sun ${ts.sun.altitude.toFixed(1)}° / ${ts.sun.azimuth.toFixed(0)}° · cam ${camera.position.toArray().map((v) => v.toFixed(0)).join(',')}`,
          `seats ${stadium.layout.seats.count} · stadium tris ${(stadium.stats.triangles / 1000).toFixed(0)}k`,
        ].join('\n');
      }
    }
    void tmp;
    requestAnimationFrame(frame);
  }
  loading.classList.add('done');
  setTimeout(() => loading.remove(), 900);
  requestAnimationFrame(frame);

  // handle for automated checks
  (window as unknown as { __app: unknown }).__app = { engine, stadium, streamer, atmosphere, clock, controls, world };
  document.body.dataset.ready = '1';
}

main().catch((e) => {
  console.error(e);
  const p = document.getElementById('loading-progress');
  if (p) p.textContent = 'Yükleme hatası: ' + (e as Error).message;
});
