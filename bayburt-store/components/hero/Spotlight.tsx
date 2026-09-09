'use client'

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SpotlightProps {
  children: ReactNode
  className?: string
  /** Gold wash strength, 0–1. */
  intensity?: number
}

/**
 * Ambient light that follows the pointer. Deliberately low contrast: it should
 * read as a moving studio lamp, never as a glow effect.
 */
export function Spotlight({ children, className, intensity = 0.1 }: SpotlightProps) {
  const x = useMotionValue(50)
  const y = useMotionValue(30)
  const springX = useSpring(x, { stiffness: 90, damping: 26, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 90, damping: 26, mass: 0.6 })

  const background = useMotionTemplate`radial-gradient(58% 46% at ${springX}% ${springY}%, rgba(212,175,55,${intensity}) 0%, rgba(212,175,55,0.03) 42%, transparent 72%)`

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      x.set((event.clientX / window.innerWidth) * 100)
      y.set((event.clientY / window.innerHeight) * 100)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [x, y])

  return (
    <div className={cn('relative isolate', className)}>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background }} />
      {children}
    </div>
  )
}
