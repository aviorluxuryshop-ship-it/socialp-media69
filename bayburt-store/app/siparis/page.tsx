import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { Reveal } from '@/components/ui/Reveal'
import { siteConfig } from '@/data/site'

const title = 'Sipariş bilgileri'
const description =
  'Bayburt Store sipariş bilgileri: teslimat adresinizi girin, sipariş özetinizi kontrol edin ve ödemeye geçin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/siparis' },
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    url: `${siteConfig.url}/siparis`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: `${title} · ${siteConfig.name}`,
    description,
  },
}

export default function CheckoutPage() {
  return (
    <section className="pb-24 pt-[calc(var(--header-height)+3.5rem)] lg:pb-32 lg:pt-[calc(var(--header-height)+5rem)]">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Sepet · Sipariş bilgileri · Ödeme
        </Reveal>
        <Reveal
          as="h1"
          from="above"
          delay={0.06}
          className="mt-5 font-display text-[clamp(2.2rem,6vw,3.75rem)] font-semibold uppercase leading-[1.1] tracking-tight text-balance text-white"
        >
          Sipariş bilgileri
        </Reveal>

        <div className="mt-12 lg:mt-16">
          <CheckoutForm />
        </div>
      </div>
    </section>
  )
}
