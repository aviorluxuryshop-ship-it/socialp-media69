import Image from 'next/image'

import { cn } from '@/lib/utils'

interface JerseyImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * Product imagery wrapper.
 *
 * The kits ship as vector renders, which the optimiser has nothing to gain
 * from, so those are passed straight through. Swap any path in
 * `data/products.ts` for a photograph and it is optimised automatically.
 */
export function JerseyImage({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 90vw, (max-width: 1280px) 42vw, 520px',
  priority = false,
}: JerseyImageProps) {
  const isVector = src.endsWith('.svg')

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isVector}
      className={cn('object-contain', className)}
    />
  )
}
