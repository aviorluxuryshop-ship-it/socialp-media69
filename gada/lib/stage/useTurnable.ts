'use client'

import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'

/**
 * Horizontal drag → degrees, with a little inertia on release. Vertical
 * movement is left to the page (touch-action: pan-y on the surface), so a
 * phone can still scroll past the can.
 */
export function useTurnable(onTurn: (delta: number) => void, degreesPerPixel = 0.45) {
  const drag = useRef<{ x: number; t: number; v: number } | null>(null)
  const inertia = useRef(0)

  useEffect(() => () => cancelAnimationFrame(inertia.current), [])

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    cancelAnimationFrame(inertia.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, t: performance.now(), v: 0 }
  }, [])

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = drag.current
      if (!state) return
      const now = performance.now()
      const delta = (event.clientX - state.x) * degreesPerPixel
      state.v = delta / Math.max(1, now - state.t)
      state.x = event.clientX
      state.t = now
      onTurn(delta)
    },
    [onTurn, degreesPerPixel],
  )

  const onPointerUp = useCallback(() => {
    const state = drag.current
    drag.current = null
    if (!state || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let velocity = state.v * 16 // degrees per frame
    const glide = () => {
      velocity *= 0.92
      if (Math.abs(velocity) < 0.05) return
      onTurn(velocity)
      inertia.current = requestAnimationFrame(glide)
    }
    inertia.current = requestAnimationFrame(glide)
  }, [onTurn])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowLeft') onTurn(-15)
      else if (event.key === 'ArrowRight') onTurn(15)
      else return
      event.preventDefault()
    },
    [onTurn],
  )

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown }
}
