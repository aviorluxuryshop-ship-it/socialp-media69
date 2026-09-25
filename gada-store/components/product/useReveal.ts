'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Fades and lifts a section's copy in as it enters the middle of the
 * viewport and lets it recede as the next act takes over — the DOM half of
 * the same "one continuous scene" the camera is doing in WebGL. Driven by
 * each section's own position rather than the global progress number, so it
 * stays correct regardless of how tall any one act's content ends up being.
 */
export function useReveal(ref: React.RefObject<HTMLElement | null>, options?: { from?: 'left' | 'right' | 'up' }) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const axis = options?.from === 'left' ? -1 : options?.from === 'right' ? 1 : 0
    const fromX = axis * 36
    const fromY = axis === 0 ? 30 : 0

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, x: fromX, y: fromY },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          end: 'top 38%',
          scrub: true,
        },
      },
    )

    const exitTween = gsap.fromTo(
      el,
      { autoAlpha: 1, y: 0 },
      {
        autoAlpha: 0,
        y: -24,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'bottom 42%',
          end: 'bottom -10%',
          scrub: true,
        },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      exitTween.scrollTrigger?.kill()
      tween.kill()
      exitTween.kill()
    }
  }, [ref, options?.from])
}
