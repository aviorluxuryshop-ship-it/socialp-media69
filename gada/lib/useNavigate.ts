'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { useSmoothScroll } from '@/components/providers/SmoothScroll'

/**
 * Section links are written as `/#id`. On the home page they glide to the
 * section; anywhere else they navigate home and land on it.
 */
export function useNavigate() {
  const pathname = usePathname()
  const router = useRouter()
  const { scrollTo } = useSmoothScroll()

  return useCallback(
    (href: string, event?: { preventDefault: () => void }) => {
      const [path, hash] = href.split('#')
      const target = path || '/'
      if (hash && target === pathname) {
        event?.preventDefault()
        history.replaceState(null, '', `#${hash}`)
        scrollTo(`#${hash}`)
        return
      }
      if (event) return // let the link navigate normally
      router.push(href)
    },
    [pathname, router, scrollTo],
  )
}
