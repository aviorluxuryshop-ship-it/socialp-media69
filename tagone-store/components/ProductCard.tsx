import Link from 'next/link'

import type { Product } from '@/data/products'
import { siteConfig } from '@/data/site'
import { ProductVisual } from './ProductVisual'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/urunler/${product.slug}`}
      className="group block rounded-card border border-ink/10 bg-paper-raised p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lift"
    >
      <ProductVisual color={product.color} name={product.name} />
      <div className="px-2 pb-2 pt-4">
        <h3 className="text-base font-semibold text-ink">{product.name}</h3>
        <p className="mt-1 text-sm text-ink-mute">{product.short}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-ink">
            {siteConfig.currency}
            {product.price}
          </span>
          {product.compareAt && (
            <span className="text-sm text-ink-mute line-through">
              {siteConfig.currency}
              {product.compareAt}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
