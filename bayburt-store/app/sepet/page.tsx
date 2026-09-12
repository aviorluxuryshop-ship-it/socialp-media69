import type { Metadata } from 'next'

import { CartView } from '@/components/cart/CartView'
import { Reveal } from '@/components/ui/Reveal'
import { siteConfig } from '@/data/site'

const title = 'Sepet'
const description =
  'Bayburt Store sepetiniz: seçtiğiniz Miras Koleksiyonu formaları, bedenleri ve toplam tutarı. Siparişi vermek için bilgilerinizi girin.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/sepet' },
  // A cart is personal and never the same page twice; there is nothing here
  // for an index to hold on to.
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    url: `${siteConfig.url}/sepet`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: `${title} · ${siteConfig.name}`,
    description,
  },
}

export default function CartPage() {
  return (
    <section className="pb-24 pt-[calc(var(--header-height)+3.5rem)] lg:pb-32 lg:pt-[calc(var(--header-height)+5rem)]">
      <div className="container">
        <Reveal as="p" className="eyebrow">
          Miras Koleksiyonu
        </Reveal>
        <Reveal
          as="h1"
          from="above"
          delay={0.06}
          className="mt-5 font-display text-[clamp(2.2rem,6vw,3.75rem)] font-semibold uppercase leading-[1.1] tracking-tight text-balance text-white"
        >
          Sepetiniz
        </Reveal>

        <div className="mt-12 lg:mt-16">
          <CartView />
        </div>
      </div>
    </section>
  )
}
