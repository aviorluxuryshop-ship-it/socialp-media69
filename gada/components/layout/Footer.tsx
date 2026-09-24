import Link from 'next/link'

import { company } from '@/data/company'
import { products } from '@/data/products'
import { navigation } from '@/data/site'

export function Footer() {
  return (
    <footer data-tone="dark" className="relative z-10 bg-forest text-cream">
      <div className="container py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-[clamp(3.5rem,2rem+6vw,7.5rem)] font-semibold leading-none tracking-[0.12em]">
              GADA
            </p>
            <p className="mt-6 max-w-sm text-cream/70">
              Limon ve şeftali aromalı soğuk çaylar. {company.legalName}, {company.city}.
            </p>
          </div>
          <nav aria-label="Alt menü">
            <p className="eyebrow mb-5 text-cream/50">Site</p>
            <ul className="space-y-2.5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="eyebrow mb-5 text-cream/50">İçecekler</p>
            <ul className="space-y-2.5">
              {products.map((product) => (
                <li key={product.id}>
                  <Link href={`/icecekler/${product.slug}/`} className="inline-flex items-center gap-3 underline-offset-4 hover:underline">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: product.colors.can }} />
                    GADA {product.short}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap justify-between gap-4 border-t border-forest-line pt-6 text-sm text-cream/60">
          <p>© {new Date().getFullYear()} {company.shortName}. Tüm hakları saklıdır.</p>
          <p>Menşei: {company.country}</p>
        </div>
      </div>
    </footer>
  )
}
