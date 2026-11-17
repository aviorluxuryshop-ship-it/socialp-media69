import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/Common'
import { ProductsBrowser } from '@/components/ProductsBrowser'
import { products } from '@/data/products'

export const metadata: Metadata = {
  title: 'Tüm Ürünler — Kız, Erkek ve Mini Çocuk Takımları',
  description: 'PRIME KIDS çocuk takımları: şardonlu kışlık eşofmanlar, denim ve kargo takımlar. Yaşa ve kategoriye göre filtreleyin.',
  alternates: { canonical: '/urunler' },
}

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Ürünler' }]}
        title="Tüm Ürünler"
        lead={`${products.length} model, ${products.reduce((n, p) => n + p.colors.length, 0)} renk seçeneği. Yaş seçerek sadece uyan bedenleri görebilirsiniz.`}
      />
      <Suspense fallback={<div className="container py-20 text-center text-ink-muted">Ürünler yükleniyor…</div>}>
        <ProductsBrowser />
      </Suspense>
    </>
  )
}
