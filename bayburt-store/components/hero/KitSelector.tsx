'use client'

import { useCallback, useState } from 'react'

import { KitCard3D } from '@/components/hero/KitCard3D'
import { KitStage3D } from '@/components/hero/KitStage3D'
import type { Product } from '@/data/products'

/**
 * The homepage selector. Real 3D when WebGL is available; the flat tilt cards
 * are kept as the fallback so the page still selects a kit on any device.
 */
export function KitSelector({ products }: { products: Product[] }) {
  const [isSupported, setIsSupported] = useState(true)
  const handleUnsupported = useCallback(() => setIsSupported(false), [])

  if (!isSupported) {
    return (
      <div className="container grid gap-6 overflow-y-auto pb-24 pt-[calc(var(--header-height)+11rem)] sm:gap-7 lg:grid-cols-3 lg:gap-8">
        {products.map((product, index) => (
          <KitCard3D key={product.slug} product={product} index={index} priority={index === 0} />
        ))}
      </div>
    )
  }

  return <KitStage3D products={products} onUnsupported={handleUnsupported} />
}
