import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Metadata } from 'next'

import { flavorList } from '@/lib/flavors'

export const metadata: Metadata = {
  title: 'İçeceklerimiz',
  description: 'GADA Şeftali ve GADA Limon — gerçek meyve ve soğuk çay aromalı içecekler, 330 ml alüminyum kutuda.',
  alternates: { canonical: '/icecekler' },
}

export default function IceceklerPage() {
  return (
    <main className="min-h-screen bg-void px-6 pb-24 pt-36 sm:px-10">
      <div className="container">
        <p className="font-sans text-xs uppercase tracking-wide4 text-haze">GADA</p>
        <h1 className="mt-3 max-w-2xl font-display text-[clamp(2.4rem,7vw,4.5rem)] font-extrabold leading-[0.98] tracking-tight text-mist">
          İçeceklerimiz
        </h1>
        <p className="mt-4 max-w-lg text-balance font-sans text-base text-haze sm:text-lg">
          Gerçek meyve ve soğuk çay aromalarıyla, 330 ml alüminyum kutuda. Her lezzetin kendi sahnesine girin.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {flavorList.map((flavor) => (
            <Link
              key={flavor.slug}
              href={`/icecekler/${flavor.slug}`}
              className="group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl border border-line px-6 pb-10 pt-20 transition-colors duration-500 hover:border-[color:var(--card-accent)]"
              style={{ '--card-accent': flavor.palette.accent } as CSSProperties}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(65% 55% at 50% 18%, ${flavor.palette.accent}26 0%, transparent 70%)`,
                }}
              />
              <div className="relative h-72 w-36 transition-transform duration-700 ease-cinema group-hover:-translate-y-2 sm:h-96 sm:w-48">
                <Image
                  src={flavor.texture.cutout}
                  alt={`${flavor.name} kutusu`}
                  fill
                  sizes="260px"
                  className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
                />
              </div>
              <h2 className="relative mt-8 font-display text-4xl font-bold tracking-tight text-mist">
                {flavor.heroWord}
              </h2>
              <p className="relative mt-1 max-w-[22ch] text-center font-sans text-xs uppercase tracking-wide3 text-haze">
                {flavor.pack.frontSubtitle.join(' ')}
              </p>
              <span className="relative mt-6 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-wide3 text-mist opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Keşfet →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
