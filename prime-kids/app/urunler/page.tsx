import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DEFAULT_FILTERS, ProductsBrowser, ProductsView } from '@/components/ProductsBrowser'

export const metadata: Metadata = {
  title: 'Tüm Ürünler — Kız, Erkek ve Bebek Çocuk Takımları',
  description: 'PRIME KIDS çocuk takımları: şardonlu kışlık eşofmanlar, denim ve kargo takımlar. Kız, erkek ve bebek bölümleri, yaşa göre filtre.',
  alternates: { canonical: '/urunler' },
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsView filters={DEFAULT_FILTERS} />}>
      <ProductsBrowser />
    </Suspense>
  )
}
