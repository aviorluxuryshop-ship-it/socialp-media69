'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV_GROUPS, TOP_LINKS } from '@/lib/nav';
import { Icon } from './Icon';
import { Wordmark } from './Logo';
import { SearchPalette } from './SearchPalette';
import { useStore } from '@/lib/store';

const selLevel = (s: { profile: { level: number } }) => s.profile.level;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const level = useStore(selLevel);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };

  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  // Kaydırınca gölge/zemin: React durumu değil, doğrudan öznitelik (pasif dinleyici + rAF)
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    let raf = 0;
    let on = false;
    const apply = () => {
      raf = 0;
      const next = window.scrollY > 8;
      if (next !== on) {
        on = next;
        el.dataset.scrolled = String(next);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = mobile || search ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [mobile, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearch(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearch(true);
      } else if (e.key === 'Escape') {
        setOpen(null);
        setMobile(false);
      }
    };
    window.addEventListener('keydown', onKey);
    const onOpen = () => setSearch(true);
    window.addEventListener('libero:search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('libero:search', onOpen);
    };
  }, []);

  const closeSearch = useCallback(() => setSearch(false), []);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  return (
    <>
      <a className="skip-link" href="#icerik">
        İçeriğe geç
      </a>
      <header ref={headerRef} className="site-header" data-scrolled="false" onMouseLeave={scheduleClose} onMouseEnter={cancelClose}>
        <div className="container site-header__bar">
          <Link href="/" className="site-header__logo" aria-label="Libero Futbol Akademisi — ana sayfa">
            <Wordmark />
          </Link>

          <nav className="site-nav" aria-label="Ana menü">
            {NAV_GROUPS.map((g) => {
              const active = g.items.some((i) => isActive(i.href));
              return (
                <div key={g.label} className="site-nav__group">
                  <button
                    type="button"
                    className="site-nav__btn"
                    data-active={active || undefined}
                    aria-expanded={open === g.label}
                    aria-haspopup="true"
                    onMouseEnter={() => {
                      cancelClose();
                      setOpen(g.label);
                    }}
                    onClick={() => setOpen(open === g.label ? null : g.label)}
                  >
                    {g.label}
                    <Icon name="chevron" />
                  </button>
                </div>
              );
            })}
            {TOP_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="site-nav__btn"
                data-active={isActive(l.href) || undefined}
                onMouseEnter={() => setOpen(null)}
              >
                {l.title}
              </Link>
            ))}
          </nav>

          <div className="site-header__actions">
            <button type="button" className="search-trigger" onClick={() => setSearch(true)} aria-label="Ara (Ctrl K)">
              <Icon name="search" />
              <span className="search-trigger__label">Ara</span>
              <kbd>Ctrl K</kbd>
            </button>
            <Link href="/profil/" className="btn btn-panel btn--ghost btn--sm" aria-label="Panelim">
              <Icon name="user" />
              <span className="btn-panel__text">Panelim</span>
              <span className="btn-panel__lvl" title="Genel seviyeniz">
                {'★'.repeat(level)}
              </span>
            </Link>
            <button
              type="button"
              className="icon-btn site-header__burger"
              aria-label={mobile ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={mobile}
              onClick={() => setMobile((v) => !v)}
            >
              <Icon name={mobile ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {/* Mega panel (masaüstü) */}
        {NAV_GROUPS.map((g) => (
          <div
            key={g.label}
            className="mega"
            data-open={open === g.label}
            onMouseEnter={cancelClose}
            aria-hidden={open !== g.label}
          >
            <div className="container mega__inner">
              <p className="mega__label">{g.label}</p>
              <ul className="mega__list">
                {g.items.map((i, n) => (
                  <li key={i.href} style={{ '--n': n } as React.CSSProperties}>
                    <Link href={i.href} tabIndex={open === g.label ? 0 : -1} data-active={isActive(i.href) || undefined}>
                      <span className="mega__icon">
                        <Icon name={i.icon} />
                      </span>
                      <span>
                        <span className="mega__title">{i.title}</span>
                        <span className="mega__desc">{i.desc}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </header>

      {/* Mobil menü */}
      <div className="mobile-menu" data-open={mobile} aria-hidden={!mobile}>
        <div className="container mobile-menu__inner">
          {NAV_GROUPS.map((g, gi) => (
            <section key={g.label} style={{ '--n': gi } as React.CSSProperties}>
              <p className="eyebrow">{g.label}</p>
              <ul>
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} tabIndex={mobile ? 0 : -1}>
                      {i.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section style={{ '--n': NAV_GROUPS.length } as React.CSSProperties}>
            <p className="eyebrow">Kütüphane</p>
            <ul>
              <li>
                <Link href="/videolar/" tabIndex={mobile ? 0 : -1}>
                  Videolar
                </Link>
              </li>
              <li>
                <Link href="/profil/" tabIndex={mobile ? 0 : -1}>
                  Panelim ve profil
                </Link>
              </li>
            </ul>
          </section>
          <button
            type="button"
            className="btn btn--ghost"
            tabIndex={mobile ? 0 : -1}
            onClick={() => {
              setMobile(false);
              setSearch(true);
            }}
          >
            <Icon name="search" /> Ara
          </button>
        </div>
      </div>

      <SearchPalette open={search} onClose={closeSearch} />
    </>
  );
}
