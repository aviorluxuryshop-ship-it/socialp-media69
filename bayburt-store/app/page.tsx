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
      <Image
        src="/images/hero/plate.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(56%_42%_at_50%_36%,rgba(212,175,55,0.08),transparent_74%)]"
      />
      {/*
        Dither, not decoration. The gold wash above is a very low opacity
        gradient; on an 8-bit ramp over a dark ground it quantises into
        visible contours, and the grain has to sit over it to break them up.
      */}
      <span aria-hidden className="grain pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-height)+1.25rem)] z-10 text-center">
        <p className="font-sans text-[10px] uppercase tracking-luxe text-smoke sm:text-[11px]">
          Bayburtspor
        </p>
        <h1 className="mt-2.5 font-display text-[clamp(2rem,5.6vw,4rem)] font-semibold uppercase leading-[0.94] tracking-[0.07em]">
          <span className="gold-text">Miras</span>
          <span className="mt-2 block font-sans text-[clamp(0.55rem,1.2vw,0.7rem)] font-normal tracking-luxe text-smoke">
            Koleksiyonu
          </span>
        </h1>
        <p className="mt-4 font-sans text-[9px] uppercase tracking-luxe text-ash sm:text-[10px]">
          {siteConfig.tagline}
        </p>
      </div>

      <KitSelector products={products} />

      <div className="absolute inset-x-0 bottom-9 z-10 flex justify-center sm:bottom-11">
        <Link
          href="/koleksiyon"
          className="group inline-flex items-center gap-3.5 border border-white/25 bg-obsidian/40 px-9 py-4 font-sans text-[11px] uppercase tracking-luxe text-white backdrop-blur-sm transition-colors duration-500 ease-luxe hover:border-gold-500 hover:text-gold-200"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          Alışveriş yap
        </Link>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-6 z-10 hidden font-sans text-[9px] uppercase leading-relaxed tracking-luxe text-ash lg:block">
        Bayburtspor
        <br />
        Miras Koleksiyonu
      </p>
      <p className="pointer-events-none absolute bottom-6 right-6 z-10 hidden text-right font-sans text-[9px] uppercase leading-relaxed tracking-luxe text-ash lg:block">
        Köklü şehir
        <br />
        Güçlü yarınlar
      </p>

      {/* Baked into the hero plate as artwork; here for readers and crawlers. */}
      <p className="sr-only">
        Tarih, şehir, takım, biz. Kültür, miras, inanç, daima.
      </p>
    </section>
  )
}
