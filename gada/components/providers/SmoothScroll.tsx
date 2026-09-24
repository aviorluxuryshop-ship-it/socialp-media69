'use client'

import Lenis from 'lenis'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'

interface ScrollApi {
  /** Smoothly bring an element (or a `#id`) to the top of the window. */
  scrollTo: (target: string | HTMLElement | number, immediate?: boolean) => void
  lock: () => void
  unlock: () => void
}

const ScrollContext = createContext<ScrollApi | null>(null)

/**
 * Inertial scrolling on desktop. Touch keeps the platform's own scrolling
 * (Lenis leaves it alone by default) and reduced motion turns it off.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2), wheelMultiplier: 0.9 })
    lenisRef.current = lenis
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  const scrollTo = useCallback<ScrollApi['scrollTo']>((target, immediate = false) => {
    const element =
      typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
    if (element === null) return
    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(element, { immediate, duration: 1.6, force: true })
    } else if (typeof element === 'number') {
      window.scrollTo({ top: element })
    } else {
      element.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' })
    }
  }, [])

  const lock = useCallback(() => {
    lenisRef.current?.stop()
    document.documentElement.style.overflow = 'hidden'
  }, [])

  const unlock = useCallback(() => {
    lenisRef.current?.start()
    document.documentElement.style.overflow = ''
  }, [])

  const api = useMemo(() => ({ scrollTo, lock, unlock }), [scrollTo, lock, unlock])
  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>
}

export function useSmoothScroll() {
  const api = useContext(ScrollContext)
  if (!api) throw new Error('useSmoothScroll must be used inside <SmoothScroll>')
  return api
}
