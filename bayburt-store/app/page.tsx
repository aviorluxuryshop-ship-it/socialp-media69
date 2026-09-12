import type { Metadata } from 'next'
import Image from 'next/image'

import { KitSelector } from '@/components/hero/KitSelector'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.collection}`,
  description:
    'Bayburt Store Miras Koleksiyonu: Hisar, Çoruh ve Çinimaçin formaları. Bayburt Kalesi, Çoruh Nehri ve çini motiflerinden doğan üç tasarım.',
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

          {/* A pool of shadow under each kit. The valley behind them is pale,
              and the white Çoruh in particular loses its silhouette against
              it; this gives all three something to stand out from. Centred on
              the same fractions the stage places the kits at. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{
              background: [
                'radial-gradient(19% 37% at 27.6% 52%, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0.32) 46%, transparent 72%)',
                'radial-gradient(18% 35% at 51.6% 52%, rgba(5,5,5,0.68) 0%, rgba(5,5,5,0.38) 46%, transparent 72%)',
                'radial-gradient(19% 37% at 76.4% 52%, rgba(5,5,5,0.58) 0%, rgba(5,5,5,0.3) 46%, transparent 72%)',
              ].join(', '),
            }}
          />
          <KitSelector products={products} />

          {/* The kits are the buttons. This says so — anchored to the plate,
              not to the window, and on desktop stacked below the kit names by
              a fixed distance so the four things never close up on a short
              window. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-6 sm:bottom-12 lg:bottom-auto lg:top-[calc(var(--plate-foot,74.5%)+103px)]">
            <p
              data-hero-cue
              className="flex items-center gap-3.5 text-balance text-center font-sans text-[11px] uppercase tracking-luxe text-gold-300"
            >
              {/* The rules only read as rules beside a single line; at phone
                  width the sentence wraps and they would hang off one edge. */}
              <span aria-hidden className="hidden h-px w-7 bg-gold-600/70 sm:block" />
              Bir forma seçin, alışverişe başlayın
              <span aria-hidden className="hidden h-px w-7 bg-gold-600/70 sm:block" />
            </p>
          </div>
        </div>
      </div>

      <div
        data-hero-head
        className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-height)+1.25rem)] z-10 text-center lg:hidden"
      >
        <p className="font-sans text-[10px] uppercase tracking-luxe text-white/85 [text-shadow:0_1px_14px_rgba(5,5,5,0.95)] sm:text-[11px]">
          Bayburtspor
        </p>
        <h1 className="mt-2.5 font-display text-[clamp(2.5rem,11vw,4rem)] font-semibold uppercase leading-[1.06] tracking-[0.07em] [text-shadow:0_2px_22px_rgba(5,5,5,0.95)]">
          <span className="gold-text">Miras</span>
          <span className="mt-2 block font-sans text-[clamp(0.6rem,2.4vw,0.7rem)] font-normal tracking-luxe text-white/85">
            Koleksiyonu
          </span>
        </h1>
        <p className="mt-4 font-sans text-[9px] uppercase tracking-luxe text-white/70 [text-shadow:0_1px_14px_rgba(5,5,5,0.95)] sm:text-[10px]">
          {siteConfig.tagline}
        </p>
      </div>



      {/* The plate carries the wordmark as artwork on desktop; this is the
          same text for readers and crawlers. */}
      <p className="sr-only">
        Bayburtspor Miras Koleksiyonu — geçmişten gelen, geleceğe taşınan. Hisar, Çoruh,
        Çinimaçin. Tarih, şehir, takım, biz. Kültür, miras, inanç, daima.
      </p>
    </section>
  )
}
