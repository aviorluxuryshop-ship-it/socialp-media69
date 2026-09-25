import * as THREE from 'three'

export interface Keyframe<T> {
  /** Scroll progress, 0–1, strictly increasing across a track. */
  at: number
  value: T
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function segment<T>(track: Keyframe<T>[], progress: number): [Keyframe<T>, Keyframe<T>, number] {
  const clamped = THREE.MathUtils.clamp(progress, track[0]!.at, track[track.length - 1]!.at)
  let i = 0
  while (i < track.length - 2 && clamped > track[i + 1]!.at) i += 1
  const a = track[i]!
  const b = track[i + 1]!
  const span = b.at - a.at
  const t = span > 0 ? smoothstep((clamped - a.at) / span) : 0
  return [a, b, t]
}

/** Piecewise-linear (smoothstepped per segment) interpolation over numbers. */
export function sampleNumber(track: Keyframe<number>[], progress: number): number {
  const [a, b, t] = segment(track, progress)
  return THREE.MathUtils.lerp(a.value, b.value, t)
}

/** Same, but each keyframe's value is itself interpolated the short way — for angles given in turns (0–1 = 360°). */
export function sampleAngleTurns(track: Keyframe<number>[], progress: number): number {
  const [a, b, t] = segment(track, progress)
  return a.value + (b.value - a.value) * t
}

const colorCache = new WeakMap<Keyframe<string>[], THREE.Color[]>()

export function sampleColor(track: Keyframe<string>[], progress: number, target: THREE.Color): THREE.Color {
  let colors = colorCache.get(track)
  if (!colors) {
    colors = track.map((k) => new THREE.Color(k.value))
    colorCache.set(track, colors)
  }
  const [a, b, t] = segment(track, progress)
  const ai = track.indexOf(a)
  const bi = track.indexOf(b)
  return target.copy(colors[ai]!).lerp(colors[bi]!, t)
}
