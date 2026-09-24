/** Where a can stands in the frame and how it is turned. */
export interface Pose {
  /** Horizontal centre, −1 (left edge) … 1 (right edge) of the frame. */
  x: number
  /** Vertical centre, −1 (bottom) … 1 (top). */
  y: number
  /** Can height as a fraction of the frame height. */
  h: number
  /** Spin about the can's own axis, degrees. 0 shows the front panel. */
  yaw: number
  /** Tip toward / away from the viewer, degrees. */
  pitch: number
  /** Lean left / right, degrees. */
  roll: number
  /** Contact shadow strength, 0–1. */
  shadow: number
}

export const POSE_KEYS = ['x', 'y', 'h', 'yaw', 'pitch', 'roll', 'shadow'] as const

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    h: a.h + (b.h - a.h) * t,
    yaw: a.yaw + (b.yaw - a.yaw) * t,
    pitch: a.pitch + (b.pitch - a.pitch) * t,
    roll: a.roll + (b.roll - a.roll) * t,
    shadow: a.shadow + (b.shadow - a.shadow) * t,
  }
}

/** Frame-rate independent approach of `current` toward `target`. */
export function dampPose(current: Pose, target: Pose, k: number): number {
  let moved = 0
  for (const key of POSE_KEYS) {
    const delta = target[key] - current[key]
    current[key] += delta * k
    moved = Math.max(moved, Math.abs(delta))
  }
  return moved
}

export const smoothstep = (t: number) => t * t * (3 - 2 * t)
