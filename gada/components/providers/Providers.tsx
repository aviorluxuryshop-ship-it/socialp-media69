'use client'

import type { ReactNode } from 'react'

import { MenuProvider } from './MenuProvider'
import { SmoothScroll } from './SmoothScroll'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <MenuProvider>{children}</MenuProvider>
    </SmoothScroll>
  )
}
