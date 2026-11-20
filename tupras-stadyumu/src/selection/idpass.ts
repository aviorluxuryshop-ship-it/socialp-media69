/**
 * ID pass (STEP 04): renders the SAME scene from the SAME camera with every
 * seat writing its own index and every terrace writing its block index, all
 * other geometry as plain occluders. The result is the mask image used for
 * the highlight compositing and for GPU picking.
 *
 * Encoding (24-bit RGB, exact integers):
 *   0                world / sky
 *   1 … 0x3FFFFF      seat index + 1
 *   0x400000          stadium structure (roof, facade, fascia …)
 *   0x800000 + b      terrace concrete of block b
 */
import {
  DataTexture,
  GLSL3,
  LinearSRGBColorSpace,
  Color,
  Material,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Object3D,
  PerspectiveCamera,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
  Vector3,
  WebGLRenderTarget,
  type Scene,
  type WebGLRenderer,
  type InstancedMesh,
} from 'three';
import type { Stadium } from '../stadium/index.ts';

export const ID_STRUCTURE = 0x400000;
export const ID_BLOCK = 0x800000;

const seatVertex = /* glsl */ `
  uniform float uSeatStart;
  flat out float vId;
  void main() {
    vId = uSeatStart + float(gl_InstanceID) + 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }`;

const blockVertex = /* glsl */ `
  in float blockId;
  flat out float vId;
  void main() {
    vId = blockId > 0.5 ? ${ID_BLOCK.toFixed(1)} + blockId - 1.0 : ${ID_STRUCTURE.toFixed(1)};
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const encodeFragment = /* glsl */ `
  flat in float vId;
  layout(location = 0) out highp vec4 idColor;
  void main() {
    float id = vId;
    float r = mod(id, 256.0);
    float g = mod(floor(id / 256.0), 256.0);
    float b = floor(id / 65536.0);
    idColor = vec4(r / 255.0, g / 255.0, b / 255.0, 1.0);
  }`;

export function decodeId(r: number, g: number, b: number): number {
  return r + g * 256 + b * 65536;
}

export interface PickResult {
  id: number;
  seat: number; // −1 if none
  block: number; // −1 if none
}

export class IdPass {
  readonly target: WebGLRenderTarget;
  private readonly pickTarget: WebGLRenderTarget;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly stadium: Stadium;
  private readonly blockMat: ShaderMaterial;
  private readonly structureMat: MeshBasicMaterial;
  private readonly worldMat: MeshBasicMaterial;
  private readonly swapped: { o: Object3D; m: Material | Material[]; v?: boolean }[] = [];
  private readonly pickBuf = new Uint8Array(4);
  /** per-seat info for the compositing shader: R shade | sold << 2, G row, B/A block index */
  readonly info: DataTexture;
  private readonly infoData: Uint8Array;
  private readonly stadiumObjects = new Set<Object3D>();
  /** per-block flags (1 = part of the hovered set, e.g. a whole stand) */
  readonly blockSet: DataTexture;
  private readonly blockSetData = new Uint8Array(256 * 4);

  constructor(renderer: WebGLRenderer, scene: Scene, stadium: Stadium) {
    this.renderer = renderer;
    this.scene = scene;
    this.stadium = stadium;
    const opts = { type: UnsignedByteType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: true, samples: 0 };
    this.target = new WebGLRenderTarget(4, 4, opts);
    this.pickTarget = new WebGLRenderTarget(1, 1, opts);

    // one ID material per seat mesh (the seat start differs)
    for (const p of stadium.seats.pairs) {
      for (const m of [p.detailed, p.simple, p.far]) {
        m.userData.idMaterial = new ShaderMaterial({
          glslVersion: GLSL3,
          uniforms: { uSeatStart: { value: p.seatStart } },
          vertexShader: seatVertex,
          fragmentShader: encodeFragment,
        });
      }
    }
    this.blockMat = new ShaderMaterial({ glslVersion: GLSL3, vertexShader: blockVertex, fragmentShader: encodeFragment });
    const enc = (id: number) => new Color().setRGB((id % 256) / 255, (Math.floor(id / 256) % 256) / 255, Math.floor(id / 65536) / 255, LinearSRGBColorSpace);
    this.structureMat = new MeshBasicMaterial({ color: enc(ID_STRUCTURE), toneMapped: false, fog: false });
    this.worldMat = new MeshBasicMaterial({ color: 0x000000, toneMapped: false, fog: false });
    stadium.group.traverse((o) => this.stadiumObjects.add(o));

    // seat info texture (256 × N)
    const S = stadium.layout.seats;
    const h = Math.ceil(S.count / 256);
    this.infoData = new Uint8Array(256 * h * 4);
    this.info = new DataTexture(this.infoData, 256, h, RGBAFormat, UnsignedByteType);
    this.info.minFilter = this.info.magFilter = NearestFilter;
    this.info.colorSpace = LinearSRGBColorSpace;
    this.refreshInfo();
    this.blockSet = new DataTexture(this.blockSetData, 256, 1, RGBAFormat, UnsignedByteType);
    this.blockSet.minFilter = this.blockSet.magFilter = NearestFilter;
    this.blockSet.needsUpdate = true;
  }

  setBlockSet(blocks: number[]): void {
    this.blockSetData.fill(0);
    for (const b of blocks) if (b >= 0 && b < 256) this.blockSetData[b * 4] = 255;
    this.blockSet.needsUpdate = true;
  }

  /** Re-encode seat shade / sold state / block for the compositing shader. */
  refreshInfo(): void {
    const S = this.stadium.layout.seats;
    for (let i = 0; i < S.count; i++) {
      this.infoData[i * 4] = S.shade[i] | ((S.sold[i] === 1 ? 1 : 0) << 2);
      this.infoData[i * 4 + 1] = S.row[i];
      this.infoData[i * 4 + 2] = S.block[i] % 256;
      this.infoData[i * 4 + 3] = Math.floor(S.block[i] / 256);
    }
    this.info.needsUpdate = true;
  }

  setSize(w: number, h: number): void {
    this.target.setSize(w, h);
  }

  private swapIn(camera: PerspectiveCamera): void {
    const camPos = camera.position;
    // objects farther than the stadium's far side can never occlude it
    const reach = camPos.distanceTo(new Vector3(0, camPos.y, 0)) + 260;
    this.scene.traverse((o) => {
      const any = o as Mesh & { isPoints?: boolean; isLine?: boolean; isSprite?: boolean };
      if (!any.visible) return;
      if (any.isPoints || any.isLine || any.isSprite) {
        this.swapped.push({ o, m: any.material, v: true });
        any.visible = false;
        return;
      }
      if (!any.isMesh) return;
      const mat = any.material as Material;
      const idm = o.userData.idMaterial as Material | undefined;
      if (idm) {
        this.swapped.push({ o, m: mat });
        any.material = idm;
        return;
      }
      if (any.geometry.getAttribute('blockId')) {
        this.swapped.push({ o, m: mat });
        any.material = this.blockMat;
        return;
      }
      if ((mat as Material).transparent || o.name === 'bosphorus') {
        // glass, nets, the sea: not occluders for the seats
        this.swapped.push({ o, m: mat, v: true });
        any.visible = false;
        return;
      }
      if (!this.stadiumObjects.has(o)) {
        any.geometry.boundingSphere ?? any.geometry.computeBoundingSphere();
        const bs = any.geometry.boundingSphere!;
        const c = bs.center.clone().applyMatrix4(o.matrixWorld);
        if (c.distanceTo(camPos) - bs.radius > reach || o.name.startsWith('far-terrain') || o.name.startsWith('far-city')) {
          this.swapped.push({ o, m: mat, v: true });
          any.visible = false;
          return;
        }
      }
      this.swapped.push({ o, m: mat });
      any.material = this.stadiumObjects.has(o) ? this.structureMat : this.worldMat;
    });
  }

  private swapOut(): void {
    for (const s of this.swapped) {
      const m = s.o as Mesh;
      m.material = s.m;
      if (s.v) m.visible = true;
    }
    this.swapped.length = 0;
  }

  private renderTo(target: WebGLRenderTarget, camera: PerspectiveCamera): void {
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevClear = r.getClearColor(new Color());
    const prevAlpha = r.getClearAlpha();
    const prevAuto = r.shadowMap.autoUpdate;
    const fog = this.scene.fog;
    const bg = this.scene.background;
    const env = this.scene.environment;
    const override = this.scene.overrideMaterial;
    this.scene.fog = null;
    this.scene.background = null;
    this.scene.overrideMaterial = null;
    r.shadowMap.autoUpdate = false;
    this.swapIn(camera);
    r.setRenderTarget(target);
    r.setClearColor(0x000000, 1);
    r.clear(true, true, true);
    r.render(this.scene, camera);
    this.swapOut();
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevClear, prevAlpha);
    r.shadowMap.autoUpdate = prevAuto;
    this.scene.fog = fog;
    this.scene.background = bg;
    this.scene.environment = env;
    this.scene.overrideMaterial = override;
  }

  /** Full-resolution mask of the current view. */
  render(camera: PerspectiveCamera): void {
    this.renderTo(this.target, camera);
  }

  /** GPU pick at CSS pixel (x, y): renders a 1 × 1 window of the same view. */
  pick(camera: PerspectiveCamera, x: number, y: number, cssW: number, cssH: number): PickResult {
    const pr = this.renderer.getPixelRatio();
    const W = Math.round(cssW * pr);
    const H = Math.round(cssH * pr);
    camera.setViewOffset(W, H, Math.round(x * pr), Math.round(y * pr), 1, 1);
    this.renderTo(this.pickTarget, camera);
    camera.clearViewOffset();
    this.renderer.readRenderTargetPixels(this.pickTarget, 0, 0, 1, 1, this.pickBuf);
    return this.decode(decodeId(this.pickBuf[0], this.pickBuf[1], this.pickBuf[2]));
  }

  /** Read back the whole mask (tests). */
  readMask(): Uint8Array {
    const { width, height } = this.target;
    const buf = new Uint8Array(width * height * 4);
    this.renderer.readRenderTargetPixels(this.target, 0, 0, width, height, buf);
    return buf;
  }

  decode(id: number): PickResult {
    if (id >= ID_BLOCK) return { id, seat: -1, block: id - ID_BLOCK };
    if (id >= 1 && id < ID_STRUCTURE) {
      const seat = id - 1;
      return { id, seat, block: this.stadium.layout.seats.block[seat] };
    }
    return { id, seat: -1, block: -1 };
  }
}

export type { InstancedMesh };
