import type { Face, FlavorId, Product } from '@/data/products'
import type { Pose } from '@/lib/can/pose'

/**
 * The home page's choreography. Each story section names a beat; the stage
 * holds the beat's pose while its section is being read and moves only in
 * the scroll between two sections.
 *
 * The story walks round the label in order — front, right, back, left and
 * front again — so the can only ever turns one way and each turn shows the
 * panel the copy beside it is talking about.
 */

export type BeatId = 'hero' | 'nedir' | 'icindekiler' | 'ambalaj' | 'limon' | 'seftali' | 'ikisi' | 'etkilesim'

export interface CanSpec {
  face: Face
  /** Whole turns already made, so the next turn keeps going the same way. */
  lap?: number
  /** Degrees off square-on, so the cylinder reads as round. */
  turn?: number
  x: number
  y: number
  h: number
  pitch?: number
  roll?: number
  shadow?: number
}

interface BeatSpec {
  bg: string
  cans: Partial<Record<FlavorId, CanSpec>>
  /** Phone and tablet portrait: the can stands above the copy. */
  compact?: Partial<Record<FlavorId, Partial<CanSpec>>>
}

const PAPER = '#F6F1E6'

export const BEATS: Record<Exclude<BeatId, 'etkilesim'>, BeatSpec> = {
  hero: {
    bg: PAPER,
    cans: { limon: { face: 'front', turn: -5, x: 0.3, y: -0.03, h: 0.76, roll: -3 } },
    compact: { limon: { x: 0, y: 0.27, h: 0.46, roll: -2 } },
  },
  nedir: {
    bg: PAPER,
    cans: { limon: { face: 'right', turn: 12, x: -0.32, y: -0.02, h: 0.72, roll: 2.5 } },
    compact: { limon: { x: 0, y: 0.3, h: 0.44, roll: 1.5 } },
  },
  icindekiler: {
    bg: '#F1EBDD',
    cans: { limon: { face: 'back', turn: -6, x: 0.4, y: -0.02, h: 0.8, roll: 0 } },
    compact: { limon: { x: 0, y: 0.3, h: 0.46 } },
  },
  ambalaj: {
    bg: PAPER,
    cans: { limon: { face: 'left', turn: 10, x: -0.32, y: -0.02, h: 0.74, roll: 2 } },
    compact: { limon: { x: 0, y: 0.3, h: 0.44, roll: 1 } },
  },
  limon: {
    bg: '#F7EDC0',
    cans: { limon: { face: 'front', lap: 1, turn: -12, x: 0.3, y: -0.03, h: 0.76, roll: -3 } },
    compact: { limon: { x: 0, y: 0.29, h: 0.45, roll: -2 } },
  },
  seftali: {
    bg: '#F8DCC6',
    cans: { seftali: { face: 'front', turn: -12, x: 0.3, y: -0.03, h: 0.76, roll: -3 } },
    compact: { seftali: { x: 0, y: 0.29, h: 0.45, roll: -2 } },
  },
  ikisi: {
    bg: PAPER,
    cans: {
      limon: { face: 'front', lap: 1, turn: 14, x: 0.12, y: 0.0, h: 0.66 },
      seftali: { face: 'front', turn: -14, x: 0.5, y: -0.04, h: 0.66 },
    },
    compact: {
      limon: { x: -0.27, y: 0.28, h: 0.42 },
      seftali: { x: 0.27, y: 0.26, h: 0.42 },
    },
  },
}

export const INTERACTIVE_BG = '#EFE8D8'
const INTERACTIVE: CanSpec = { face: 'front', x: 0.28, y: -0.02, h: 0.8 }
const INTERACTIVE_COMPACT: Partial<CanSpec> = { x: 0, y: 0.2, h: 0.5 }

export function specFor(
  beat: BeatId,
  flavor: FlavorId,
  compact: boolean,
  interactive: { flavor: FlavorId; face: Face },
): CanSpec | null {
  if (beat === 'etkilesim') {
    if (flavor !== interactive.flavor) return null
    return { ...INTERACTIVE, ...(compact ? INTERACTIVE_COMPACT : {}), face: interactive.face }
  }
  const spec = BEATS[beat].cans[flavor]
  if (!spec) return null
  return compact ? { ...spec, ...BEATS[beat].compact?.[flavor] } : spec
}

export function bgFor(beat: BeatId) {
  return beat === 'etkilesim' ? INTERACTIVE_BG : BEATS[beat].bg
}

export function poseFrom(spec: CanSpec, product: Product): Pose {
  return {
    x: spec.x,
    y: spec.y,
    h: spec.h,
    yaw: -(product.label.faces[spec.face] + 360 * (spec.lap ?? 0)) + (spec.turn ?? 0),
    pitch: spec.pitch ?? 0,
    roll: spec.roll ?? 0,
    shadow: spec.shadow ?? 0.5,
  }
}

/** A can arriving from below (entering) or leaving upward (exiting). */
export function offstage(pose: Pose, direction: 'enter' | 'exit'): Pose {
  const sign = direction === 'enter' ? -1 : 1
  return { ...pose, y: pose.y + sign * 2.3, yaw: pose.yaw - sign * 70, shadow: 0 }
}

export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const channel = (shift: number) =>
    Math.round(((pa >> shift) & 255) + ((((pb >> shift) & 255) - ((pa >> shift) & 255)) * t))
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}
