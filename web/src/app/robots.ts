import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/** Allow full crawling and point search engines at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://www.socialpmedia.com/sitemap.xml',
  };
}
