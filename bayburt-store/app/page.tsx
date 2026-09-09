import type { Metadata } from 'next'

import { KitSelector } from '@/components/hero/KitSelector'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.collection}`,
  description:
    'Bayburt Store Miras Koleksiyonu: Hisar, Çoruh ve Çinimaçın formaları. Bayburt Kalesi, Çoruh Nehri ve çini motiflerinden doğan üç tasarım.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.collection}`,
    description: 'Üç forma, üç kaynak: kale, nehir ve çini. Formanı seç.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.collection}`,
    description: 'Üç forma, üç kaynak: kale, nehir ve çini. Formanı seç.',
  },
}

export default function HomePage() {
  return (
    <section
      aria-label="Forma seçimi"
      className="grain relative min-h-[100svh] overflow-hidden bg-obsidian"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_44%_at_50%_38%,rgba(212,175,55,0.09),transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]"
      />

      <header className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-height)+1.5rem)] z-10 text-center">
        <p className="eyebrow">Bayburtspor · {siteConfig.founded}</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,4.25rem)] font-semibold uppercase leading-[0.95] tracking-[0.06em]">
          <span className="gold-text">Miras</span>
          <span className="mt-2 block font-sans text-[clamp(0.55rem,1.3vw,0.72rem)] font-normal tracking-luxe text-smoke">
            Koleksiyonu
          </span>
        </h1>
      </header>

      <KitSelector products={products} />

      <p className="pointer-events-none absolute inset-x-0 bottom-7 z-10 text-center font-sans text-[10px] uppercase tracking-luxe text-ash">
        Formanı seç
      </p>
    </section>
  )
}
