"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { site } from "@/data/site";
import { fmt } from "@/data/products";

const nav = [
  { href: "/urunler?kategori=kiz", label: "Kız Çocuk" },
  { href: "/urunler?kategori=erkek", label: "Erkek Çocuk" },
  { href: "/urunler?kategori=mini", label: "Mini" },
  { href: "/urunler", label: "Tüm Ürünler" },
];

export function Wordmark({ white = false, height = 40 }: { white?: boolean; height?: number }) {
  return (
    <Image
      src={white ? "/brand/logo-white.png" : "/brand/logo.png"}
      alt="Prime Kids"
      width={Math.round(height * 2.511)}
      height={height}
      priority
      style={{ height, width: "auto" }}
    />
  );
}

export default function Header() {
  const { count, ready } = useCart();

  return (
    <>
      <div className="bg-ink text-center text-[12.5px] font-medium tracking-wide text-cream">
        <div className="container-x py-2">
          {fmt(site.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsiz
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Prime Kids ana sayfa" className="flex items-center">
            <Wordmark height={38} />
          </Link>

          <nav aria-label="Ana menü" className="hidden items-center gap-8 md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-[14.5px] font-medium text-ink/80 transition hover:text-cobalt"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/sepet"
            className="relative flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold transition hover:border-ink"
            aria-label={`Sepet, ${ready ? count : 0} ürün`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 7h12l-1 13H7L6 7Z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            Sepet
            {ready && count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cobalt px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>

        {/* Mobil menü: kaydırılabilir şerit, JS gerektirmez */}
        <nav aria-label="Mobil menü" className="border-t border-line md:hidden">
          <div className="container-x flex gap-6 overflow-x-auto py-2.5 text-[14px] font-medium [scrollbar-width:none]">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap text-ink/80">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
