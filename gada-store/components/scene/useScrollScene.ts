'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import type { CanSceneHandle } from './CanScene'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * The whole page (`trackRef`) is one ScrollTrigger, `start` to `end`, scrubbed
 * 1:1 — no easing added here, because CanScene already damps the value it
 * reads out of `progressRef` every frame. Two layers of smoothing on the
 * same number just adds lag; one is enough, and keeping it in the render
 * loop is what lets scrolling back retrace the exact same motion.
 */
export function useScrollScene(
  trackRef: React.RefObject<HTMLElement | null>,
  progressRef: React.RefObject<CanSceneHandle>,
) {
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        if (progressRef.current) progressRef.current.progress = self.progress
      },
    })

    return () => {
      trigger.kill()
    }
  }, [trackRef, progressRef])
}
