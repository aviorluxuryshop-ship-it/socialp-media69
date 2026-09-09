import Link from 'next/link'

import { contact, navigation, siteConfig, socials } from '@/data/site'
import { products } from '@/data/products'

export function Footer() {
  const year = 2025

  return (
    <footer className="relative border-t border-white/10 bg-obsidian">
      <div className="container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <p className="font-display text-lg font-semibold uppercase tracking-[0.28em] text-white">
              Bayburt
              <span className="ml-2 font-sans text-[10px] tracking-luxe text-gold-500">Store</span>
            </p>
            <p className="mt-5 max-w-xs font-sans text-sm leading-relaxed text-ash">
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
                    className="link-underline font-sans text-sm text-smoke transition-colors duration-300 hover:text-white"
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
                    href={`/forma/${product.slug}`}
                    className="link-underline font-sans text-sm text-smoke transition-colors duration-300 hover:text-white"
                  >
                    {product.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow-muted mb-5">İletişim</p>
            <ul className="space-y-3 font-sans text-sm text-smoke">
              <li>
                <a href={contact.phoneHref} className="link-underline hover:text-white">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={contact.emailHref} className="link-underline hover:text-white">
                  {contact.email}
                </a>
              </li>
              <li className="text-ash">{contact.store.addressLine}</li>
              <li className="text-ash">{contact.store.district}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[11px] uppercase tracking-wider2 text-ash">
            © {year} {siteConfig.name} · Tüm hakları saklıdır
          </p>
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-sans text-[11px] uppercase tracking-wider2 text-ash transition-colors duration-300 hover:text-gold-400"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
