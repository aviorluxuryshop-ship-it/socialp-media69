import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setScrollProgress } from '@/lib/scrollStore'
import { prefersReducedMotion } from '@/lib/webgl'

gsap.registerPlugin(ScrollTrigger)

/**
 * Lenis gives the wheel its inertia; GSAP's ticker drives Lenis, and one
 * full-page ScrollTrigger turns scroll position into the 0..1 progress the
 * 3D timeline reads. Because progress is read from the real scroll
 * position (not a timeline playing on its own), stopping the scroll stops
 * the animation where it is, and scrolling back up plays it in reverse.
 *
 * Touch scrolling stays native (Lenis' default) — the most reliable option
 * on phones — while the 3D rig adds its own damping on top.
 */
export function useLenisScroll(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = prefersReducedMotion()

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: !reduced,
      anchors: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setScrollProgress(self.progress),
      onRefresh: (self) => setScrollProgress(self.progress),
    })

    return () => {
      trigger.kill()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [rootRef])
}
