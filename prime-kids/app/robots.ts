import type { MetadataRoute } from 'next'
import { SITE_URL, isPreview } from '@/data/site'

export default function robots(): MetadataRoute.Robots {
  // Deneme bilgileri duruyorken arama motorları siteyi listelemesin.
  if (isPreview) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/sepet', '/odeme', '/siparis-alindi'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
