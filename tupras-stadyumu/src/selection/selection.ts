/**
 * Selection state and the glue between the ID pass, the highlight pass and
 * pointer input.
 */
import { Vector2, Vector3, type PerspectiveCamera, type WebGLRenderer, type Scene } from 'three';
import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { Stadium } from '../stadium/index.ts';
import { PITCH_ELEVATION } from '../stadium/config.ts';
import { IdPass, decodeId, type PickResult } from './idpass.ts';
import { createHighlightPass } from './highlight.ts';

export interface SelectionState {
  block: number;
  /** row of the selected block being browsed (1-based, −1 none) */
  row: number;
  seat: number;
  hoverSeat: number;
  hoverBlock: number;
  mask: boolean;
  availability: boolean;
}

export class Selection {
  readonly idPass: IdPass;
  readonly pass: ShaderPass;
  readonly state: SelectionState = { block: -1, row: -1, seat: -1, hoverSeat: -1, hoverBlock: -1, mask: false, availability: false };
  /** hover picking on/off (the seat picker turns it on) */
  hoverEnabled = false;
  private readonly stadium: Stadium;
  private readonly camera: PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private pointer: { x: number; y: number } | null = null;
  private pointerDirty = false;
  private lastPick = 0;
  private readonly hoverListeners: ((p: PickResult) => void)[] = [];
  private readonly clickListeners: ((p: PickResult) => void)[] = [];

  constructor(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, stadium: Stadium) {
    this.camera = camera;
    this.stadium = stadium;
    this.canvas = renderer.domElement;
    this.idPass = new IdPass(renderer, scene, stadium);
    this.pass = createHighlightPass(this.idPass.target.texture, this.idPass.info, this.idPass.blockSet);
    this.pass.enabled = false;
    const size = renderer.getDrawingBufferSize(new Vector2());
    this.setSize(size.x, size.y);

    // pointer: hover (throttled GPU pick) and click (tap) without fighting the orbit drag
    let down: { x: number; y: number; t: number } | null = null;
    this.canvas.addEventListener('pointermove', (e) => {
      this.pointer = { x: e.offsetX, y: e.offsetY };
      this.pointerDirty = true;
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.pointer = null;
      this.setHover({ id: 0, seat: -1, block: -1 });
    });
    this.canvas.addEventListener('pointerdown', (e) => (down = { x: e.offsetX, y: e.offsetY, t: performance.now() }));
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.offsetX - down.x, e.offsetY - down.y);
      const quick = performance.now() - down.t < 450;
      down = null;
      if (moved > 6 || !quick) return;
      const p = this.pickAt(e.offsetX, e.offsetY);
      for (const l of this.clickListeners) l(p);
    });
  }

  onHover(fn: (p: PickResult) => void): void {
    this.hoverListeners.push(fn);
  }

  onClick(fn: (p: PickResult) => void): void {
    this.clickListeners.push(fn);
  }

  setSize(w: number, h: number): void {
    this.idPass.setSize(w, h);
    (this.pass.uniforms.uRes.value as Vector2).set(w, h);
  }

  pickAt(x: number, y: number): PickResult {
    return this.idPass.pick(this.camera, x, y, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  private setHover(p: PickResult): void {
    const s = this.state;
    if (s.hoverSeat === p.seat && s.hoverBlock === p.block) return;
    s.hoverSeat = p.seat;
    s.hoverBlock = p.block;
    for (const l of this.hoverListeners) l(p);
  }

  private hoverSet: number[] = [];
  private neutralKey = '';
  /** Blocks tinted as a group (a stand under the pointer in the stand list). */
  setHoverSet(blocks: number[]): void {
    this.hoverSet = blocks.slice();
    this.idPass.setBlockSet(blocks);
  }

  /** Highlighted blocks are drawn with a neutral albedo in the beauty pass (see SeatSystem). */
  private syncNeutral(): void {
    const s = this.state;
    const hb = this.hoverEnabled ? s.hoverBlock : -1;
    const key = `${s.block}|${hb}|${this.hoverSet.join(',')}`;
    if (key === this.neutralKey) return;
    this.neutralKey = key;
    this.stadium.seats.setNeutralBlocks([s.block, hb, ...this.hoverSet]);
  }

  selectBlock(block: number): void {
    this.state.block = block;
  }

  selectSeat(seat: number): void {
    this.state.seat = seat;
  }

  setMask(on: boolean): void {
    this.state.mask = on;
  }

  setAvailability(on: boolean): void {
    this.state.availability = on;
    this.stadium.seats.setAvailabilityMode(on);
  }

  /** Mark seats sold/free (e.g. after a purchase) and refresh both passes. */
  refreshSold(): void {
    this.idPass.refreshInfo();
    this.stadium.seats.refreshAllColors();
  }

  /** Call once per frame before the composer renders. */
  prepare(time: number): void {
    const s = this.state;
    // hover picking at ~20 Hz while the pointer moves
    if (this.hoverEnabled && this.pointer && this.pointerDirty && time - this.lastPick > 0.05) {
      this.lastPick = time;
      this.pointerDirty = false;
      this.setHover(this.pickAt(this.pointer.x, this.pointer.y));
    }
    this.syncNeutral();
    const active = s.mask || s.block >= 0 || s.seat >= 0 || s.hoverSeat >= 0 || s.hoverBlock >= 0 || this.hoverSet.length > 0;
    this.pass.enabled = active;
    if (!active) return;
    this.idPass.render(this.camera);
    const u = this.pass.uniforms;
    u.uBlock.value = s.block;
    u.uSelSeat.value = s.seat;
    u.uHoverSeat.value = this.hoverEnabled ? s.hoverSeat : -1;
    u.uHoverBlock.value = this.hoverEnabled ? s.hoverBlock : -1;
    u.uMode.value = s.mask ? 1 : 0;
    u.uTime.value = time;
    u.uAvailability.value = s.availability ? 1 : 0;
    u.uRow.value = s.row;
  }

  /**
   * STEP 04 check: project every seat of `block` with the camera and compare
   * with the ID mask. Returns how many on-screen seat centres show their own
   * seat id, another seat of the same block, or something else (occluded).
   */
  verify(block: number): {
    onScreen: number;
    own: number;
    sameBlock: number;
    ownTerrace: number;
    other: number;
    maskPixels: number;
    maskPixelsInBlock: number;
  } {
    this.idPass.render(this.camera);
    const buf = this.idPass.readMask();
    const { width, height } = this.idPass.target;
    const L = this.stadium.layout;
    const b = L.blocks[block];
    const v = new Vector3();
    let onScreen = 0, own = 0, sameBlock = 0, ownTerrace = 0, other = 0;
    for (let i = b.seatStart; i < b.seatStart + b.seatCount; i++) {
      // a point every seat LOD covers: the middle of the far LOD's slanted quad; the
      // detailed and simple seats put their backrest (front views) or pan (from above) there
      const yaw = L.seats.yaw[i];
      v.set(L.seats.pos[i * 3] - Math.sin(yaw) * 0.02, L.seats.pos[i * 3 + 1] + PITCH_ELEVATION + 0.66, L.seats.pos[i * 3 + 2] - Math.cos(yaw) * 0.02);
      v.project(this.camera);
      if (v.z < -1 || v.z > 1 || Math.abs(v.x) > 0.98 || Math.abs(v.y) > 0.98) continue;
      const px = Math.floor((v.x * 0.5 + 0.5) * width);
      const py = Math.floor((v.y * 0.5 + 0.5) * height);
      const o = (py * width + px) * 4;
      const r = this.idPass.decode(decodeId(buf[o], buf[o + 1], buf[o + 2]));
      onScreen++;
      if (r.seat === i) own++;
      else if (r.seat >= 0 && r.block === block) sameBlock++;
      else if (r.seat < 0 && r.block === block) ownTerrace++; // would mean the seat is not where the data says
      else other++; // occluded by structure or nearer geometry
    }
    // every mask pixel claiming this block must be one of its seats or terraces
    let maskPixels = 0, maskPixelsInBlock = 0;
    for (let o = 0; o < buf.length; o += 4) {
      const r = this.idPass.decode(decodeId(buf[o], buf[o + 1], buf[o + 2]));
      if (r.seat >= 0) {
        if (r.block === block) {
          maskPixels++;
          if (r.seat >= b.seatStart && r.seat < b.seatStart + b.seatCount) maskPixelsInBlock++;
        }
      }
    }
    return { onScreen, own, sameBlock, ownTerrace, other, maskPixels, maskPixelsInBlock };
  }
}
