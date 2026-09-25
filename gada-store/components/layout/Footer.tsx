import Link from 'next/link'

import { navigation, siteConfig } from '@/lib/site'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-void px-6 py-14 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-xl font-bold tracking-tight text-mist">GADA</p>
          <p className="mt-2 max-w-xs text-sm text-haze">{siteConfig.tagline}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-haze">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-mist">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm text-haze">
          <p className="text-mist">{siteConfig.manufacturer.legalName}</p>
          <p>
            {siteConfig.manufacturer.city} · {siteConfig.manufacturer.country}
          </p>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl text-xs text-haze/70">
        © {new Date().getFullYear()} GADA. Tüm hakları saklıdır.
      </p>
    </footer>
  )
}
