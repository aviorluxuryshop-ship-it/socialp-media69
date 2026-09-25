import type { Metadata } from 'next'

import { flavorList } from '@/lib/flavors'

export const metadata: Metadata = {
  title: 'GADA’nın Hikâyesi',
  description: 'Doğanın tazeliği her yudumda — GADA’nın arkasındaki fikir.',
  alternates: { canonical: '/hikaye' },
}

export default function HikayePage() {
  return (
    <main className="min-h-screen bg-void px-6 pb-24 pt-36 sm:px-10">
      <div className="container max-w-2xl">
        <p className="font-sans text-xs uppercase tracking-wide4 text-haze">Hikâye</p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,7vw,4.2rem)] font-extrabold italic leading-[1.02] tracking-tight text-mist">
          “Doğanın tazeliği her yudumda.”
        </h1>

        <div className="mt-8 flex flex-col gap-5 font-sans text-base leading-relaxed text-haze sm:text-lg">
          <p>
            GADA’nın çıkış noktası basit: gerçek meyve aroması ile soğuk çayın ferahlığını, tek bir kutuda buluşturmak.
            Doğal aroma, dengeli tatlandırma ve sade bir tarif — abartısız, günün her anına uyan bir tazelik.
          </p>
          <p>Bugün bu fikir, iki lezzette hayat buluyor.</p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {flavorList.map((flavor) => (
            <div key={flavor.slug} className="rounded-2xl border border-line p-6">
              <p className="font-display text-2xl font-bold tracking-tight text-mist">{flavor.heroWord}</p>
              <ul className="mt-3 flex flex-col gap-1 font-sans text-xs uppercase tracking-wide3 text-haze">
                {flavor.pack.iconLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
