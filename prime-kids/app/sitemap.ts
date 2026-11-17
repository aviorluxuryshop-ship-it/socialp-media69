import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/data/site'
import { products } from '@/data/products'
import { legalDocs } from '@/data/legal'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages = ['', '/urunler', '/hizmetler', '/beden-rehberi', '/iletisim', '/hakkimizda', '/sss']
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/urun/${p.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...legalDocs.map((d) => ({ url: `${SITE_URL}/yasal/${d.slug}`, lastModified: now, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ]
}
