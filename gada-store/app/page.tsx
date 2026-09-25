import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import { flavorList } from '@/lib/flavors'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-void">
      <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-6 pt-28 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 45% at 50% 30%, rgba(244,132,46,0.14) 0%, transparent 60%), radial-gradient(55% 40% at 50% 78%, rgba(247,220,48,0.1) 0%, transparent 65%)',
          }}
        />
        <p className="relative font-sans text-xs uppercase tracking-wide4 text-haze">Gerçek meyve · Soğuk çay</p>
        <h1 className="relative mt-4 font-display text-[clamp(3.5rem,16vw,10rem)] font-extrabold leading-[0.88] tracking-tight text-mist">
          GADA
        </h1>
        <p className="relative mt-6 max-w-md text-balance font-sans text-base text-haze sm:text-lg">
          Doğanın tazeliği her yudumda.
        </p>
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/icecekler"
            className="rounded-full bg-mist px-7 py-3 font-sans text-xs font-medium uppercase tracking-wide3 text-void transition-transform duration-300 ease-cinema hover:scale-[1.03]"
          >
            İçecekleri Keşfet
          </Link>
        </div>
      </section>

      <section className="relative border-t border-line px-6 py-20 sm:px-10">
        <div className="container">
          <p className="mb-10 font-sans text-xs uppercase tracking-wide4 text-haze">İki Lezzet</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {flavorList.map((flavor) => (
              <Link
                key={flavor.slug}
                href={`/icecekler/${flavor.slug}`}
                className="group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl border border-line px-6 pb-8 pt-16 transition-colors duration-500 hover:border-[color:var(--card-accent)]"
                style={{ '--card-accent': flavor.palette.accent } as CSSProperties}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(65% 55% at 50% 20%, ${flavor.palette.accent}26 0%, transparent 70%)`,
                  }}
                />
                <div className="relative h-64 w-32 transition-transform duration-700 ease-cinema group-hover:-translate-y-2 sm:h-80 sm:w-40">
                  <Image
                    src={flavor.texture.cutout}
                    alt={`${flavor.name} kutusu`}
                    fill
                    sizes="200px"
                    className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
                    priority={flavor.slug === 'seftali'}
                  />
                </div>
                <h2 className="relative mt-8 font-display text-3xl font-bold tracking-tight text-mist">
                  {flavor.heroWord}
                </h2>
                <p className="relative mt-1 font-sans text-xs uppercase tracking-wide3 text-haze">
                  {flavor.pack.volume} · Soğuk Çay
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
