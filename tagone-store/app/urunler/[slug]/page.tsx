import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'

import { ProductVisual } from '@/components/ProductVisual'
import { AddToCartButton } from '@/components/AddToCartButton'
import { getProductBySlug, products } from '@/data/products'
import { siteConfig } from '@/data/site'

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProductBySlug(params.slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/urunler/${product.slug}` },
    openGraph: { title: `${product.name} — ${siteConfig.name}`, description: product.description },
  }
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug)
  if (!product) notFound()

  return (
    <section className="bg-paper py-16">
      <div className="container grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <ProductVisual color={product.color} name={product.name} />
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-ink-mute">{product.short}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink">
              {siteConfig.currency}
              {product.price}
            </span>
            {product.compareAt && (
              <span className="text-base text-ink-mute line-through">
                {siteConfig.currency}
                {product.compareAt}
              </span>
            )}
          </div>

          <p className="mt-6 text-ink-soft">{product.description}</p>

          <ul className="mt-6 space-y-2">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-dim" /> {f}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-ink-mute">{product.material}</p>

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </section>
  )
}
