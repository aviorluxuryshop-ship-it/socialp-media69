import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/content/site';
import { getDict, isLocale } from '@/lib/dict';
import { Motion } from '@/components/Motion';
import { Preloader } from '@/components/Preloader';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LangSync } from '@/components/LangSync';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDict(locale);

  return {
    title: { default: dict.meta.title, template: `%s — Socialp Media` },
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}/`,
      languages: { tr: '/tr/', en: '/en/', 'x-default': '/tr/' },
    },
    openGraph: {
      type: 'website',
      siteName: 'Socialp Media',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typed = locale as Locale;
  const dict = getDict(typed);

  return (
    <>
      {/* The root <html lang> is static for export; correct it per locale. */}
      <LangSync lang={dict.htmlLang} />
      <Motion />
      <Preloader label={dict.footer.tagline} />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-paper focus:px-4 focus:py-3 focus:text-ink"
      >
        {dict.nav.skipToContent}
      </a>

      {/*
       * `lang` must sit on a real wrapper, not just <html>: CSS text-transform
       * is language-sensitive, so with a static lang="tr" root the English
       * pages were upper-casing "i" to the Turkish dotted "İ".
       */}
      <div lang={dict.htmlLang}>
        <Header dict={dict} locale={typed} />
        <main id="main">{children}</main>
        <Footer dict={dict} locale={typed} />
      </div>

    </>
  );
}
