import type { MetadataRoute } from 'next'

import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/urunler', '/hakkimizda', '/iletisim', '/sepet', '/siparis'].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }))

  const productRoutes = products.map((p) => ({
    url: `${siteConfig.url}/urunler/${p.slug}`,
    lastModified: new Date(),
  }))

  return [...staticRoutes, ...productRoutes]
}
