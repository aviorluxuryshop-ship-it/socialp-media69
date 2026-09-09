'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * The homepage is the kit selector and nothing else, so chrome that belongs on
 * every other route is withheld there.
 */
export function HideOnHome({ children }: { children: ReactNode }) {
  return usePathname() === '/' ? null : <>{children}</>
}
