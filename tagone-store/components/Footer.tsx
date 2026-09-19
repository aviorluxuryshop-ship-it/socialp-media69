import Link from 'next/link'
import { Instagram, Mail, Phone } from 'lucide-react'

import { siteConfig } from '@/data/site'

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-carbon text-white/80">
      <div className="container grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-paper">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal text-carbon">
              <span className="text-sm font-bold">T</span>
            </span>
            {siteConfig.name}
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/60">{siteConfig.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">Sayfalar</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li><Link href="/urunler" className="hover:text-signal">Ürünler</Link></li>
            <li><Link href="/hakkimizda" className="hover:text-signal">Hakkımızda</Link></li>
            <li><Link href="/iletisim" className="hover:text-signal">İletişim</Link></li>
            <li><Link href="/sepet" className="hover:text-signal">Sepet</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/50">İletişim</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-signal" /> {siteConfig.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-signal" /> {siteConfig.phone}
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-signal" /> {siteConfig.instagram}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
