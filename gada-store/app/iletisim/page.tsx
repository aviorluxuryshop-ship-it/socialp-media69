import type { Metadata } from 'next'

import { siteConfig } from '@/lib/site'

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'GADA üretici bilgileri ve iletişim.',
  alternates: { canonical: '/iletisim' },
}

export default function IletisimPage() {
  return (
    <main className="min-h-screen bg-void px-6 pb-24 pt-36 sm:px-10">
      <div className="container max-w-2xl">
        <p className="font-sans text-xs uppercase tracking-wide4 text-haze">İletişim</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.8rem)] font-extrabold leading-[1] tracking-tight text-mist">
          Üretici Bilgileri
        </h1>

        <div className="mt-8 flex flex-col gap-2 font-sans text-base text-haze sm:text-lg">
          <p className="text-mist">{siteConfig.manufacturer.legalName}</p>
          <p>Bayburt Organize Sanayi Bölgesi</p>
          <p>
            {siteConfig.manufacturer.city} / {siteConfig.manufacturer.country}
          </p>
        </div>

        <p className="mt-10 max-w-md font-sans text-sm text-haze/80">
          Ürün ve marka ile ilgili sorularınız için ambalaj üzerinde yer alan üretici bilgilerine başvurabilirsiniz.
        </p>
      </div>
    </main>
  )
}
