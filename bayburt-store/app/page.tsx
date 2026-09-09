import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { HeroSelector } from '@/components/hero/HeroSelector'
import { GoldRule } from '@/components/ui/GoldRule'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.collection}`,
  description:
    'Bayburt Store Miras Koleksiyonu: Hisar, Çoruh ve Çinimaçın formaları. Bayburt Kalesi, Çoruh Nehri ve çini motiflerinden doğan üç sınırlı üretim tasarım.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.collection}`,
    description:
      'Üç forma, üç kaynak: kale, nehir ve çini. Bayburtspor Miras Koleksiyonu, Bayburt Store’da.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.collection}`,
    description: 'Üç forma, üç kaynak: kale, nehir ve çini. Bayburtspor Miras Koleksiyonu.',
  },
}

const CREED_LEFT = ['Tarih', 'Şehir', 'Takım', 'Biz']
const CREED_RIGHT = ['Kültür', 'Miras', 'İnanç', 'Daima']

export default function HomePage() {
  return (
    <>
      <HeroSelector />

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="ilke">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-20">
            <RevealGroup as="ul" className="space-y-3" stagger={0.08}>
              {CREED_LEFT.map((word) => (
                <RevealItem
                  as="li"
                  key={word}
                  className="font-sans text-[11px] uppercase tracking-luxe text-smoke"
                >
                  {word}
                </RevealItem>
              ))}
            </RevealGroup>

            <div className="max-w-xl text-center">
              <Reveal as="h2" className="font-display text-[clamp(1.6rem,3.6vw,2.5rem)] font-semibold uppercase leading-tight tracking-tight text-balance text-white">
                <span id="ilke">Bir forma, şehrin kendine anlattığı cümledir</span>
              </Reveal>
              <Reveal as="p" delay={0.1} className="mx-auto mt-6 max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-smoke">
                Miras Koleksiyonu, Bayburt’un üç kalıcı işaretinden doğdu. Kalenin ritmi, nehrin
                berraklığı, çininin sabrı. Hiçbiri süsleme değil; hepsi ölçü.
              </Reveal>
              <div className="mt-10">
                <GoldRule className="mx-auto max-w-[220px] bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
              </div>
            </div>

            <RevealGroup as="ul" className="space-y-3 lg:text-right" stagger={0.08} delayChildren={0.14}>
              {CREED_RIGHT.map((word) => (
                <RevealItem
                  as="li"
                  key={word}
                  className="font-sans text-[11px] uppercase tracking-luxe text-smoke"
                >
                  {word}
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="kaynaklar">
        <div className="container">
          <SectionHeading
            eyebrow="Kaynaklar"
            title={<span id="kaynaklar">Üç forma, üç hikâye</span>}
            lead="Her tasarım tek bir yerden besleniyor. Koleksiyon sayfasında hikâyenin tamamı, formanın üzerindeki her çizginin nereden geldiğiyle birlikte anlatılıyor."
          />

          <RevealGroup className="mt-14 grid gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-3">
            {products.map((product) => (
              <RevealItem key={product.slug} className="bg-obsidian">
                <Link
                  href={`/koleksiyon#${product.slug}`}
                  className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors duration-700 ease-luxe hover:bg-graphite-dark lg:p-10"
                >
                  <div>
                    <p className="font-sans text-[11px] uppercase tracking-wider2 text-gold-500">
                      {product.story.source}
                    </p>
                    <h3 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-white">
                      {product.story.heading}
                    </h3>
                    <p className="mt-5 font-sans text-sm leading-relaxed text-pretty text-ash">
                      {product.tagline}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-wider2 text-smoke transition-colors duration-500 group-hover:text-gold-300">
                    {product.displayName}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-14" delay={0.05}>
            <Link
              href="/koleksiyon"
              className="group inline-flex items-center gap-3 border border-white/15 px-8 py-4 font-sans text-[11px] uppercase tracking-luxe text-white transition-colors duration-500 ease-luxe hover:border-gold-600 hover:text-gold-300"
            >
              Koleksiyonu keşfet
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
