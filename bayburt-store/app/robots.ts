import type { MetadataRoute } from 'next'

import { siteConfig } from '@/data/site'
import { absoluteUrl } from '@/lib/utils'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: absoluteUrl('/sitemap.xml', siteConfig.url),
    host: siteConfig.url,
  }
}
