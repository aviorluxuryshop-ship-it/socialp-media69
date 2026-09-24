import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { products } from '@/data/products'
import type { BeatId } from '@/lib/stage/beats'

interface BeatProps {
  id?: string
  beat: BeatId
  /** Which side the copy takes on a wide screen; the can takes the other. */
  side?: 'left' | 'right'
  className?: string
  children: ReactNode
  /** Shown instead of the 3D can when WebGL is unavailable. */
  still?: { src: string; alt: string }
  /** Copy that needs two columns of its own on a wide screen. */
  wide?: boolean
}

/**
 * One chapter of the story. On a wide screen the copy sits beside the can;
 * on a phone the can stands in the upper half of the window and the copy
 * starts below it.
 */
export function Beat({ id, beat, side = 'left', className, children, still, wide }: BeatProps) {
  return (
    <section
      id={id}
      data-beat={beat}
      className={cn(
        'relative z-10 flex min-h-[125svh] flex-col pb-[16svh] pt-[72svh]',
        'lg:min-h-[120vh] lg:justify-center lg:py-[18vh]',
        className,
      )}
    >
      {still && <FallbackStill {...still} side={side === 'left' ? 'right' : 'left'} />}
      <div className="container">
        <div className={cn(wide ? 'lg:w-[58%]' : 'lg:w-[42%]', side === 'right' && 'lg:ml-auto')}>
          <div className="story-card">{children}</div>
        </div>
      </div>
    </section>
  )
}

/** Where the 3D can would stand, a still of it when WebGL is unavailable. */
export function FallbackStill({ src, alt, side }: { src: string; alt: string; side: 'left' | 'right' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={547}
      height={1344}
      loading="lazy"
      className={cn(
        'webgl-fallback pointer-events-none absolute left-1/2 top-[10svh] h-[52svh] w-auto -translate-x-1/2',
        'lg:top-1/2 lg:h-[74vh] lg:-translate-y-1/2',
        side === 'right' ? 'lg:left-[65%]' : 'lg:left-[34%]',
      )}
    />
  )
}

export const LEMON_STILL = { src: products[0].still, alt: 'GADA Limon kutusu' }
