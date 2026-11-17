'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Home, LayoutGrid, ShoppingBag, Images } from 'lucide-react'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { useCart, summarize } from '@/lib/cart'
import { useUI } from '@/components/UIProvider'
import { whatsappLink } from '@/data/site'

/** Ürün detayı, sepet ve ödeme ekranlarında kendi alt çubukları olduğu için gizlenir. */
const HIDDEN_ON = ['/urun/', '/sepet', '/odeme']

export function BottomNav() {
  const pathname = usePathname()
  const cart = useCart()
  const { count } = summarize(cart)
  const { cartPulse } = useUI()
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p))

  useEffect(() => {
    document.body.classList.toggle('no-bottom-nav', hidden)
  }, [hidden])

  if (hidden) return null

  const items = [
    { href: '/', label: 'Ana Sayfa', icon: Home, active: pathname === '/' },
    { href: '/urunler', label: 'Ürünler', icon: LayoutGrid, active: pathname.startsWith('/urunler') },
    { href: '/galeri', label: 'Galeri', icon: Images, active: pathname.startsWith('/galeri') },
    { href: '/sepet', label: 'Sepetim', icon: ShoppingBag, active: false, badge: count },
  ]

  return (
    <nav
      aria-label="Hızlı erişim"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="grid h-[62px] grid-cols-5">
        {items.map(({ href, label, icon: Icon, active, badge }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11.5px] font-bold ${active ? 'text-ink' : 'text-ink-muted'}`}
            >
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" />
                {!!badge && (
                  <span
                    key={cartPulse}
                    className="absolute -right-2.5 -top-1.5 grid min-w-[18px] animate-pop place-items-center rounded-full bg-coral px-1 font-display text-[10.5px] leading-[18px] text-white"
                  >
                    {badge}
                    <span className="sr-only"> ürün</span>
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
        <li>
          <a
            href={whatsappLink('Merhaba, bir sorum var.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full flex-col items-center justify-center gap-0.5 text-[11.5px] font-bold text-[#187a41]"
          >
            <WhatsAppIcon className="h-[22px] w-[22px]" />
            Destek
          </a>
        </li>
      </ul>
    </nav>
  )
}
