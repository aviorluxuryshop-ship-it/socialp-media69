import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles.css';

import { App } from './app.ts';
import { mountViewsBar } from './ui/viewsBar.ts';
import { mountPicker } from './ui/picker.ts';

async function main() {
  const container = document.getElementById('viewport')!;
  const loading = document.getElementById('loading')!;
  const progress = document.getElementById('loading-progress')!;
  const bar = document.getElementById('loading-bar') as HTMLElement;
  const step = (txt: string, p: number) => {
    progress.textContent = txt;
    bar.style.transform = `scaleX(${p})`;
    return new Promise((r) => requestAnimationFrame(() => r(null)));
  };

  const app = new App();
  await app.init(container, step);

  // ---- time of day box
  const timeLabel = document.getElementById('time-label')!;
  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  const liveBtn = document.getElementById('time-live')!;
  timeSlider.addEventListener('input', () => app.clock.setOverride(Number(timeSlider.value)));
  liveBtn.addEventListener('click', () => app.clock.setOverride(null));

  // ---- locked views
  mountViewsBar(app, (v) => app.flyToView(v));

  // ---- seat picker (STEP 05)
  const picker = mountPicker(app);
  (window as unknown as { __picker: unknown }).__picker = picker;

  // ---- debug HUD (?debug)
  const hud = document.getElementById('debug')!;
  const debug = app.params.has('debug');
  hud.hidden = !debug;
  let hudAcc = 0;
  app.onFrame((dt) => {
    const ts = app.time;
    if (ts) {
      timeLabel.textContent = ts.label;
      if (ts.live) timeSlider.value = String(Math.round(ts.wallMinutes));
      liveBtn.classList.toggle('active', ts.live);
    }
    hudAcc += dt;
    if (debug && hudAcc > 0.5) {
      hudAcc = 0;
      const s = app.stats;
      const cam = app.engine.camera.position;
      hud.textContent = [
        `${s.fps.toFixed(0)} fps · cpu ${s.cpuMs.toFixed(1)} ms (p95 ${s.cpuP95.toFixed(1)}) · ${app.quality.tier} · ${app.engine.reversedDepth ? 'reversed-z' : 'near ' + app.engine.camera.near.toFixed(2)}`,
        `draw ${s.calls} · tris ${(s.triangles / 1000).toFixed(0)}k · geo ${s.geometries} · tex ${s.textures}`,
        `chunks ${s.streamer.loaded} (lod0 ${s.streamer.lod0}) · queue ${s.streamer.queued} · pool ${s.streamer.pooled} · built ${s.streamer.created}/${s.streamer.released}`,
        `sun ${ts.sun.altitude.toFixed(1)}° / ${ts.sun.azimuth.toFixed(0)}° · cam ${cam.toArray().map((v) => v.toFixed(0)).join(',')}`,
        `seats ${app.stadium.layout.seats.count} · stadium tris ${(app.stadium.stats.triangles / 1000).toFixed(0)}k · ${app.director.mode}`,
      ].join('\n');
    }
  });

  loading.classList.add('done');
  setTimeout(() => loading.remove(), 900);
  app.start();
  (window as unknown as { __app: App }).__app = app;
  document.body.dataset.ready = '1';
}

main().catch((e) => {
  console.error(e);
  const p = document.getElementById('loading-progress');
  if (p) p.textContent = 'Yükleme hatası: ' + (e as Error).message;
});
