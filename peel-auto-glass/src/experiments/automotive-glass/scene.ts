import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildCar, createMaterials, disposeObject, type Car, type GlassGroup } from "./car";
import { cameraAzimuth, cameraElevation, separation } from "./timeline";

export type StudyScene = {
  /** Apply scroll progress (0..1) to the car, glass and camera. Does not draw. */
  setProgress(p: number): void;
  render(): void;
  resize(width: number, height: number, pixelRatio: number): void;
  /** Screen position (CSS px, relative to the canvas) of each label anchor. */
  anchors(): Record<GlassGroup, { x: number; y: number }>;
  dispose(): void;
};

const TARGET = new THREE.Vector3(0.1, 0.95, 0);

function radialTexture(stops: [number, string][]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function applySeparation(car: Car, sep: ReturnType<typeof separation>) {
  for (const part of car.glass) {
    const t = sep[part.group];
    part.object.position.copy(part.rest).addScaledVector(part.offset, t);
    part.object.rotation.set(part.tilt.x * t, part.tilt.y * t, part.tilt.z * t);
  }
}

export function createStudyScene(canvas: HTMLCanvasElement, opts: { compact: boolean }): StudyScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(opts.compact ? 38 : 30, 1, 0.1, 80);

  // Lights: a warm key from the front-left, a cool rim from behind, soft fill.
  const key = new THREE.DirectionalLight(0xfff1de, 1.9);
  key.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0x6f9bff, 3.2);
  rim.position.set(-5, 3.5, -4);
  const fill = new THREE.DirectionalLight(0x9fb6ff, 0.8);
  fill.position.set(2, 1.5, -5);
  scene.add(key, rim, fill);

  const materials = createMaterials();
  const car = buildCar(materials);
  scene.add(car.root);

  // Reflection: a mirrored second car seen through a translucent floor (skipped on small screens).
  let mirrored: Car | null = null;
  if (!opts.compact) {
    mirrored = buildCar(materials);
    mirrored.root.scale.y = -1;
    scene.add(mirrored.root);
  }

  const floorAlpha = radialTexture([
    [0, "#e8e8e8"],
    [0.5, "#a0a0a0"],
    [1, "#000000"],
  ]);
  floorAlpha.colorSpace = THREE.NoColorSpace; // alpha values are literal, not colour-managed
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(11, 72),
    new THREE.MeshBasicMaterial({
      color: 0x0b1530,
      alphaMap: floorAlpha,
      transparent: true,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const shadowTex = radialTexture([
    [0, "rgba(0,0,0,0.85)"],
    [0.6, "rgba(0,0,0,0.35)"],
    [1, "rgba(0,0,0,0)"],
  ]);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 2.9),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  scene.add(shadow);

  let width = 1;
  let height = 1;
  const tmp = new THREE.Vector3();

  function frame(p: number) {
    const az = THREE.MathUtils.degToRad(cameraAzimuth(p));
    const el = THREE.MathUtils.degToRad(cameraElevation(p));
    const aspect = width / height;
    // Pull back on narrow screens so the exploded glass stays in frame.
    const base = opts.compact ? 11.5 : 9.4;
    const radius = THREE.MathUtils.clamp(base * Math.max(1, 1.05 / aspect), base, opts.compact ? 23 : 16);
    camera.position.set(
      TARGET.x + radius * Math.cos(el) * Math.cos(az),
      TARGET.y + radius * Math.sin(el),
      TARGET.z + radius * Math.cos(el) * Math.sin(az),
    );
    camera.lookAt(TARGET.x, TARGET.y + (opts.compact ? 0.15 : 0.2), TARGET.z);
  }

  let progress = 0;

  return {
    setProgress(p) {
      progress = p;
      const sep = separation(p);
      applySeparation(car, sep);
      if (mirrored) applySeparation(mirrored, sep);
      // Glass outlines become more prominent as the panes separate.
      materials.edge.opacity = 0.28 + 0.62 * Math.max(sep.windshield, sep.side, sep.rear);
      frame(p);
    },
    render() {
      renderer.render(scene, camera);
    },
    resize(w, h, pixelRatio) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      frame(progress);
    },
    anchors() {
      camera.updateMatrixWorld();
      const out = {} as Record<GlassGroup, { x: number; y: number }>;
      for (const group of ["windshield", "side", "rear"] as const) {
        car.anchors[group].getWorldPosition(tmp);
        tmp.project(camera);
        out[group] = { x: ((tmp.x + 1) / 2) * width, y: ((1 - tmp.y) / 2) * height };
      }
      return out;
    },
    dispose() {
      disposeObject(scene);
      floorAlpha.dispose();
      shadowTex.dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
