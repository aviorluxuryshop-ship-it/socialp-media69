import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/Common'
import { ProductsBrowser } from '@/components/ProductsBrowser'

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
        lead="Kız, erkek ve bebek takımları. Yaşı seçin, uyan ürünleri görün."
      />
      <Suspense fallback={<div className="container py-20 text-center text-ink-muted">Ürünler yükleniyor…</div>}>
        <ProductsBrowser />
      </Suspense>
    </>
  )
}
