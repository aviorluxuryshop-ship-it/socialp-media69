'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

import { CartProvider } from '@/components/providers/CartProvider'
import { MenuProvider } from '@/components/providers/MenuProvider'

/**
 * Global client providers. `reducedMotion="user"` makes every Framer Motion
 * animation in the app respect the visitor's OS setting automatically.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <MenuProvider>{children}</MenuProvider>
      </CartProvider>
    </MotionConfig>
  )
}
