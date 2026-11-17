'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Menu, ShoppingBag, X, ChevronRight, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { InstagramIcon, StoreIcon, WhatsAppIcon } from '@/components/BrandIcons'
import { nav, site, whatsappLink } from '@/data/site'
import { useCart, summarize } from '@/lib/cart'
import { useUI } from '@/components/UIProvider'
import { formatPrice } from '@/lib/format'

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`) || (href === '/urunler' && pathname.startsWith('/urun/'))

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-white">
      <p className="container flex min-h-[36px] items-center justify-center gap-x-4 whitespace-nowrap text-center font-display text-[12.5px] font-medium tracking-wide sm:gap-x-6">
        <span>{formatPrice(site.shipping.freeOver).replace(',00', '')} üzeri ücretsiz kargo</span>
        <span className="opacity-40 max-[359px]:hidden" aria-hidden="true">•</span>
        <span className="max-[359px]:hidden">{site.returns.days} gün kolay iade</span>
        <span className="hidden opacity-40 sm:inline" aria-hidden="true">•</span>
        <span className="hidden sm:inline">Güvenli ödeme</span>
      </p>
    </div>
  )
}

export function CartButton({ className = '' }: { className?: string }) {
  const cart = useCart()
  const { count } = summarize(cart)
  const { cartPulse } = useUI()
  return (
    <Link
      href="/sepet"
      className={`relative grid h-12 w-12 place-items-center rounded-full hover:bg-ink/5 ${className}`}
      aria-label={count > 0 ? `Sepetim, ${count} ürün` : 'Sepetim, boş'}
    >
      <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden="true" />
      {count > 0 && (
        <span
          key={cartPulse}
          className="absolute right-1 top-1 grid min-w-[20px] animate-pop place-items-center rounded-full bg-coral px-1 font-display text-[11px] font-bold leading-5 text-white"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const isCheckout = pathname.startsWith('/odeme')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('a,button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Ödeme sayfasında dikkat dağıtmayan, sade bir başlık: logo + güvenli ödeme.
  if (isCheckout) {
    return (
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="PRIME KIDS ana sayfa" className="py-2">
            <Logo className="h-8 w-auto" />
          </Link>
          <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-success">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Güvenli Ödeme
          </p>
        </div>
      </header>
    )
  }

  return (
    <>
      <AnnouncementBar />
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          scrolled ? 'border-line bg-white/90 backdrop-blur-md' : 'border-transparent bg-cream'
        }`}
      >
        <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between">
          <button
            type="button"
            className="-ml-2 grid h-12 w-12 place-items-center rounded-full hover:bg-ink/5 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menüyü aç"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          </button>

          <Link href="/" aria-label="PRIME KIDS ana sayfa" className="justify-self-center py-2">
            <Logo className="h-9 w-auto md:h-10" />
          </Link>

          <nav aria-label="Ana menü" className="hidden md:block">
            <ul className="flex items-center gap-1 lg:gap-2">
              {nav.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative rounded-full px-3 py-2 font-display text-[14px] font-semibold transition-colors lg:px-4 ${
                        active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {item.label}
                      {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-ink lg:inset-x-4" aria-hidden="true" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-self-end">
            <a
              href={whatsappLink('Merhaba, bir sorum var.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-12 items-center gap-2 rounded-full px-3 font-display text-[13px] font-semibold text-ink-soft hover:bg-ink/5 lg:flex"
            >
              <WhatsAppIcon className="h-5 w-5 text-[#1f8f4e]" /> Destek
            </a>
            <CartButton className="-mr-2 md:mr-0" />
          </div>
        </div>
      </header>

      {/* Mobil menü */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menü" id="mobile-menu">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={panelRef}
            onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[360px] animate-slide-left flex-col bg-cream shadow-lift"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo className="h-8 w-auto" />
              <button type="button" onClick={() => setOpen(false)} className="grid h-12 w-12 place-items-center rounded-full hover:bg-ink/5" aria-label="Menüyü kapat">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobil menü" className="flex-1 overflow-y-auto px-2 py-3">
              <ul>
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      className="flex min-h-[54px] items-center justify-between rounded-2xl px-4 font-display text-[17px] font-semibold aria-[current=page]:bg-white"
                    >
                      {item.label}
                      <ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/sepet" className="flex min-h-[54px] items-center justify-between rounded-2xl px-4 font-display text-[17px] font-semibold">
                    Sepetim
                    <ChevronRight className="h-5 w-5 text-ink-muted" aria-hidden="true" />
                  </Link>
                </li>
              </ul>
              <p className="mt-5 px-4 eyebrow">Kategoriler</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 px-2">
                {[
                  ['Kız Çocuk', '/urunler?kategori=kiz'],
                  ['Erkek Çocuk', '/urunler?kategori=erkek'],
                  ['Mini 1-5 Yaş', '/urunler?kategori=mini'],
                  ['Kışlık Şardonlu', '/urunler?ozellik=sardonlu'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="flex min-h-[48px] items-center justify-center rounded-2xl border border-line bg-white px-3 text-center text-[14px] font-bold">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-5 space-y-1 px-2 text-[15px] text-ink-soft">
                {[
                  ['Sıkça Sorulan Sorular', '/sss'],
                  ['İade ve Değişim', '/yasal/iade-ve-degisim'],
                  ['Kargo ve Teslimat', '/yasal/kargo-ve-teslimat'],
                  ['Hakkımızda', '/hakkimizda'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="flex min-h-[44px] items-center rounded-xl px-2">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-line p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              <a href={whatsappLink('Merhaba, bir sorum var.')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full">
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp’tan Yazın
              </a>
              <p className="mt-2 text-center text-[13px] text-ink-muted">{site.contact.whatsappHours}</p>
              {(site.social.instagram || site.social.trendyol) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {site.social.instagram && (
                    <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-[44px] px-3 text-[13.5px]">
                      <InstagramIcon className="h-[18px] w-[18px]" /> Instagram
                    </a>
                  )}
                  {site.social.trendyol && (
                    <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-[44px] px-3 text-[13.5px]">
                      <StoreIcon className="h-[18px] w-[18px]" /> Trendyol
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
