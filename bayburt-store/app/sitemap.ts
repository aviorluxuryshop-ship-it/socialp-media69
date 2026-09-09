import type { MetadataRoute } from 'next'

import { products } from '@/data/products'
import { siteConfig } from '@/data/site'
import { absoluteUrl } from '@/lib/utils'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2025-08-01')

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/', siteConfig.url), lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/koleksiyon', siteConfig.url), lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: absoluteUrl('/hakkimizda', siteConfig.url), lastModified, changeFrequency: 'yearly', priority: 0.6 },
    { url: absoluteUrl('/iletisim', siteConfig.url), lastModified, changeFrequency: 'yearly', priority: 0.6 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/forma/${product.slug}`, siteConfig.url),
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
