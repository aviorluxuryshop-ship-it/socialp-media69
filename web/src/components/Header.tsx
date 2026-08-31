'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Dict } from '@/content/tr';
import type { Locale } from '@/content/site';
import { anchors, homePath } from '@/lib/dict';
import { logoMeta } from './Picture';

type NavItem = { label: string; href: string };

export function Header({ dict, locale }: { dict: Dict; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const home = homePath(locale);
  const items: NavItem[] = [
    { label: dict.nav.services, href: `${home}#${anchors.services}` },
    { label: dict.nav.work, href: `${home}#${anchors.work}` },
    { label: dict.nav.about, href: `${home}#${anchors.about}` },
    { label: dict.nav.contact, href: `${home}#${anchors.contact}` },
  ];

  // The bar gains a backdrop once it is no longer over the hero.
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Menu is a modal surface: lock the page, trap Tab, restore focus on exit.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('lenis-stopped');

    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>('a[href], button');
    focusables?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('lenis-stopped');
    };
  }, [open, close]);

  const other: Locale = locale === 'tr' ? 'en' : 'tr';

  return (
    <>
      <header
        /*
         * `backdrop-filter` establishes a containing block for fixed-position
         * descendants, so the menu panel must NOT live inside this element —
         * its inset-0 would resolve to the header strip, not the viewport.
         * The blur is also dropped while the menu is open.
         */
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          lifted && !open ? 'bg-ink/80 backdrop-blur-md' : ''
        }`}
      >
      <div
        className={`shell relative flex items-center justify-between transition-all duration-500 ${
          lifted ? 'py-3' : 'py-5'
        }`}
      >
        <Link
          href={home}
          onClick={close}
          className="relative z-10 shrink-0"
          aria-label={`Socialp Media — ${dict.nav.home}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marks/socialp.png"
            alt="Socialp Media"
            width={logoMeta.width}
            height={logoMeta.height}
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        {/* Optically centred independently of the logo and action widths. */}
        <nav
          className="pointer-events-none absolute inset-x-0 hidden items-center justify-center gap-9 lg:flex"
          aria-label={dict.nav.menu}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-draw pointer-events-auto text-sm text-mist hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/${other}/`}
            hrefLang={other}
            className="kicker hidden px-2 py-3 text-mist transition-colors hover:text-paper sm:block"
            aria-label={`${dict.langSwitch.label}: ${other === 'tr' ? dict.langSwitch.tr : dict.langSwitch.en}`}
          >
            {other.toUpperCase()}
          </Link>

          <Link href={`${home}#${anchors.contact}`} className="btn btn-ghost hidden lg:inline-flex" data-magnetic>
            {dict.nav.contact}
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            // Solid ground so the icon stays legible over bright hero imagery.
            className="relative z-10 grid h-12 w-12 place-items-center border border-white/15 bg-ink text-paper lg:hidden"
          >
            <span className="relative block h-3 w-6" aria-hidden="true">
              <span
                className={`absolute left-0 block h-px w-full bg-current transition-transform duration-300 ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-full bg-current transition-transform duration-300 ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
        </div>
      </header>

      {/* Mobile menu — sibling of <header>, so it always covers the viewport. */}
      <div
        id="site-menu"
        ref={panelRef}
        hidden={!open}
        // Fully opaque black: the page behind must not read through.
        className="fixed inset-0 z-40 flex flex-col justify-between bg-black px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(2rem,env(safe-area-inset-bottom))] pt-28 lg:hidden"
      >
        <nav className="flex flex-col" aria-label={dict.nav.menu}>
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="display display-md border-b border-white/10 py-5 text-paper"
            >
              {/* Subtle green accent on the index, white on the label itself. */}
              <span className="kicker mr-4 align-middle text-[#3ECF8E]">{`0${i + 1}`}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end pt-8">
          <Link href={`/${other}/`} hrefLang={other} onClick={close} className="kicker px-3 py-3 text-mist">
            {other === 'tr' ? dict.langSwitch.tr : dict.langSwitch.en}
          </Link>
        </div>
      </div>
    </>
  );
}
