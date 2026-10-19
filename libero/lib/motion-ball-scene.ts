/* ───────────────────────────────────────────────────────────
   Hero futbol topu — three.js sahnesi. Bu dosya yalnızca dinamik içe aktarmayla
   (components/HeroBall.tsx) yüklenir; ilk boyamayı ve ana paketi asla geciktirmez.

   • Geometri: SphereGeometry; doku: prosedürel renk/normal/pürüzlülük (motion-ball-maps.ts)
   • Malzeme: MeshPhysicalMaterial (PBR + vernik) · ortam: PMREM ile üretilen stadyum ışık sahnesi
   • Işık: anahtar + volt (accent) kenar ışığı; zemin parıltısı CSS tarafında
   • Etkileşim: sürükleyerek döndürme + eylemsizlik, imleç eğimi, kaydırma bağlantılı dönüş
   • Güç: ekran dışında/sekme gizliyken döngü durur; DPR en çok 2; çıkışta tüm GPU kaynakları serbest
   • animate=false (hareket azaltma): tek sabit kare
   ─────────────────────────────────────────────────────────── */
import {
  ACESFilmicToneMapping,
  BackSide,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type WebGLRenderTarget,
} from 'three';
import { BALL_START_EULER } from './motion-ball-geometry';
import { createBallMapJob, type BallMaps } from './motion-ball-maps';
import type { BallPlan } from './motion';

export type BallState = 'ready' | 'failed';
export interface BallHandle {
  dispose(): void;
}

const FOV = 24;
const IDLE_SPIN = 0.2; // rad/s
const MAX_SPIN = 14;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function yieldToMain(): Promise<void> {
  const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sch?.yield) return sch.yield();
  return new Promise((res) => setTimeout(res, 0));
}

/** Dokuları ana iş parçacığını bloklamadan, ~6 ms'lik dilimlerle üretir. */
async function buildMaps(w: number, h: number, aborted: () => boolean): Promise<BallMaps | null> {
  const job = createBallMapJob(w, h);
  let t = performance.now();
  while (!job.done) {
    if (aborted()) return null;
    job.step(4);
    if (performance.now() - t > 6) {
      await yieldToMain();
      t = performance.now();
    }
  }
  return job.result();
}

function toCanvas(data: Uint8ClampedArray, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d bağlam yok');
  ctx.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
  return c;
}

/** Stadyum geceliği ışık sahnesi: yumuşak anahtar ışık kutusu, volt kenar şeridi, çimden yansıma, soğuk üst dolgu. */
function buildEnvironment(renderer: WebGLRenderer): WebGLRenderTarget {
  const env = new Scene();
  const disposables: { dispose(): void }[] = [];
  const add = (mesh: Mesh) => {
    env.add(mesh);
    disposables.push(mesh.geometry, mesh.material as MeshBasicMaterial);
  };
  add(new Mesh(new SphereGeometry(30, 32, 16), new MeshBasicMaterial({ color: new Color(0x06100d), side: BackSide })));
  const panel = (w: number, h: number, pos: [number, number, number], color: number, intensity: number) => {
    const m = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });
    const mesh = new Mesh(new PlaneGeometry(w, h), m);
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    add(mesh);
  };
  panel(10, 7, [-9, 10, 7], 0xffffff, 8); // anahtar ışık kutusu (sol üst, önde)
  panel(3, 16, [10, 2, -8], 0xc2f53c, 7); // volt kenar şeridi (sağ arka)
  panel(18, 12, [0, -11, 2], 0x1f9d63, 1.1); // çim yansıması (alttan)
  panel(16, 10, [0, 13, -4], 0x7cc4ff, 1.5); // soğuk üst dolgu
  panel(6, 4, [9, 6, 8], 0xffe9c4, 2.4); // sağ ön sıcak dolgu
  const pm = new PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.035);
  pm.dispose();
  disposables.forEach((d) => d.dispose());
  return rt;
}

export async function mountBall(
  stage: HTMLElement,
  plan: BallPlan,
  onState: (s: BallState) => void,
): Promise<BallHandle | null> {
  let dead = false;
  const aborted = () => dead;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  } catch {
    onState('failed');
    return null;
  }
  const canvas = renderer.domElement;
  canvas.className = 'hero-ball__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const disposeList: { dispose(): void }[] = [];
  const cleanups: (() => void)[] = [];
  let raf = 0;

  const dispose = () => {
    if (dead) return;
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    cleanups.forEach((c) => c());
    disposeList.forEach((d) => d.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  try {
    // ── doku üretimi (dilimli) ──
    const [tw, th] = plan.texture === 'high' ? [2048, 1024] : [1024, 512];
    const maps = await buildMaps(tw, th, aborted);
    if (!maps || dead) {
      dispose();
      return null;
    }

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
    const dist = 1 / Math.sin((FOV * Math.PI) / 180 / 2 / 1.06);
    camera.position.set(0, 0, dist);

    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const map = new CanvasTexture(toCanvas(maps.color, maps.w, maps.h));
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = aniso;
    const normalMap = new CanvasTexture(toCanvas(maps.normal, maps.w, maps.h));
    normalMap.colorSpace = NoColorSpace;
    normalMap.anisotropy = aniso;
    const roughMap = new CanvasTexture(toCanvas(maps.rough, maps.rw, maps.rh));
    roughMap.colorSpace = NoColorSpace;
    disposeList.push(map, normalMap, roughMap);

    const material = new MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new Vector2(1.6, 1.6),
      roughnessMap: roughMap,
      roughness: 1,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.32,
      envMapIntensity: 1.15,
    });
    const geometry = new SphereGeometry(1, 96, 64);
    disposeList.push(material, geometry);

    const envRT = buildEnvironment(renderer);
    disposeList.push(envRT);
    scene.environment = envRT.texture;

    const key = new DirectionalLight(0xfff0dc, 1.9);
    key.position.set(-3, 4, 5);
    const rim = new DirectionalLight(0xc2f53c, 1.9);
    rim.position.set(4.5, 1.2, -4);
    scene.add(key, rim);

    const pivot = new Group();
    const ball = new Mesh(geometry, material);
    ball.quaternion.setFromEuler(new Euler(BALL_START_EULER[0], BALL_START_EULER[1], BALL_START_EULER[2], 'XYZ'));
    pivot.add(ball);
    scene.add(pivot);

    // ── boyut ──
    const resize = () => {
      const w = Math.max(1, stage.clientWidth);
      const h = Math.max(1, stage.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    stage.appendChild(canvas);
    resize();

    const draw = () => renderer.render(scene, camera);
    const ro = new ResizeObserver(() => {
      resize();
      if (!plan.animate) draw();
    });
    ro.observe(stage);
    cleanups.push(() => ro.disconnect());

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      onState('failed');
      dispose();
    });

    draw();
    onState('ready');
    if (typeof performance.mark === 'function') performance.mark('libero-ball-ready');

    if (!plan.animate) {
      return { dispose };
    }

    // ── etkileşim ve döngü ──
    let visible = true;
    let tabVisible = document.visibilityState !== 'hidden';
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let vy = IDLE_SPIN;
    let vx = 0;
    let px = 0;
    let py = 0;
    let tiltX = 0;
    let tiltY = 0;
    let lastScroll = window.scrollY;
    let prev = 0;

    const AX = new Vector3(1, 0, 0);
    const AY = new Vector3(0, 1, 0);
    const qd = new Quaternion();
    const spin = (ax: Vector3, ang: number) => {
      if (!ang) return;
      qd.setFromAxisAngle(ax, ang);
      ball.quaternion.premultiply(qd);
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      canvas.setPointerCapture(e.pointerId);
      stage.dataset.drag = 'true';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastT) / 1000;
      const k = 2.6 / Math.max(240, stage.clientHeight);
      const dyaw = (e.clientX - lastX) * k;
      const dpitch = (e.clientY - lastY) * k;
      spin(AY, dyaw);
      spin(AX, dpitch);
      vy = lerp(vy, dyaw / dt, 0.5);
      vx = lerp(vx, dpitch / dt, 0.5);
      vy = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, vy));
      vx = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, vx));
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete stage.dataset.drag;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (performance.now() - lastT > 90) {
        vx = 0; // durup bırakıldı: eylemsizlik yok
        vy = IDLE_SPIN;
      }
    };
    const onHover = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    canvas.style.touchAction = 'pan-y';
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    if (window.matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', onHover, { passive: true });
    cleanups.push(() => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointermove', onHover);
    });

    const tick = (now: number) => {
      raf = 0;
      if (dead || !visible || !tabVisible) return;
      const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0.016);
      prev = now;
      if (!dragging) {
        vx *= Math.exp(-dt * 2.4);
        vy = lerp(vy, IDLE_SPIN, 1 - Math.exp(-dt * 0.9));
        spin(AY, vy * dt);
        spin(AX, vx * dt);
      }
      const sy = window.scrollY;
      const ds = sy - lastScroll;
      lastScroll = sy;
      if (ds) spin(AX, Math.max(-60, Math.min(60, ds)) * 0.0032);
      tiltX = lerp(tiltX, py * 0.1, 1 - Math.exp(-dt * 4));
      tiltY = lerp(tiltY, px * 0.16, 1 - Math.exp(-dt * 4));
      pivot.rotation.set(tiltX, tiltY, 0);
      draw();
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && !dead && visible && tabVisible) {
        prev = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) kick();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(stage);
    const onVis = () => {
      tabVisible = document.visibilityState !== 'hidden';
      if (tabVisible) kick();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    cleanups.push(() => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    });
    kick();
    return { dispose };
  } catch {
    onState('failed');
    dispose();
    return null;
  }
}
