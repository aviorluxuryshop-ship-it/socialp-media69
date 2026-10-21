"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { useRef, useState } from "react";
import logo from "@/assets/logo.webp";
import { business, nav } from "@/data/business";

export function Header() {
  const pathname = usePathname();
  // Remember which path the menu was opened on: navigating elsewhere closes it
  // without needing an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className="on-dark sticky top-0 z-50 border-b border-white/10 bg-ink text-white"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpenOn(null);
          toggleRef.current?.focus();
        }
      }}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 sm:gap-3" aria-label="Peel Auto Glass — home">
          <Image src={logo} alt="" className="h-12 w-auto sm:h-[3.25rem]" sizes="60px" />
          <span className="whitespace-nowrap font-display text-[0.8rem] font-bold uppercase leading-none tracking-[0.05em] min-[400px]:text-[0.9rem] sm:text-lg sm:tracking-[0.06em]">
            Peel Auto Glass
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`relative px-4 py-2 text-[0.95rem] font-medium transition-colors after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-soft after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 ${
                isCurrent(item.href) ? "text-white after:scale-x-100" : "text-white/75"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={business.phone.href}
            className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md bg-brand px-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-brand-deep sm:px-4"
          >
            <Phone aria-hidden className="size-4" />
            <span className="hidden sm:inline">{business.phone.short}</span>
            <span className="sr-only min-[360px]:not-sr-only sm:hidden">Call Us</span>
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-md border border-white/20 transition-colors hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 bg-ink lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {nav.map((item) => (
              <li key={item.href} className="border-b border-white/10 last:border-0">
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  onClick={() => setOpenOn(null)}
                  className={`flex min-h-14 items-center text-lg font-medium ${isCurrent(item.href) ? "text-white" : "text-white/80"}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
