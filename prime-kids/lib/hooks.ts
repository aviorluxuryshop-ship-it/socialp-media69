'use client'

import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** Sunucuda ve ilk hidrasyonda false, tarayıcıda true. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
