import { tr, type Dict } from '@/content/tr';
import { en } from '@/content/en';
import { defaultLocale, locales, serviceSegment, type Locale } from '@/content/site';

const dicts: Record<Locale, Dict> = {
  tr,
  en: { ...en, locale: 'en' as unknown as 'tr' },
};

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts[defaultLocale];
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Home path for a locale, e.g. `/tr/`. */
export function homePath(locale: Locale) {
  return `/${locale}/`;
}

/** Service detail path, e.g. `/tr/hizmetler/web-tasarim-kurulum/`. */
export function servicePath(locale: Locale, slug: string) {
  return `/${locale}/${serviceSegment[locale]}/${slug}/`;
}

/** In-page anchors used by the header and footer navigation. */
export const anchors = {
  services: 'hizmetler',
  work: 'calismalarimiz',
  about: 'hakkimizda',
  contact: 'iletisim',
} as const;
