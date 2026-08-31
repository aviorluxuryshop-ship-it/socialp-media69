import type { MetadataRoute } from 'next';
import { locales, serviceSegment } from '@/content/site';
import { servicesByLocale } from '@/content/services';

const SITE = 'https://www.socialpmedia.com';

/**
 * Sitemap for search engines. Every locale's home and service pages are listed
 * with hreflang alternates so Google serves the right language per region.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/`]));
  const now = new Date();

  const homes = locales.map((locale) => ({
    url: `${SITE}/${locale}/`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: locale === 'tr' ? 1 : 0.9,
    alternates: { languages },
  }));

  const services = locales.flatMap((locale) =>
    servicesByLocale[locale].map((s) => ({
      url: `${SITE}/${locale}/${serviceSegment[locale]}/${s.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  );

  return [...homes, ...services];
}
