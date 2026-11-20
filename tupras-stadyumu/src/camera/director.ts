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
import { Flight, type FlightSegment, type KeyFrame } from './clips.ts';

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
  flight: Flight | null = null;
  flightTime = 0;
  private flightView: LockedView | null = null;
  private flightDone: (() => void) | null = null;
  private readonly tmpPose: CameraPose = { position: new Vector3(), target: new Vector3(), fov: 50 };
  /** playback speed multiplier (tests and "skip" can raise it) */
  speed = 1;

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

  /** Play a chain of key frames as one continuous move. */
  fly(frames: KeyFrame[], view: LockedView | null, onDone?: () => void): Flight {
    const f = new Flight(frames);
    this.flight = f;
    this.flightTime = 0;
    this.flightView = view;
    this.flightDone = onDone ?? null;
    this.setMode('flying', view);
    return f;
  }

  get segment(): FlightSegment | null {
    return this.flight ? this.flight.segmentAt(this.flightTime) : null;
  }

  /** Jump the running flight to a time (tests, scrubbing). */
  seek(time: number): void {
    if (!this.flight) return;
    this.flightTime = Math.max(0, Math.min(this.flight.duration, time));
    this.applyPose(this.flight.poseAt(this.flightTime, this.tmpPose));
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

  update(dt = 0): void {
    if (this.mode === 'flying' && this.flight) {
      this.controls.enabled = false;
      this.flightTime += dt * this.speed;
      const f = this.flight;
      if (this.flightTime >= f.duration) {
        const last = f.frames[f.frames.length - 1];
        this.applyPose(last);
        this.flight = null;
        const v = this.flightView;
        const done = this.flightDone;
        this.flightView = null;
        this.flightDone = null;
        this.setMode('locked', v);
        done?.();
      } else {
        this.applyPose(f.poseAt(this.flightTime, this.tmpPose));
      }
      return;
    }
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
