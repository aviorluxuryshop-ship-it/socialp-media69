import { useSyncExternalStore } from 'react'
import { FLAVOR_ORDER, type FlavorId } from '@/content/products'

/**
 * Which flavor's can is on screen. A module singleton (read via
 * useSyncExternalStore) rather than context: the 3D layer reads it outside
 * React's render loop, and the flavor picker is the only DOM consumer, so a
 * context provider would buy nothing.
 */
let current: FlavorId = FLAVOR_ORDER[0]
const listeners = new Set<() => void>()

export function getFlavor() {
  return current
}

export function setFlavor(id: FlavorId) {
  if (id === current) return
  current = id
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Reactive read for DOM components (the flavor picker). The 3D scene reads getFlavor() directly each frame instead. */
export function useFlavor() {
  return useSyncExternalStore(subscribe, getFlavor)
}
