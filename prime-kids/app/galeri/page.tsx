import type { Metadata } from 'next'
import { PageHeader } from '@/components/Common'
import { GalleryGrid } from '@/components/GalleryGrid'
import { InstagramIcon } from '@/components/BrandIcons'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'Galeri — Stil İlhamı',
  description: 'PRIME KIDS koleksiyonundan kareler. Beğendiğiniz görünüme dokunun, ürüne gidin.',
  alternates: { canonical: '/galeri' },
}

export default function GalleryPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Galeri' }]} eyebrow="Galeri" title="Stil ilhamı" lead="Beğendiğiniz kareye dokunun; büyük hâlini görün ve tek dokunuşla ürüne gidin.">
        {site.social.instagram && (
          <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-5">
            <InstagramIcon className="h-5 w-5" /> Daha fazlası Instagram’da · {site.social.instagramHandle}
          </a>
        )}
      </PageHeader>
      <GalleryGrid />
    </>
  )
}
