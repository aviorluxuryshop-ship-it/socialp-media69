import type { Metadata } from 'next'
import { PageHeader } from '@/components/Common'
import { GalleryGrid } from '@/components/GalleryGrid'

export const metadata: Metadata = {
  title: 'Galeri — Stil İlhamı',
  description: 'PRIME KIDS koleksiyonundan kareler. Beğendiğiniz görünüme dokunun, ürüne gidin.',
  alternates: { canonical: '/galeri' },
}

export default function GalleryPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Galeri' }]} eyebrow="Galeri" title="Stil ilhamı" lead="Beğendiğiniz kareye dokunun; büyük hâlini görün ve tek dokunuşla ürüne gidin." />
      <GalleryGrid />
    </>
  )
}
