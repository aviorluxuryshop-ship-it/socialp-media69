import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { GoldRule } from '@/components/ui/GoldRule'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { siteConfig } from '@/data/site'

const title = 'Hakkımızda'
const description =
  'Bayburt Store, Bayburtspor’un mirasını taşıyan resmî mağazadır. 1969’dan bugüne şehrin rengi, kalesi ve kültürü; formaya çevrilen bir hafıza.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/hakkimizda' },
  openGraph: {
    type: 'article',
    url: `${siteConfig.url}/hakkimizda`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: `${title} · ${siteConfig.name}`,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · ${siteConfig.name}`,
    description,
  },
}

const TIMELINE = [
  {
    year: '1969',
    heading: 'Kuruluş',
    body: 'Bayburtspor, şehrin adını sahaya taşımak için kuruldu. Sarı ve siyah, o gün seçildi ve bir daha değişmedi.',
  },
  {
    year: '1970 — 1999',
    heading: 'Anadolu yılları',
    body: 'Uzun yollar, dar bütçeler, dolu tribünler. Kulübün karakteri bu otuz yılda, kazanmaktan çok dayanmakla şekillendi.',
  },
  {
    year: '2000 — 2019',
    heading: 'Yeniden inşa',
    body: 'Altyapıya dönüş. Şehirden çıkan oyuncu, şehirden gelen destekle buluştu; kulüp kendi kaynağına yeniden bağlandı.',
  },
  {
    year: '2025',
    heading: 'Miras Koleksiyonu',
    body: 'Bayburt Store, kulübün görsel hafızasını üç formada topladı. Hisar, Çoruh ve Çinimaçin; tasarım değil, tercüme.',
  },
]

const VALUES = [
  {
    heading: 'Kaynağından tasarım',
    body: 'Hiçbir desen dekoratif değildir. Her çizginin şehirde bir karşılığı vardır; olmayan çizgi formaya girmez.',
  },
  {
    heading: 'Az ama doğru',
    body: 'Gereğinden fazlasını üretmiyoruz. Bir tasarım koleksiyona giriyorsa, şehirde bir karşılığı olduğu içindir.',
  },
  {
    heading: 'Şehirde üretim',
    body: 'Kumaştan baskıya kadar tüm süreç Türkiye’de yürür. Tedarik zinciri kısa, sorumluluk açıktır.',
  },
]

const FIGURES = [
  { value: '1969', label: 'Kuruluş yılı' },
  { value: '69', label: 'Bayburt plakası' },
  { value: 'Türkiye', label: 'Üretim' },
]

export default function AboutPage() {
  return (
    <>
      <section className="grain relative overflow-hidden pb-16 pt-[calc(var(--header-height)+4.5rem)] lg:pb-24 lg:pt-[calc(var(--header-height)+7rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(62%_42%_at_50%_0%,rgba(212,175,55,0.09),transparent_72%)]"
        />
        <div className="container relative">
          <Reveal as="p" className="eyebrow" distance={12}>
            Bayburt Store
          </Reveal>
          <Reveal
            as="h1"
            delay={0.06}
            className="mt-6 max-w-4xl font-display text-[clamp(2.4rem,7vw,5rem)] font-semibold uppercase leading-[1.1] tracking-tight text-balance text-white"
          >
            Bir şehrin hafızası, bir kulübün rengi
          </Reveal>
          <Reveal
            as="p"
            delay={0.12}
            className="mt-8 max-w-2xl font-sans text-base leading-relaxed text-pretty text-smoke"
          >
            Bayburt Store, Bayburtspor’un resmî mağazasıdır. İşimiz forma satmaktan ibaret değil:
            şehrin kendine dair bildiklerini giyilebilir hâle getirmek.
          </Reveal>
          <div className="mt-14">
            <GoldRule />
          </div>
        </div>
      </section>

      <section className="py-4 lg:py-8" aria-label="Rakamlar">
        <div className="container">
          <RevealGroup className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {FIGURES.map((figure) => (
              <RevealItem key={figure.label} className="bg-obsidian px-7 py-9">
                <p className="font-display text-3xl font-semibold tracking-tight text-gold-400">
                  {figure.value}
                </p>
                <p className="mt-3 font-sans text-[11px] uppercase tracking-wider2 text-ash">
                  {figure.label}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="hikaye">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <SectionHeading eyebrow="Hikâye" title={<span id="hikaye">Neden Bayburt</span>} />

            <div className="space-y-6">
              <Reveal as="p" className="max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-smoke">
                Bayburt küçük bir şehirdir; bunu bir eksiklik gibi anlatmayı sevmeyiz. Küçük şehirlerde
                hafıza dağılmaz, birikir. Kale her sabah aynı yerdedir, nehir aynı yataktan geçer,
                çini aynı fırından çıkar.
              </Reveal>
              <Reveal as="p" delay={0.06} className="max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-smoke">
                Bir kulüp bu birikimin en görünür hâlidir. Kırk yıl önce tribünde duran adamla bugün
                orada duran çocuk aynı rengi giyer. Renk değişmediği için, aradaki mesafe de kapanır.
              </Reveal>
              <Reveal as="p" delay={0.12} className="max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-smoke">
                Miras Koleksiyonu bu yüzden nostalji değil. Geçmişi tekrar etmiyoruz; ondan ölçü
                alıyoruz. Kalenin burç aralığı bir çubuk genişliği oluyor, nehrin akıntısı bir baskı
                deseni, çininin sabrı bir yüzey işlemi.
              </Reveal>
              <Reveal as="p" delay={0.18} className="max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-smoke">
                Sonuç, tribünde de sokakta da duran bir giysi. Formanın işi maçta bitmez.
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="zaman">
        <div className="container">
          <SectionHeading eyebrow="Zaman çizgisi" title={<span id="zaman">1969’dan bugüne</span>} />

          <RevealGroup as="ol" className="mt-14 border-t border-white/10">
            {TIMELINE.map((entry) => (
              <RevealItem
                as="li"
                key={entry.year}
                className="grid gap-4 border-b border-white/10 py-9 lg:grid-cols-[180px_220px_1fr] lg:items-baseline lg:gap-10"
              >
                <span className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                  {entry.year}
                </span>
                <h3 className="font-display text-xl uppercase tracking-wider2 text-white">
                  {entry.heading}
                </h3>
                <p className="max-w-prose font-sans text-sm leading-relaxed text-pretty text-ash">
                  {entry.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="ilkeler">
        <div className="container">
          <SectionHeading eyebrow="İlkeler" title={<span id="ilkeler">Nasıl çalışıyoruz</span>} />

          <RevealGroup className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-14">
            {VALUES.map((value, index) => (
              <RevealItem key={value.heading}>
                <p className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-5 font-display text-xl uppercase tracking-wider2 text-white">
                  {value.heading}
                </h3>
                <p className="mt-4 max-w-prose font-sans text-sm leading-relaxed text-pretty text-ash">
                  {value.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-16">
            <Link
              href="/koleksiyon"
              className="group inline-flex items-center gap-3 border border-white/15 px-8 py-4 font-sans text-[11px] uppercase tracking-luxe text-white transition-colors duration-500 ease-luxe hover:border-gold-600 hover:text-gold-300"
            >
              Koleksiyonu gör
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
