import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { StoryBlock } from '@/components/collection/StoryBlock'
import { GoldRule } from '@/components/ui/GoldRule'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

const title = 'Koleksiyon'
const description =
  'Bayburt Store Miras Koleksiyonu’nun hikâyesi: Bayburt Kalesi’nden Hisar, Çoruh Nehri’nden Çoruh, çini motiflerinden Çinimaçın. Her formanın kaynağı, ölçüsü ve anlamı.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/koleksiyon' },
  keywords: [...siteConfig.keywords, 'Bayburt Kalesi', 'Çoruh Nehri', 'çini motifleri'],
  openGraph: {
    type: 'article',
    url: `${siteConfig.url}/koleksiyon`,
    title: `${title} · ${siteConfig.name}`,
    description,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · ${siteConfig.name}`,
    description,
  },
}

const CHAPTERS = [
  { label: 'Kale', value: 'Hisar' },
  { label: 'Nehir', value: 'Çoruh' },
  { label: 'Çini', value: 'Çinimaçın' },
]

export default function CollectionPage() {
  return (
    <>
      <section className="grain relative overflow-hidden pb-16 pt-[calc(var(--header-height)+4.5rem)] lg:pb-24 lg:pt-[calc(var(--header-height)+7rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_45%_at_50%_0%,rgba(212,175,55,0.09),transparent_72%)]"
        />

        <div className="container relative">
          <Reveal as="p" className="eyebrow" distance={12}>
            {siteConfig.collection}
          </Reveal>

          <Reveal
            as="h1"
            delay={0.06}
            className="mt-6 max-w-4xl font-display text-[clamp(2.4rem,7vw,5rem)] font-semibold uppercase leading-[0.98] tracking-tight text-balance text-white"
          >
            Geçmişten gelen, geleceğe taşınan
          </Reveal>

          <Reveal
            as="p"
            delay={0.12}
            className="mt-8 max-w-2xl font-sans text-base leading-relaxed text-pretty text-smoke"
          >
            Üç forma tasarlanmadı; okundu. Bayburt’un üç kalıcı işareti — kale, nehir, çini —
            ölçüye çevrildi, sonra kumaşa. Aşağıda her birinin nereden geldiği anlatılıyor.
          </Reveal>

          <div className="mt-14">
            <GoldRule />
          </div>

          <RevealGroup as="ul" className="mt-10 grid gap-8 sm:grid-cols-3" stagger={0.1}>
            {CHAPTERS.map((chapter, index) => (
              <RevealItem as="li" key={chapter.value}>
                <p className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                  Bölüm {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-3 font-display text-xl uppercase tracking-wider2 text-white">
                  {chapter.value}
                </p>
                <p className="mt-1.5 font-sans text-sm text-ash">{chapter.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {products.map((product, index) => (
        <StoryBlock key={product.slug} product={product} index={index} />
      ))}

      <section className="border-t border-white/10 py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-display text-[clamp(1.7rem,4vw,2.75rem)] font-semibold uppercase leading-tight tracking-tight text-balance text-white">
              Üçü bir arada
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-6 font-sans text-[15px] leading-relaxed text-pretty text-smoke">
              Kale, nehir ve çini. Üç forma ayrı ayrı durur, yan yana geldiğinde şehrin
              tamamını anlatır.
            </Reveal>
            <Reveal delay={0.14} className="mt-10">
              <Link
                href="/koleksiyon/hisar"
                className="group inline-flex items-center gap-3 border border-gold-600/60 bg-gold-500/5 px-8 py-4 font-sans text-[11px] uppercase tracking-luxe text-gold-300 transition-colors duration-500 ease-luxe hover:bg-gold-500/10 hover:text-gold-100"
              >
                Alışverişe başla
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
