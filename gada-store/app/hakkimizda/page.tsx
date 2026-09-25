import type { Metadata } from 'next'

import { siteConfig } from '@/lib/site'

export const metadata: Metadata = {
  title: 'GADA Hakkında',
  description: 'GADA, AN Zentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti. tarafından Bayburt’ta üretilir.',
  alternates: { canonical: '/hakkimizda' },
}

export default function HakkimizdaPage() {
  return (
    <main className="min-h-screen bg-void px-6 pb-24 pt-36 sm:px-10">
      <div className="container max-w-2xl">
        <p className="font-sans text-xs uppercase tracking-wide4 text-haze">GADA Hakkında</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.8rem)] font-extrabold leading-[1] tracking-tight text-mist">
          Gerçek meyve, soğuk çay, ferahlık.
        </h1>

        <div className="mt-8 flex flex-col gap-5 font-sans text-base leading-relaxed text-haze sm:text-lg">
          <p>
            GADA, gerçek meyve ve soğuk çay aromalarını bir araya getiren, 330 ml alüminyum kutuda sunulan bir
            içecek serisidir. Serinin iki lezzeti — Şeftali ve Limon — doğal aroma ve ferahlatıcı bir tat arayışıyla
            tasarlanmıştır.
          </p>
          <p>
            Ürünler, {siteConfig.manufacturer.city} Organize Sanayi Bölgesi’nde faaliyet gösteren{' '}
            <strong className="text-mist">{siteConfig.manufacturer.legalName}</strong> tarafından{' '}
            {siteConfig.manufacturer.country}’de üretilmektedir.
          </p>
        </div>
      </div>
    </main>
  )
}
