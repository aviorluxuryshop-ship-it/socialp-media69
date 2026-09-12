import type { Metadata } from 'next'

import { ContactForm } from '@/components/contact/ContactForm'
import { ContactGrid } from '@/components/contact/ContactGrid'
import { GoldRule } from '@/components/ui/GoldRule'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { contact, siteConfig, socials } from '@/data/site'

const title = 'İletişim'
const description =
  'Bayburt Store ile iletişime geçin: telefon, web, Instagram ve Bayburt merkezdeki flagship mağaza adresi.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/iletisim' },
  openGraph: {
    type: 'website',
    url: `${siteConfig.url}/iletisim`,
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

const DEPARTMENTS = [
  { label: 'Sipariş ve kargo', value: contact.email, href: contact.emailHref },
  { label: 'Kurumsal ve toplu alım', value: 'kurumsal@bayburtstore.com', href: 'mailto:kurumsal@bayburtstore.com' },
  { label: 'Basın', value: 'basin@bayburtstore.com', href: 'mailto:basin@bayburtstore.com' },
]

export default function ContactPage() {
  return (
    <>
      <section className="grain relative overflow-hidden pb-16 pt-[calc(var(--header-height)+4.5rem)] lg:pb-20 lg:pt-[calc(var(--header-height)+7rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(62%_42%_at_50%_0%,rgba(212,175,55,0.09),transparent_72%)]"
        />
        <div className="container relative">
          <Reveal as="p" className="eyebrow" distance={12}>
            İletişim
          </Reveal>
          <Reveal
            as="h1"
            from="above"
            delay={0.06}
            className="mt-6 max-w-3xl font-display text-[clamp(2.4rem,7vw,5rem)] font-semibold uppercase leading-[1.1] tracking-tight text-balance text-white"
          >
            Kapımız açık
          </Reveal>
          <Reveal
            as="p"
            delay={0.12}
            className="mt-8 max-w-xl font-sans text-base leading-relaxed text-pretty text-smoke"
          >
            Mağazamız Bayburt merkezde. Beden, stok ve koleksiyon sorularınız için telefonla ulaşın
            ya da doğrudan gelin — formaların hepsi vitrinde.
          </Reveal>
          <div className="mt-14">
            <GoldRule />
          </div>
        </div>
      </section>

      <section className="pb-4 lg:pb-8" aria-label="İletişim kanalları">
        <div className="container">
          <ContactGrid />
        </div>
      </section>

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="magaza">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading eyebrow="Mağaza" title={<span id="magaza">{contact.store.name}</span>} />

              <RevealGroup as="dl" className="mt-10 divide-y divide-white/10 border-y border-white/10">
                <RevealItem className="grid gap-2 py-5 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <dt className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                    Adres
                  </dt>
                  <dd className="font-sans text-sm leading-relaxed text-smoke">
                    {contact.store.addressLine}
                    <br />
                    {contact.store.district} · {contact.store.postalCode}
                    <br />
                    {contact.store.country}
                  </dd>
                </RevealItem>
                <RevealItem className="grid gap-2 py-5 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <dt className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                    Çalışma saatleri
                  </dt>
                  <dd className="font-sans text-sm leading-relaxed text-smoke">
                    {contact.store.hours}
                    <br />
                    Pazar kapalı
                  </dd>
                </RevealItem>
                <RevealItem className="grid gap-2 py-5 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <dt className="font-sans text-[11px] uppercase tracking-wider2 text-gold-600">
                    Telefon
                  </dt>
                  <dd className="font-sans text-sm leading-relaxed text-smoke">
                    <a href={contact.phoneHref} className="link-underline hover:text-white">
                      {contact.phone}
                    </a>
                  </dd>
                </RevealItem>
              </RevealGroup>
            </div>

            <div>
              <SectionHeading eyebrow="Departmanlar" title="Doğrudan yazın" />

              <RevealGroup as="ul" className="mt-10 divide-y divide-white/10 border-y border-white/10">
                {DEPARTMENTS.map((department) => (
                  <RevealItem as="li" key={department.label}>
                    <a
                      href={department.href}
                      className="group flex flex-wrap items-baseline justify-between gap-3 py-5"
                    >
                      <span className="font-sans text-[11px] uppercase tracking-wider2 text-ash">
                        {department.label}
                      </span>
                      <span className="font-sans text-sm text-smoke transition-colors duration-500 group-hover:text-gold-300">
                        {department.value}
                      </span>
                    </a>
                  </RevealItem>
                ))}
              </RevealGroup>

              <Reveal className="mt-12">
                <p className="eyebrow-muted mb-5">Sosyal</p>
                <ul className="flex flex-wrap gap-x-8 gap-y-3">
                  {socials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-underline font-sans text-sm text-smoke transition-colors duration-300 hover:text-white"
                      >
                        {social.label} <span className="text-ash">{social.handle}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-20 lg:py-28" aria-labelledby="form">
        <div className="container">
          <div className="max-w-2xl">
            <SectionHeading eyebrow="Mesaj" title={<span id="form">Bize yazın</span>} />
            <Reveal
              as="p"
              delay={0.08}
              className="mt-6 font-sans text-[15px] leading-relaxed text-pretty text-smoke"
            >
              Formu doldurun, mesajınız kendi e-posta uygulamanızda hazır olarak açılsın —
              göndermeden önce son hâlini görürsünüz.
            </Reveal>
            <Reveal delay={0.14}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
