import type { Keyframe } from '@/lib/keyframes'

/**
 * The seven acts' checkpoints, as fractions of the whole scroll track.
 *
 * With N equal-height (100svh) sections stacked in a track and a
 * ScrollTrigger spanning `top top` to `bottom bottom`, section i is exactly
 * centred in the viewport at progress = (i-1)/(N-1) — not at (i-1)/N, which
 * is what evenly slicing 0–1 into N pieces would suggest. The difference is
 * `end: 'bottom bottom'`: progress reaches 1 when the *track's* bottom
 * meets the viewport's bottom, i.e. after scrolling trackHeight −
 * viewportHeight, not trackHeight. Keying the camera to the wrong fractions
 * doesn't crash anything, it just quietly drifts the camera behind the copy
 * — by the third act it was showing the *previous* face while its heading
 * had already arrived, which reads as mistimed rather than cinematic. These
 * are the corrected checkpoints; every track below is keyed to them.
 */
const N = 7
const CHECKPOINTS = Array.from({ length: N }, (_, i) => i / (N - 1))
const [C0, C1, C2, C3, C4, C5, C6] = CHECKPOINTS as [number, number, number, number, number, number, number]

/**
 * Camera azimuth, in turns (0–1 = 360°). The four checkpoints line up with
 * the four photographed faces baked into the label texture — u = 0 front,
 * 0.25 right, 0.5 back, 0.75 left — so whenever the camera settles at a
 * keyframe it is looking at an unwarped, dead-on copy of the real can.
 */
export const CAMERA_ANGLE_TRACK: Keyframe<number>[] = [
  { at: C0, value: 0 }, // hero — front
  { at: C1, value: 0.02 }, // aroma — barely turns, mostly a dolly-in
  { at: C2, value: 0.25 }, // claim — right face, the "gerçek lezzet" claim
  { at: C3, value: 0.5 }, // faces sweeps on to the back
  { at: C4, value: 0.5 }, // ingredients — parked on the back label
  { at: C5, value: 0.75 }, // story sweeps on to the left face
  { at: C6, value: 1.0 }, // brand — back to front, the loop closes
]

/**
 * Camera distance from the can's axis, in metres. Long-lens distances (see
 * the FOV note in CanScene) — roughly 2.2× what a normal-lens framing would
 * use, to hold the same apparent can size at a much narrower field of view.
 */
export const CAMERA_DISTANCE_TRACK: Keyframe<number>[] = [
  { at: C0, value: 1.57 },
  { at: C1, value: 1.09 },
  { at: C2, value: 1.09 },
  { at: C3, value: 1.18 },
  { at: C4, value: 1.26 },
  { at: C5, value: 1.44 },
  { at: C6, value: 1.61 },
]

/** Camera height, relative to its look-at point on the can, in metres. */
export const CAMERA_HEIGHT_TRACK: Keyframe<number>[] = [
  { at: C0, value: 0.11 },
  { at: C1, value: 0.02 },
  { at: C2, value: 0.07 },
  { at: C3, value: -0.02 },
  { at: C4, value: 0.04 },
  { at: C5, value: 0.17 },
  { at: C6, value: 0.07 },
]

/** 0 = void background, 1 = full flavour accent — how warm the scene reads. */
export const BACKGROUND_WARMTH_TRACK: Keyframe<number>[] = [
  { at: C0, value: 0.1 },
  { at: C1, value: 0.22 },
  { at: C2, value: 0.32 },
  { at: C3, value: 0.22 },
  { at: C4, value: 0.14 },
  { at: C5, value: 0.28 },
  { at: C6, value: 0.13 },
]

/** 0 = neutral key light, 1 = fully flavour-tinted. */
export const KEY_LIGHT_WARMTH_TRACK: Keyframe<number>[] = [
  { at: C0, value: 0.15 },
  { at: C1, value: 0.35 },
  { at: C2, value: 0.5 },
  { at: C3, value: 0.4 },
  { at: C4, value: 0.22 },
  { at: C5, value: 0.45 },
  { at: C6, value: 0.18 },
]

/** Ambient particle presence, 0–1. Pulled back during ingredients so the
 * reading act stays calm and legible, and at the very open so the first
 * frame is clean. */
export const PARTICLE_ENVELOPE_TRACK: Keyframe<number>[] = [
  { at: C0, value: 0 },
  { at: C1, value: 0.55 },
  { at: C2, value: 0.7 },
  { at: C3, value: 0.45 },
  { at: C4, value: 0.18 },
  { at: C5, value: 0.75 },
  { at: C6, value: 0.3 },
]
