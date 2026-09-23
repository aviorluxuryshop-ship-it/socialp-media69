import { useEffect, useRef } from 'react'
import { subscribeScrollProgress } from '@/lib/scrollStore'

/**
 * A hairline progress track on the right edge. Updated imperatively from
 * the scroll store — no React re-render per scroll tick.
 */
export function ScrollIndicator() {
  const fill = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      subscribeScrollProgress((progress) => {
        if (fill.current) fill.current.style.transform = `scaleY(${progress})`
      }),
    [],
  )

  return (
    <div className="pointer-events-none fixed right-6 top-1/2 z-20 hidden h-28 w-px -translate-y-1/2 bg-cream/15 md:block" aria-hidden="true">
      <div ref={fill} className="h-full w-full origin-top bg-accent-400" style={{ transform: 'scaleY(0)' }} />
    </div>
  )
}
