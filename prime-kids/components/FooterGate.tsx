'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { site } from '@/data/site'

/** Ödeme sayfasında dikkat dağıtmayan sade bir alt bilgi gösterir. */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (!pathname.startsWith('/odeme')) return <>{children}</>
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <div className="container flex flex-col items-center gap-3 py-6 text-center text-[13px] text-ink-muted md:flex-row md:justify-between md:text-left">
        <p className="flex items-center gap-1.5 font-semibold">
          <Lock className="h-4 w-4" aria-hidden="true" /> 256-bit SSL · 3D Secure · © {new Date().getFullYear()} {site.name}
        </p>
        <nav aria-label="Yasal metinler">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {[
              ['İade ve Değişim', '/yasal/iade-ve-degisim'],
              ['KVKK', '/yasal/kvkk-aydinlatma-metni'],
              ['Güvenli Alışveriş', '/yasal/guvenli-alisveris'],
              ['İletişim', '/iletisim'],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} className="inline-flex min-h-[36px] items-center hover:text-ink">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
