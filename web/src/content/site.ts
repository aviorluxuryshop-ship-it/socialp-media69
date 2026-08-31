/**
 * Locale-independent brand facts.
 *
 * Everything here is verified against Socialp Media's own website
 * (socialpmedia.com) — nothing is invented.
 */
export const site = {
  name: 'Socialp Media',
  founded: 2021,
  instagram: {
    handle: '@socialp.media',
    url: 'https://www.instagram.com/socialp.media/',
  },
  tr: {
    phone: '+90 (540) 034 69 69',
    phoneHref: 'tel:+905400346969',
    whatsappHref: 'https://wa.me/905400346969',
    email: 'hello@socialpmedia.com',
  },
  intl: {
    phone: '+1 437 231 1432',
    phoneHref: 'tel:+14372311432',
    whatsappHref: 'https://wa.me/14372311432',
    email: 'business@socialpmedia.com',
  },
  address: {
    line: 'Zuhuratbaba, İncirli Cd. No:69, 34147',
    district: 'Bakırköy / İstanbul',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Zuhuratbaba+İncirli+Cd.+No:69+34147+Bakırköy+İstanbul',
  },
} as const;

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'tr';

/** URL segment that holds the service detail pages, per locale. */
export const serviceSegment: Record<Locale, string> = {
  tr: 'hizmetler',
  en: 'services',
};
