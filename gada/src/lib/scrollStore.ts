/**
 * Single mutable source of truth for scroll progress (0..1 across the whole
 * experience). A module singleton rather than React state/context on
 * purpose: the R3F render loop reads it every frame via useFrame, and
 * routing it through React state would re-render the whole tree 60x/second.
 */
export const scrollState = {
  progress: 0,
  velocity: 0,
}

type Listener = (progress: number) => void
const listeners = new Set<Listener>()

export function setScrollProgress(value: number) {
  const clamped = Math.min(1, Math.max(0, value))
  scrollState.velocity = clamped - scrollState.progress
  scrollState.progress = clamped
  listeners.forEach((fn) => fn(clamped))
}

/** For the few DOM bits (scroll indicator) that do want a reactive value. */
export function subscribeScrollProgress(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
