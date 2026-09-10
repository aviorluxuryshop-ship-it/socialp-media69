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
      {/* Desktop only: the plate never fills a wide window on its own, so the
          ground behind it is the same artwork, blurred back into the dark. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <Image
          src="/images/hero/plate-ground.jpg"
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover blur-[3px]"
        />
        <span className="absolute inset-0 bg-obsidian/72" />
      </span>

      {/* The stage frame: the whole space under the header on a phone, the
          plate's own proportion on a desktop, so the wordmark painted at its
          head and the kit names at its foot are always both in view. */}
      <div className="absolute inset-x-0 bottom-0 top-[var(--header-height)] lg:inset-0 lg:flex lg:items-center lg:justify-center lg:pt-[var(--header-height)]">
        <div className="relative h-full w-full lg:h-[var(--plate-h)] lg:w-[var(--plate-w)]">
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
            className="hidden object-cover object-center lg:block"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.62)_0%,rgba(5,5,5,0.46)_20%,rgba(5,5,5,0.2)_34%,transparent_46%,transparent_64%,rgba(5,5,5,0.78)_100%)] lg:bg-none"
          />
          <KitSelector products={products} />

          {/* Anchored to the plate, not to the window: on desktop it sits in
              the strip under the painted kit names. */}
          <div className="absolute inset-x-0 bottom-9 z-10 flex justify-center sm:bottom-11 lg:bottom-[3.4%]">
            <Link
              href="/koleksiyon"
              className="group inline-flex items-center gap-3.5 border border-white/25 bg-obsidian/40 px-9 py-4 font-sans text-[11px] uppercase tracking-luxe text-white backdrop-blur-sm transition-colors duration-500 ease-luxe hover:border-gold-500 hover:text-gold-200 lg:py-3"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Alışveriş yap
            </Link>
          </div>
        </div>
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



      {/* The plate carries the wordmark as artwork on desktop; this is the
          same text for readers and crawlers. */}
      <p className="sr-only">
        Bayburtspor Miras Koleksiyonu — geçmişten gelen, geleceğe taşınan. Hisar, Çoruh,
        Çinimaçın. Tarih, şehir, takım, biz. Kültür, miras, inanç, daima.
      </p>
    </section>
  )
}
