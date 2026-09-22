import { sceneProgress, type SceneId } from './scenes'

/**
 * The single source of truth for what the camera, the can and the lights do
 * at every point of the scroll. ProductScene samples it each frame; nothing
 * about the choreography lives anywhere else. Keyframes are placed by scene
 * (see scenes.ts), so they stay locked to the copy on the page.
 *
 * Can space: the can is centred on the origin, 1.16 tall (y −0.58…+0.58),
 * front of the label facing +Z at rotY = 0. Useful heights on the label:
 *   wordmark ≈ −0.04 · orange mark ≈ +0.26 · neck ≈ +0.47 · lid ≈ +0.53
 *
 * rotY is unwrapped (it keeps going past −2π) so the spin is continuous;
 * negative rotY turns the can so its right side comes round first:
 * front → right → back → left → front.
 */

export type Frame = {
  /** Scroll progress this keyframe is reached at. */
  t: number
  /** Camera position and target. */
  pos: [number, number, number]
  lookAt: [number, number, number]
  fov: number
  /** Can rotation around its vertical axis (radians). */
  rotY: number
  /** Light rig. */
  keyLight: number
  rimLight: number
  envIntensity: number
  /** 0..1 — soft orange backdrop glow behind the can. */
  glow: number
  /** 0..1 — shifts the backdrop from neutral black toward a warm black. */
  warmth: number
  /** 0..1 — orange slices, leaves and particles of the aroma scene. */
  aroma: number
  /** 0..1 — depth-of-field strength (macro shots, desktop only). */
  dof: number
  /**
   * Responsive framing. Wide screens: the camera slides by desktopX so the
   * can sits right of centre, clear of copy on the left. Portrait screens:
   * the camera pulls back by mobileZoom and rises by mobileY so the can sits
   * lower, under copy at the top, and never fills the whole screen.
   */
  desktopX: number
  mobileY: number
  mobileZoom: number
  /**
   * Extra pull-back on short landscape windows (laptops), for scenes whose
   * copy sits under the can: the copy is a fixed pixel height, so on a short
   * window it takes a bigger share of the screen and the can must make room.
   */
  shortZoom: number
}

type FrameInput = Omit<Frame, 't' | 'keyLight' | 'rimLight' | 'envIntensity' | 'glow' | 'warmth' | 'aroma' | 'dof' | 'desktopX' | 'mobileY' | 'mobileZoom' | 'shortZoom'> &
  Partial<Pick<Frame, 'keyLight' | 'rimLight' | 'envIntensity' | 'glow' | 'warmth' | 'aroma' | 'dof' | 'desktopX' | 'mobileY' | 'mobileZoom' | 'shortZoom'>>

const DEFAULTS = {
  keyLight: 1.1,
  rimLight: 1,
  envIntensity: 1,
  glow: 0.35,
  warmth: 0,
  aroma: 0,
  dof: 0,
  desktopX: 0,
  mobileY: 0,
  mobileZoom: 1.25,
  shortZoom: 1,
}

const TURN = Math.PI * 2

function key(scene: SceneId, at: number, frame: FrameInput): Frame {
  return { ...DEFAULTS, ...frame, t: sceneProgress(scene, at) }
}

/** Copy on the left (desktop) / top (mobile): shared framing for those scenes. */
const SIDE_COPY = { desktopX: -0.42, mobileY: 0.36, mobileZoom: 1.6 }
/** Copy along the bottom: the can is framed high. */
const BOTTOM_COPY = { mobileY: 0, mobileZoom: 1.18, shortZoom: 1.35 }

export const TIMELINE: Frame[] = [
  // HERO — the can, slightly angled, framed high above the title
  key('top', 0, { pos: [0, -0.3, 3.75], lookAt: [0, -0.3, 0], fov: 34, rotY: -0.35, keyLight: 1.05, rimLight: 0.95, glow: 1, ...BOTTOM_COPY }),
  key('top', 1, { pos: [0, -0.28, 3.6], lookAt: [0, -0.28, 0], fov: 34, rotY: -0.42, keyLight: 1.08, rimLight: 0.95, glow: 0.9, ...BOTTOM_COPY }),

  // SAHNE 1 — discover: slow push-in, a gentle turn, light warms slightly
  key('urun', 0, { pos: [0, 0.03, 3.05], lookAt: [0, 0, 0], fov: 30, rotY: -0.55, glow: 0.55, ...SIDE_COPY }),
  key('urun', 1, { pos: [0.06, 0.06, 2.8], lookAt: [0, 0.02, 0], fov: 29, rotY: -0.8, keyLight: 1.18, glow: 0.5, warmth: 0.25, ...SIDE_COPY }),

  // SAHNE 2 — 360°: a full turn with a beat on the back (u=0 faces the lens at rotY = −π), camera rising over it
  key('hikaye', 0, { pos: [0, 0.04, 3.15], lookAt: [0, 0, 0], fov: 30, rotY: -0.9, ...SIDE_COPY }),
  key('hikaye', 0.5, { pos: [0.24, 0.3, 3.05], lookAt: [0, 0.02, 0], fov: 30, rotY: -Math.PI, rimLight: 1.25, ...SIDE_COPY }),
  key('hikaye', 1, { pos: [0, 0.06, 3.1], lookAt: [0, 0, 0], fov: 30, rotY: -TURN, ...SIDE_COPY }),

  // SAHNE 3 — macro: wordmark → orange → metal of the neck → lid and tab
  key('icerik', 0, { pos: [0, -0.05, 1.55], lookAt: [0, -0.05, 0], fov: 22, rotY: -TURN - 0.04, keyLight: 1.3, rimLight: 1.1, glow: 0.2, dof: 1, mobileZoom: 2.2 }),
  key('icerik', 0.33, { pos: [0.1, 0.28, 1.12], lookAt: [0, 0.26, 0], fov: 22, rotY: -TURN - 0.14, keyLight: 1.35, rimLight: 1.2, glow: 0.2, dof: 1, mobileZoom: 2.0 }),
  key('icerik', 0.66, { pos: [0.78, 0.56, 0.98], lookAt: [0, 0.44, 0], fov: 24, rotY: -TURN - 0.36, keyLight: 1.4, rimLight: 1.35, glow: 0.2, dof: 1, mobileZoom: 1.8 }),
  key('icerik', 1, { pos: [0.04, 1.14, 0.72], lookAt: [0, 0.5, 0], fov: 26, rotY: -TURN - 0.5, keyLight: 1.45, rimLight: 1.3, glow: 0.2, dof: 1, mobileZoom: 1.8 }),

  // SAHNE 4 — aroma: pull back to a 3/4 angle, slices and leaves drift in beside the can
  key('aroma', 0, { pos: [0.35, 0.1, 3.1], lookAt: [0, 0, 0], fov: 30, rotY: -TURN - 0.9, keyLight: 1.2, glow: 0.7, warmth: 1, aroma: 1, ...SIDE_COPY }),
  key('aroma', 1, { pos: [0.4, 0.12, 3.0], lookAt: [0, 0.01, 0], fov: 30, rotY: -TURN - 1.1, keyLight: 1.2, glow: 0.7, warmth: 1, aroma: 1, ...SIDE_COPY }),

  // SAHNE 5 — final hero: centred, upright, strong rim light, camera eases back and holds
  key('final', 0, { pos: [0, -0.3, 3.8], lookAt: [0, -0.3, 0], fov: 34, rotY: -TURN - 0.35, keyLight: 1.05, rimLight: 1.4, glow: 1, warmth: 0.2, aroma: 0.12, ...BOTTOM_COPY }),
  key('final', 1, { pos: [0, -0.3, 3.92], lookAt: [0, -0.3, 0], fov: 34, rotY: -TURN - 0.35, keyLight: 1.05, rimLight: 1.4, glow: 1, warmth: 0.2, aroma: 0.12, ...BOTTOM_COPY }),
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
]
/** Ease in and out of every keyframe so the camera never starts or stops abruptly. */
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

export function sampleTimeline(progress: number): Frame {
  const p = Math.min(1, Math.max(0, progress))
  let i = 0
  while (i < TIMELINE.length - 2 && TIMELINE[i + 1].t <= p) i++
  const a = TIMELINE[i]
  const b = TIMELINE[i + 1]
  const span = b.t - a.t
  const k = span > 0 ? smootherstep(Math.min(1, Math.max(0, (p - a.t) / span))) : 1

  return {
    t: p,
    pos: lerp3(a.pos, b.pos, k),
    lookAt: lerp3(a.lookAt, b.lookAt, k),
    fov: lerp(a.fov, b.fov, k),
    rotY: lerp(a.rotY, b.rotY, k),
    keyLight: lerp(a.keyLight, b.keyLight, k),
    rimLight: lerp(a.rimLight, b.rimLight, k),
    envIntensity: lerp(a.envIntensity, b.envIntensity, k),
    glow: lerp(a.glow, b.glow, k),
    warmth: lerp(a.warmth, b.warmth, k),
    aroma: lerp(a.aroma, b.aroma, k),
    dof: lerp(a.dof, b.dof, k),
    desktopX: lerp(a.desktopX, b.desktopX, k),
    mobileY: lerp(a.mobileY, b.mobileY, k),
    mobileZoom: lerp(a.mobileZoom, b.mobileZoom, k),
    shortZoom: lerp(a.shortZoom, b.shortZoom, k),
  }
}
