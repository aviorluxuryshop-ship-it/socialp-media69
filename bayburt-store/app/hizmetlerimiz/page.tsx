import type { Metadata } from 'next'

import { GoldRule } from '@/components/ui/GoldRule'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { siteConfig } from '@/data/site'

const title = 'Hizmetlerimiz'
const description =
  'Bayburt Store hizmetleri: forma satışı, isim ve numara baskısı, kulüp ve kurumsal toplu üretim, kargo ve iade.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/hizmetlerimiz' },
  openGraph: {
    type: 'website',
    url: `${siteConfig.url}/hizmetlerimiz`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: `${title} · ${siteConfig.name}`,
    description,
  },
  twitter: { card: 'summary_large_image', title: `${title} · ${siteConfig.name}`, description },
}

const SERVICES = [
  {
    heading: 'Forma Satışı',
    body: 'Miras Koleksiyonu’nun üç forması mağazada ve çevrim içi. Beden danışmanlığı için telefonla ulaşabilirsiniz.',
  },
  {
    heading: 'İsim ve Numara Baskısı',
    body: 'Sırt baskısı kulüp tipografisiyle yapılır. Süblimasyon baskı solmaz, çatlamaz; teslim süresi iki iş günüdür.',
  },
  {
    heading: 'Kulüp ve Okul Üretimi',
    body: 'Amatör kulüpler, okullar ve kurumlar için tasarımdan üretime toplu forma. Minimum adet 15.',
  },
  {
    heading: 'Kurumsal Tedarik',
    body: 'Şirketler için turnuva ve etkinlik kitleri: forma, şort, çorap ve taşıma çantası tek pakette.',
  },
  {
    heading: 'Kargo',
    body: 'Türkiye geneli ücretsiz kargo. Bayburt içi siparişler aynı gün elden teslim edilir.',
  },
  {
    heading: 'İade ve Değişim',
    body: 'Kullanılmamış ürünlerde 14 gün içinde koşulsuz iade. Beden değişimi kargo ücretsizdir.',
  },
]

export default function ServicesPage() {
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
            className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,7vw,5rem)] font-semibold uppercase leading-[0.98] tracking-tight text-balance text-white"
          >
            Hizmetlerimiz
          </Reveal>
          <Reveal as="p" delay={0.12} className="mt-8 max-w-xl font-sans text-base leading-relaxed text-pretty text-smoke">
            Formayı satmakla bitmiyor. Baskıdan toplu üretime, kargodan değişime kadar işin tamamı
            bizde.
          </Reveal>
          <div className="mt-14">
            <GoldRule />
          </div>
        </div>
      </section>

      <section className="pb-20 lg:pb-28" aria-labelledby="hizmet">
        <div className="container">
          <SectionHeading eyebrow="Ne yapıyoruz" title={<span id="hizmet">Baştan sona</span>} />
          <RevealGroup className="mt-14 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service, index) => (
              <RevealItem key={service.heading} className="bg-obsidian p-8 lg:p-10">
                <p className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-5 font-display text-xl uppercase tracking-wider2 text-white">
                  {service.heading}
                </h3>
                <p className="mt-4 font-sans text-sm leading-relaxed text-pretty text-ash">
                  {service.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
