'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { manufacturer, nav, site } from '@/content/site'

export default function Header() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) toggleRef.current?.focus()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('menu-open', open)
    if (!open) return
    firstLinkRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key !== 'Tab' || !menuRef.current) return
      // odak menü ve kapat düğmesi içinde kalsın
      const items = [toggleRef.current, ...menuRef.current.querySelectorAll<HTMLElement>('a')].filter(Boolean) as HTMLElement[]
      const i = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault()
        items[0].focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <header className="header">
        <a className="header__brand" href="#ana-sayfa" aria-label="GADA — ana sayfa" onClick={() => close(false)}>
          GADA
        </a>
        <button
          ref={toggleRef}
          type="button"
          className="header__toggle"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="header__bars" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </header>

      <div id="menu" ref={menuRef} className="menu" data-open={open} aria-hidden={!open} inert={!open}>
        <nav className="menu__nav" aria-label="Ana menü">
          <ol>
            {nav.map((item, i) => (
              <li key={item.href} style={{ '--i': i } as React.CSSProperties}>
                <a ref={i === 0 ? firstLinkRef : undefined} href={item.href} onClick={() => close(false)}>
                  <span className="menu__no">{item.no}</span>
                  <span className="menu__dash" aria-hidden="true">
                    —
                  </span>
                  <span className="menu__label">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu__foot">
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer">
            Instagram · {site.instagram.handle}
          </a>
          <span>Bayburt / {manufacturer.origin}</span>
        </div>
      </div>
    </>
  )
}
