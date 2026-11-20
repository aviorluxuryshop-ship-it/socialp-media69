/**
 * Renderer, camera, scene and the per-frame loop wiring.
 */
import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type IUniform,
} from 'three';
import type { QualitySettings } from './quality.ts';
import type { World } from '../world/data.ts';

export class Engine {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  readonly uNight: IUniform<number> = { value: 0 };
  quality: QualitySettings;
  reversedDepth = false;
  private world: World | null = null;
  private readonly resizeFns: ((w: number, h: number) => void)[] = [];
  /** lens shift (CSS px): target and current, see setLensShift */
  private readonly shiftGoal = { x: 0, y: 0 };
  private readonly shift = { x: 0, y: 0 };

  constructor(container: HTMLElement, quality: QualitySettings) {
    this.quality = quality;
    const renderer = new WebGLRenderer({
      // MSAA happens in the post pipeline's multisampled target
      antialias: false,
      powerPreference: 'high-performance',
      reversedDepthBuffer: !new URLSearchParams(location.search).has('nrz'),
      preserveDrawingBuffer: false,
    });
    this.reversedDepth = renderer.capabilities.reversedDepthBuffer === true;
    renderer.setPixelRatio(quality.pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = PCFShadowMap;
    this.renderer = renderer;
    this.canvas = renderer.domElement;
    container.appendChild(this.canvas);
    this.camera = new PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.5, 60000);
    window.addEventListener('resize', () => this.resize(container));
  }

  setWorld(world: World): void {
    this.world = world;
  }

  onResize(fn: (w: number, h: number) => void): void {
    this.resizeFns.push(fn);
  }

  /** Change the render resolution at runtime (frame governor) and resize every target. */
  setPixelRatio(r: number): void {
    this.renderer.setPixelRatio(r);
    const parent = this.canvas.parentElement;
    if (parent) this.resize(parent);
  }

  resize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.applyShift();
    this.camera.updateProjectionMatrix();
    for (const f of this.resizeFns) f(w, h);
  }

  /**
   * Depth precision: with a reversed float depth buffer a tiny near plane is
   * free; without it the near plane follows the camera's height above the
   * ground so close-ups (seat views) and 3 km panoramas both stay crisp.
   */
  updateClipPlanes(): void {
    const cam = this.camera;
    let near = 0.08;
    if (!this.reversedDepth && this.world) {
      const ground = this.world.heightAt(cam.position.x, cam.position.z);
      const above = Math.max(0, cam.position.y - Math.max(ground, 0));
      near = Math.min(4, Math.max(0.08, above * 0.004));
    }
    if (Math.abs(near - cam.near) / cam.near > 0.2) {
      cam.near = near;
      cam.updateProjectionMatrix();
    }
  }

  /**
   * Off-axis "lens shift": moves the image centre by (x, y) CSS px to the left
   * / up, so whatever the camera aims at sits in the part of the screen no
   * panel covers (left of the desktop side panel, above the phone sheet). The
   * camera pose — and so the view from a seat — is unchanged.
   */
  setLensShift(x: number, y: number, instant = false): void {
    this.shiftGoal.x = x;
    this.shiftGoal.y = y;
    if (instant) {
      this.shift.x = x;
      this.shift.y = y;
      this.applyShift();
    }
  }

  /** Glide the lens shift towards its goal (call once per frame). */
  updateLensShift(dt: number): void {
    const g = this.shiftGoal;
    const s = this.shift;
    if (s.x === g.x && s.y === g.y) return;
    const k = 1 - Math.exp(-dt * 6);
    s.x += (g.x - s.x) * k;
    s.y += (g.y - s.y) * k;
    if (Math.abs(g.x - s.x) < 0.5 && Math.abs(g.y - s.y) < 0.5) {
      s.x = g.x;
      s.y = g.y;
    }
    this.applyShift();
  }

  /** Render with the plain centred projection inside `fn` (ticket capture). */
  withoutLensShift<T>(fn: () => T): T {
    if (!this.camera.view?.enabled) return fn();
    this.camera.clearViewOffset();
    try {
      return fn();
    } finally {
      this.applyShift();
    }
  }

  private applyShift(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const { x, y } = this.shift;
    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, x, y, w, h);
  }

  get pixelRatio(): number {
    return this.renderer.getPixelRatio();
  }

  screenToRay(x: number, y: number, out: Vector3): Vector3 {
    return out.set((x / this.canvas.clientWidth) * 2 - 1, -(y / this.canvas.clientHeight) * 2 + 1, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
  }
}
