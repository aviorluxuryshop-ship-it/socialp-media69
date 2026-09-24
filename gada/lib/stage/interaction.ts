'use client'

import { useSyncExternalStore } from 'react'

import type { Face, FlavorId } from '@/data/products'

/**
 * State for the one place on the home page where the visitor turns the can
 * by hand. The section writes to it, the stage reads it every frame.
 */
interface InteractionState {
  flavor: FlavorId
  face: Face
  /** Degrees the visitor has turned the can on top of the chosen face. */
  drag: number
}

let state: InteractionState = { flavor: 'limon', face: 'front', drag: 0 }
const listeners = new Set<() => void>()

/** Written by the stage each frame so a face button can take the short way round. */
export const liveYaw: Record<FlavorId, number> = { limon: 0, seftali: 0 }

export const interaction = {
  get: () => state,
  set(patch: Partial<InteractionState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useInteraction() {
  return useSyncExternalStore(interaction.subscribe, interaction.get, interaction.get)
}

/** The face nearest the viewer for a can turned `drag` degrees past `face`. */
export function nearestFace(faces: Record<Face, number>, face: Face, drag: number): Face {
  const shown = faces[face] - drag
  let best: Face = face
  let bestDistance = Infinity
  for (const candidate of Object.keys(faces) as Face[]) {
    const d = Math.abs(((((faces[candidate] - shown) % 360) + 540) % 360) - 180)
    if (d < bestDistance) {
      bestDistance = d
      best = candidate
    }
  }
  return best
}
