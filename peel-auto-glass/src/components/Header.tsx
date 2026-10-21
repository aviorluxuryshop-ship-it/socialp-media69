"use client";

import Image from "next/image";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { nav, site } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a href="#top" className="flex items-center gap-3" aria-label={`${site.name} — home`}>
          <Image src="/logo.webp" alt="" width={44} height={48} className="h-11 w-auto" priority />
          <span className="text-sm font-extrabold uppercase italic tracking-wide text-white sm:text-base">
            Peel <span className="text-brand-cyan">Auto</span> <span className="text-brand-red">Glass</span>
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-white/75 transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${site.phone.tel}`}
            className="hidden items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition hover:brightness-110 sm:inline-flex"
          >
            <Phone className="size-4" aria-hidden /> {site.phone.display}
          </a>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg text-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 bg-navy-950 md:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base font-medium text-white/85"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pb-3 pt-1">
              <a
                href="#quote"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-brand-blue py-3 text-center font-bold text-white"
              >
                Get a free quote
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
