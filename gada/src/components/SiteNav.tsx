import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { COMMON } from '@/content/products'

const LINKS = [
  { href: '#urun', label: 'Ürün' },
  { href: '#hikaye', label: '360°' },
  { href: '#icerik', label: 'İçindekiler' },
  { href: '#aromalar', label: 'Aromalar' },
  { href: '#marka', label: 'Marka' },
]

/**
 * The fixed header (wordmark + hamburger) and the full-screen menu it opens.
 * One component because the trigger and the overlay share open state and
 * nothing else needs it — a context would be pure overhead for two nodes.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        <nav className="container flex items-center justify-between py-5 sm:py-6" aria-label="Ana menü">
          <a href="#top" className="font-display text-base font-extrabold tracking-wide3 text-cream sm:text-lg" onClick={close}>
            {COMMON.brand}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            className="group relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
          >
            <span
              className={clsx(
                'h-px w-6 bg-cream transition-transform duration-300 ease-luxe',
                open ? 'translate-y-[3px] rotate-45' : 'group-hover:bg-accent-300',
              )}
            />
            <span
              className={clsx(
                'h-px w-6 bg-cream transition-transform duration-300 ease-luxe',
                open ? '-translate-y-[3px] -rotate-45' : 'group-hover:bg-accent-300',
              )}
            />
          </button>
        </nav>
      </header>

      <div
        id="site-menu"
        className={clsx(
          'fixed inset-0 z-30 bg-void transition-opacity duration-500 ease-luxe',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
      >
        <div className="container flex h-full flex-col justify-center">
          <ul className="flex flex-col gap-3 sm:gap-4">
            {LINKS.map((link, i) => (
              <li
                key={link.href}
                className={clsx('overflow-hidden transition-all duration-500 ease-luxe', open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0')}
                style={{ transitionDelay: open ? `${120 + i * 60}ms` : '0ms' }}
              >
                <a
                  href={link.href}
                  onClick={close}
                  className="font-display text-4xl font-bold text-cream/90 transition-colors duration-300 hover:text-accent-300 sm:text-6xl"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <p
            className={clsx('mt-12 max-w-xs text-xs text-cream/40 transition-all duration-500 ease-luxe', open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')}
            style={{ transitionDelay: open ? `${120 + LINKS.length * 60 + 80}ms` : '0ms' }}
          >
            {COMMON.producer}
            <br />
            {COMMON.address}
          </p>
        </div>
      </div>
    </>
  )
}
