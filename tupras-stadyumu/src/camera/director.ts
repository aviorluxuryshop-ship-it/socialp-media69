/**
 * Camera director: owns the camera pose.
 *   · free   — orbit controls for exploration, clamped above the terrain;
 *   · locked — a fixed pose (a locked view or a seat), never drifts;
 *   · flying — a cinematic clip is playing (STEP 03).
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { World } from '../world/data.ts';
import type { CameraPose, LockedView } from './views.ts';

export type DirectorMode = 'free' | 'locked' | 'flying';

export class CameraDirector {
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
  mode: DirectorMode = 'free';
  current: LockedView | null = null;
  /** look target of the current pose (used for shadow focus, clips…) */
  readonly target = new Vector3();
  private readonly world: World;
  private readonly listeners: ((mode: DirectorMode, view: LockedView | null) => void)[] = [];

  constructor(camera: PerspectiveCamera, dom: HTMLElement, world: World) {
    this.camera = camera;
    this.world = world;
    this.controls = new OrbitControls(camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 5000;
    this.controls.minDistance = 4;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    // any manual drag in a locked view returns to free exploration around the same target
    this.controls.addEventListener('start', () => {
      if (this.mode === 'locked') this.setMode('free', null);
    });
  }

  onChange(fn: (mode: DirectorMode, view: LockedView | null) => void): void {
    this.listeners.push(fn);
  }

  private setMode(mode: DirectorMode, view: LockedView | null): void {
    this.mode = mode;
    this.current = view;
    for (const l of this.listeners) l(mode, view);
  }

  /** Put the camera exactly on a pose. */
  applyPose(p: CameraPose): void {
    this.camera.position.copy(p.position);
    this.target.copy(p.target);
    this.controls.target.copy(p.target);
    if (this.camera.fov !== p.fov) {
      this.camera.fov = p.fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(p.target);
    this.camera.updateMatrixWorld();
  }

  lock(view: LockedView): void {
    this.applyPose(view);
    this.setMode('locked', view);
  }

  free(): void {
    this.setMode('free', null);
  }

  /** Read back the camera's current pose. */
  pose(): CameraPose {
    return { position: this.camera.position.clone(), target: this.target.clone(), fov: this.camera.fov };
  }

  update(): void {
    if (this.mode === 'free') {
      this.controls.enabled = true;
      this.controls.update();
      const ground = this.world.heightAt(this.camera.position.x, this.camera.position.z) + 1.6;
      if (this.camera.position.y < ground) this.camera.position.y = ground;
      this.target.copy(this.controls.target);
    } else {
      this.controls.enabled = this.mode === 'locked';
    }
  }
}
