import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/data/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/sepet', '/odeme', '/siparis-alindi'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
