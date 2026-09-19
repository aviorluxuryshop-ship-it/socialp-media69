import type { Metadata } from 'next'

import { ProductCard } from '@/components/ProductCard'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export const metadata: Metadata = {
  title: 'Ürünler',
  description: `${siteConfig.name} NFC kartvizit kartları: Karbon Siyah, Sinyal Yeşil, Ahşap Doğal ve Metal Gümüş.`,
  alternates: { canonical: '/urunler' },
}

export default function ProductsPage() {
  return (
    <section className="bg-paper py-16">
      <div className="container">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Ürünler</h1>
        <p className="mt-3 max-w-xl text-ink-mute">
          Her kart aynı teknolojiyi taşır: dokununca profilini açan bir NFC çip. Aradaki fark yüzey ve his — sana uygun olanı seç.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
