/**
 * Post-processing chain:
 *   scene → multisampled HDR target → [bloom at night, high tier] →
 *   [mask/highlight compositing, STEP 04] → tone mapping + sRGB output.
 */
import { HalfFloatType, Vector2, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { QualitySettings } from './quality.ts';

export class PostPipeline {
  readonly composer: EffectComposer;
  readonly renderPass: RenderPass;
  readonly bloom: UnrealBloomPass | null;
  readonly output: OutputPass;
  private readonly renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera, q: QualitySettings) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new Vector2());
    const msaa = new URLSearchParams(location.search).get('msaa');
    const samples = msaa !== null ? Number(msaa) : q.antialias ? 4 : 0;
    const rt = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples });
    this.composer = new EffectComposer(renderer, rt);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    this.bloom = q.bloom ? new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.0, 0.4, 2.2) : null;
    if (this.bloom) {
      this.bloom.enabled = false;
      this.composer.addPass(this.bloom);
    }
    this.output = new OutputPass();
    this.composer.addPass(this.output);
  }

  /** Insert a pass just before the output (tone mapping) pass. */
  insertBeforeOutput(pass: Pass): void {
    const i = this.composer.passes.indexOf(this.output);
    this.composer.insertPass(pass, i);
  }

  setSize(w: number, h: number): void {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
  }

  /** Night glow for floodlights, windows and street lamps (0 = off). */
  setBloom(strength: number): void {
    if (!this.bloom) return;
    this.bloom.strength = strength;
    this.bloom.enabled = strength > 0.01;
  }

  render(dt: number): void {
    this.composer.render(dt);
  }
}
