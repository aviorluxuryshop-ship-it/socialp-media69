import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { products } from '@/data/products'

export const metadata: Metadata = {
  title: 'Sayfa bulunamadı',
  description: 'Aradığınız sayfa Bayburt Store’da bulunamadı.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <section className="grain relative flex min-h-[78vh] items-center overflow-hidden pt-[var(--header-height)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_44%_at_50%_10%,rgba(212,175,55,0.09),transparent_72%)]"
      />
      <div className="container relative">
        <p className="eyebrow">Hata 404</p>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.2rem,6vw,4rem)] font-semibold uppercase leading-[1] tracking-tight text-balance text-white">
          Bu sayfa koleksiyonda yok
        </h1>
        <p className="mt-7 max-w-xl font-sans text-[15px] leading-relaxed text-pretty text-smoke">
          Adres değişmiş ya da forma yayından kalkmış olabilir. Miras Koleksiyonu’ndaki üç forma
          aşağıda duruyor.
        </p>

        <ul className="mt-12 flex flex-wrap gap-3">
          {products.map((product) => (
            <li key={product.slug}>
              <Link
                href={`/koleksiyon/${product.slug}`}
                className="group inline-flex items-center gap-2.5 border border-white/15 px-6 py-3.5 font-sans text-[11px] uppercase tracking-luxe text-white transition-colors duration-500 ease-luxe hover:border-gold-600 hover:text-gold-300"
              >
                {product.displayName}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10">
          <Link
            href="/"
            className="link-underline font-sans text-[11px] uppercase tracking-luxe text-smoke hover:text-white"
          >
            Anasayfaya dön
          </Link>
        </p>
      </div>
    </section>
  )
}
