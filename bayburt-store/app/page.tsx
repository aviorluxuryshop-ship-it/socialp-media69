import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

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
      className="relative min-h-[100svh] overflow-hidden bg-obsidian"
    >
      {/* Plate and stage share one box that starts below the fixed header, so
          the navigation never lands on the wordmark painted into the banner. */}
      <div className="absolute inset-x-0 bottom-0 top-[var(--header-height)]">
        {/* Two plates, not one crop. The landscape banner is unreadable at
            phone width, so portrait gets its own composition. */}
        <Image
          src="/images/hero/plate-mobile.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center lg:hidden"
        />
        <Image
          src="/images/hero/plate.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          // Pinned to the top: a wide window crops the plate vertically, and
          // centring it takes the BAYBURTSPOR line off the wordmark.
          className="hidden object-cover object-top lg:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.45)_0%,transparent_30%,transparent_66%,rgba(5,5,5,0.72)_100%)] lg:bg-[linear-gradient(180deg,transparent_0%,transparent_72%,rgba(5,5,5,0.7)_100%)]"
        />
        <KitSelector products={products} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-height)+1.25rem)] z-10 text-center lg:hidden">
        <p className="font-sans text-[10px] uppercase tracking-luxe text-smoke sm:text-[11px]">
          Bayburtspor
        </p>
        <h1 className="mt-2.5 font-display text-[clamp(2.5rem,11vw,4rem)] font-semibold uppercase leading-[0.94] tracking-[0.07em]">
          <span className="gold-text">Miras</span>
          <span className="mt-2 block font-sans text-[clamp(0.6rem,2.4vw,0.7rem)] font-normal tracking-luxe text-smoke">
            Koleksiyonu
          </span>
        </h1>
        <p className="mt-4 font-sans text-[9px] uppercase tracking-luxe text-ash sm:text-[10px]">
          {siteConfig.tagline}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-9 z-10 flex justify-center sm:bottom-11 lg:bottom-2">
        <Link
          href="/koleksiyon"
          className="group inline-flex items-center gap-3.5 border border-white/25 bg-obsidian/40 px-9 py-4 lg:py-3 font-sans text-[11px] uppercase tracking-luxe text-white backdrop-blur-sm transition-colors duration-500 ease-luxe hover:border-gold-500 hover:text-gold-200"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          Alışveriş yap
        </Link>
      </div>


      {/* The plate carries the wordmark as artwork on desktop; this is the
          same text for readers and crawlers. */}
      <p className="sr-only">
        Bayburtspor Miras Koleksiyonu — geçmişten gelen, geleceğe taşınan. Hisar, Çoruh,
        Çinimaçın. Tarih, şehir, takım, biz. Kültür, miras, inanç, daima.
      </p>
    </section>
  )
}
