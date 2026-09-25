import type { MetadataRoute } from 'next'

import { flavorList } from '@/lib/flavors'
import { siteConfig } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const url = (path: string) => `${siteConfig.url}${path}`

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: url('/icecekler'), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: url('/hakkimizda'), lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: url('/hikaye'), lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: url('/iletisim'), lastModified, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const productRoutes: MetadataRoute.Sitemap = flavorList.map((flavor) => ({
    url: url(`/icecekler/${flavor.slug}`),
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
