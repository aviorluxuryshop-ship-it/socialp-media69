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

  resize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
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

  get pixelRatio(): number {
    return this.renderer.getPixelRatio();
  }

  screenToRay(x: number, y: number, out: Vector3): Vector3 {
    return out.set((x / this.canvas.clientWidth) * 2 - 1, -(y / this.canvas.clientHeight) * 2 + 1, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
  }
}
