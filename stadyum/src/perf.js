import { app } from './app.js';
import { onModeChange } from './state.js';

// Otomatik performans: iç görünüme girişten sonra ~2 sn FPS ölçülür; ortalama < 30 ise düşük kaliteye geçilir.
// (?kalite= ile zorlanan profilde otomatik geçiş yapılmaz.)
const WARMUP = 0.7, WINDOW = 2.2, MIN_FPS = 30;

export function downgradeToLow(reason = 'auto') {
  const { quality, renderer, scene, lighting, seats, ui } = app;
  if (quality.name === 'low' && quality.downgraded) return false;
  quality.name = 'low';
  quality.downgraded = reason;
  quality.pixelRatio = 1;
  quality.shadows = false;
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  if (renderer.shadowMap.enabled) {
    renderer.shadowMap.enabled = false;
    lighting.sun.castShadow = false;
    scene.traverse((o) => {
      if (o.receiveShadow) o.receiveShadow = false;
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.needsUpdate = true; });
    });
  }
  seats.setDensity('low');
  app.shell?.downscaleRoof(); // GLB çatı dokusu 4096² -> 2048² (GPU belleği ve doku bant genişliği)
  ui.showHint('Performans modu açıldı: daha akıcı görüntü için ayrıntılar azaltıldı', 4500);
  return true;
}

export function initPerf() {
  const params = new URLSearchParams(location.search);
  const forced = params.get('kalite') === 'low' || params.get('kalite') === 'high';
  let measured = false, active = false, t = 0, frames = 0;
  onModeChange((mode, prev) => {
    if (mode === 'interior' && prev === 'entering' && !measured && !forced) {
      measured = active = true; t = 0; frames = 0;
    } else if (mode !== 'interior' && mode !== 'section') active = false;
  });
  app.frameCallbacks.add((dt) => {
    if (!active) return;
    t += dt;
    if (t < WARMUP) return;
    frames++;
    if (t >= WARMUP + WINDOW) {
      active = false;
      const fps = frames / (t - WARMUP);
      app.perf.fps = fps;
      if (fps < MIN_FPS) downgradeToLow('fps ' + fps.toFixed(1));
    }
  });
  app.perf = { fps: null, forced };
}
