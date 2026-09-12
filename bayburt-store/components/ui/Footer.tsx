import Link from 'next/link'

import { navigation, siteConfig } from '@/data/site'
import { products } from '@/data/products'

export function Footer() {
  const year = 2025

  return (
    <footer className="relative border-t border-ink/14 bg-paper">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold uppercase tracking-[0.28em] text-ink">
              Bayburt
              <span className="ml-2 font-sans text-[10px] tracking-luxe text-gold-800">Store</span>
            </p>
            <p className="mt-5 max-w-xs font-sans text-sm leading-relaxed text-ink-mute">
              {siteConfig.collection} — şehrin kalesinden, nehrinden ve çinisinden gelen üç
              forma.
            </p>
          </div>

          <nav aria-label="Alt menü">
            <p className="eyebrow-muted mb-5">Site</p>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline font-sans text-sm text-ink-soft transition-colors duration-300 hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Formalar">
            <p className="eyebrow-muted mb-5">Formalar</p>
            <ul className="space-y-3">
              {products.map((product) => (
                <li key={product.slug}>
                  <Link
                    href={`/koleksiyon/${product.slug}`}
                    className="link-underline font-sans text-sm text-ink-soft transition-colors duration-300 hover:text-ink"
                  >
                    {product.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-ink/14 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[11px] uppercase tracking-wider2 text-ink-mute">
            © {year} {siteConfig.name} · Tüm hakları saklıdır
          </p>
        </div>
      </div>
    </footer>
  )
}
