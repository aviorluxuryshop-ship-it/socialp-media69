"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";
import { categories } from "@/data/products";
import { mainNav, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import { fmt, telLink, waLink } from "@/lib/site-helpers";

const isActive = (path: string, href: string) =>
  href === "/" ? path === "/" : path === href || path.startsWith(href + "/") || (href === "/urunler" && path.startsWith("/urun/"));

export default function Header() {
  const path = usePathname();
  const { totals, ready } = useCart();
  const count = ready ? totals.count : 0;
  const menu = useRef<HTMLDialogElement>(null);
  const [bump, setBump] = useState(false);
  const prev = useRef(count);

  // Sepet sayısı artınca rozet kısa bir an büyür.
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  // Sayfa değişince menü kapanır.
  useEffect(() => menu.current?.close(), [path]);

  const checkout = path === "/odeme" || path.startsWith("/odeme/");

  return (
    <>
      <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-cream">
        İçeriğe geç
      </a>
      {!checkout && (
        <p className="bg-ink px-4 py-2 text-center text-[12.5px] font-medium tracking-wide text-cream">
          {fmt(site.shipping.freeThreshold)} ve üzeri siparişlerde kargo ücretsiz · {site.shipping.returnDays} gün içinde iade
        </p>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-sm">
        <div className="container-x flex h-16 items-center gap-1 lg:h-[72px] lg:gap-6">
          <button
            type="button"
            onClick={() => menu.current?.showModal()}
            className="-ml-2.5 grid h-11 w-11 place-items-center rounded-full lg:hidden"
            aria-label="Menüyü aç"
            aria-haspopup="dialog"
          >
            <Icon name="menu" size={24} />
          </button>

          <Link href="/" aria-label="Prime Kids ana sayfa" className="flex shrink-0 items-center py-2">
            <Logo height={34} priority />
          </Link>

          <nav aria-label="Ana menü" className="ml-auto hidden items-center gap-1 lg:flex">
            {mainNav.map((n) => {
              const on = isActive(path, n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`relative px-3.5 py-3 text-[14.5px] font-medium transition-colors hover:text-ink ${on ? "text-ink" : "text-ink/70"}`}
                >
                  {n.label}
                  <span className={`absolute inset-x-3.5 bottom-1.5 h-px bg-ink transition-opacity ${on ? "opacity-100" : "opacity-0"}`} aria-hidden />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            {/* Mobilde ürünler her zaman tek dokunuş uzaklıkta */}
            {!checkout && (
              <Link href="/urunler" className="inline-flex min-h-[44px] items-center px-3 text-[14.5px] font-semibold underline-offset-4 hover:underline lg:hidden">
                Ürünler
              </Link>
            )}
            <a
              href={site.social.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram: @${site.social.instagram.handle}`}
              className="hidden h-11 w-11 place-items-center rounded-full text-ink/70 transition-colors hover:text-ink lg:grid"
            >
              <Icon name="instagram" />
            </a>
            <Link
              href="/sepet"
              aria-label={count ? `Sepet, ${count} ürün` : "Sepet, boş"}
              className="relative -mr-2 grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sand lg:mr-0 lg:flex lg:w-auto lg:gap-2 lg:border lg:border-ink/20 lg:px-4 lg:text-[14.5px] lg:font-semibold lg:hover:border-ink lg:hover:bg-transparent"
            >
              <Icon name="bag" size={22} />
              <span className="hidden lg:inline">Sepet</span>
              {count > 0 && (
                <span className={`absolute right-0.5 top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-ink px-1 text-[11px] font-bold text-cream lg:static ${bump ? "pop" : ""}`}>
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <dialog
        ref={menu}
        aria-label="Menü"
        onClick={(e) => e.target === e.currentTarget && menu.current?.close()}
        className="sheet-left m-0 h-dvh max-h-none w-[88vw] max-w-[380px] bg-cream p-0"
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
            <Logo height={30} />
            <button type="button" onClick={() => menu.current?.close()} aria-label="Menüyü kapat" className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full">
              <Icon name="close" size={24} />
            </button>
          </div>

          <nav aria-label="Mobil menü" className="px-5 py-4">
            <Link href="/urunler" className="btn-primary w-full justify-between">
              Tüm ürünleri gör <Icon name="arrow" size={18} />
            </Link>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/urunler?kategori=${c.id}`} className="flex min-h-[48px] items-center justify-center rounded-xl border border-line bg-white/70 px-1 text-center text-[13.5px] font-semibold">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-5 divide-y divide-line border-y border-line">
              {mainNav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(path, n.href) ? "page" : undefined}
                    className="flex min-h-[54px] items-center justify-between font-display text-[19px] font-semibold aria-[current=page]:text-pine"
                  >
                    {n.label}
                    <Icon name="chevron-right" size={18} className="text-mute" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/sepet" className="flex min-h-[54px] items-center justify-between font-display text-[19px] font-semibold">
                  Sepetim {count > 0 && <span className="font-sans text-[14px] font-medium text-mute">{count} ürün</span>}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="mt-auto border-t border-line bg-sand/60 px-5 py-5">
            <p className="eyebrow">Yardım mı lazım?</p>
            <ul className="mt-1">
              <li>
                <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2.5 text-[14.5px] font-medium">
                  <Icon name="whatsapp" size={19} /> WhatsApp’tan yazın
                </a>
              </li>
              <li>
                <a href={telLink} className="inline-flex min-h-[44px] items-center gap-2.5 text-[14.5px] font-medium">
                  <Icon name="phone" size={19} /> {site.contact.phoneDisplay}
                </a>
              </li>
            </ul>
            <SocialLinks stacked className="mt-1 border-t border-line pt-1" />
          </div>
        </div>
      </dialog>
    </>
  );
}
