"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import { useRef, useState } from "react";
import logo from "@/assets/logo.webp";
import { business } from "@/data/business";
import { homeLink, nav } from "@/data/navigation";
import { services } from "@/data/services";
import { ServiceIcon } from "./ServiceIcon";

export function Header() {
  const pathname = usePathname();
  // Each open state remembers the path it was opened on, so navigating
  // elsewhere closes it without needing an effect.
  const [mobileOn, setMobileOn] = useState<string | null>(null);
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const mobileOpen = mobileOn === pathname;
  const menuOpen = menuOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const slugOf = (href: string) => services.find((s) => `/services/${s.slug}` === href)?.slug;

  return (
    <header
      className="on-dark sticky top-0 z-50 bg-ink text-white"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        if (menuOpen) {
          setMenuOn(null);
          menuToggleRef.current?.focus();
        } else if (mobileOpen) {
          setMobileOn(null);
          toggleRef.current?.focus();
        }
      }}
    >
      <div aria-hidden className="h-[3px] bg-[linear-gradient(90deg,var(--color-brand)_0_66%,var(--color-signal)_66%_100%)]" />
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 sm:gap-3" aria-label="Peel Auto Glass — home">
          <Image src={logo} alt="" className="h-11 w-auto sm:h-[3rem]" sizes="60px" />
          <span className="whitespace-nowrap font-display text-[0.8rem] font-bold uppercase leading-none tracking-[0.05em] min-[400px]:text-[0.9rem] sm:text-lg sm:tracking-[0.06em]">
            Peel Auto Glass
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center xl:flex">
          {nav.map((item) => {
            const current = isCurrent(item.href);
            const link = `relative px-3.5 py-2 text-[0.95rem] font-medium transition-colors after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand-soft after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100 ${
              current ? "text-white after:scale-x-100" : "text-white/75"
            }`;

            if (!item.children) {
              return (
                <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={link}>
                  {item.label}
                </Link>
              );
            }

            return (
              <div
                key={item.href}
                className="relative flex items-center"
                onMouseEnter={() => setMenuOn(pathname)}
                onMouseLeave={() => setMenuOn(null)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setMenuOn(null);
                }}
              >
                <Link
                  href={item.href}
                  aria-current={current && pathname === item.href ? "page" : undefined}
                  className={`${link} pr-1`}
                >
                  {item.label}
                </Link>
                <button
                  ref={menuToggleRef}
                  type="button"
                  aria-expanded={menuOpen}
                  aria-controls="services-menu"
                  aria-label="Services menu"
                  onClick={() => setMenuOn(menuOpen ? null : pathname)}
                  className="grid size-8 place-items-center rounded text-white/75 hover:text-white"
                >
                  <ChevronDown aria-hidden className={`size-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div id="services-menu" className="absolute -left-3 top-full z-50 w-[40rem] pt-3">
                    <div className="rake rake-sm bg-white p-2 text-ink shadow-[0_24px_60px_-12px_rgb(10_19_38/0.45)]">
                      <ul className="grid grid-cols-2">
                        {item.children.map((child) => {
                          const slug = slugOf(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setMenuOn(null)}
                                className="group flex h-full gap-4 p-4 transition-colors hover:bg-mist"
                              >
                                {slug && <ServiceIcon slug={slug} className="mt-0.5 size-9 shrink-0 text-brand" />}
                                <span>
                                  <span className="block font-display font-bold leading-snug group-hover:text-brand-deep">
                                    {child.label}
                                  </span>
                                  <span className="mt-1 block text-[0.85rem] leading-snug text-muted">
                                    {child.text}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOn(null)}
                        className="link-arrow mt-1 flex items-center justify-between border-t border-line px-4 py-3 text-[0.9rem] font-semibold text-brand-deep hover:bg-mist"
                      >
                        View all services
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
            className="grid size-11 shrink-0 place-items-center rounded-md border border-white/20 transition-colors hover:bg-white/10 xl:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOn(mobileOpen ? null : pathname)}
          >
            {mobileOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-white/10 bg-ink xl:hidden"
        >
          <ul className="mx-auto max-w-6xl px-5 py-2">
            {[{ ...homeLink, children: undefined }, ...nav].map((item) => (
              <li key={item.href} className="border-b border-white/10">
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) && (!item.children || pathname === item.href) ? "page" : undefined}
                  onClick={() => setMobileOn(null)}
                  className={`flex min-h-14 items-center text-lg font-medium ${isCurrent(item.href) ? "text-white" : "text-white/80"}`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mb-3 ml-1 border-l border-white/15">
                    {item.children.map((child) => {
                      const slug = slugOf(child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            aria-current={pathname === child.href ? "page" : undefined}
                            onClick={() => setMobileOn(null)}
                            className={`flex min-h-12 items-center gap-3 pl-4 text-base ${pathname === child.href ? "text-white" : "text-white/70"}`}
                          >
                            {slug && <ServiceIcon slug={slug} className="size-6 shrink-0 text-brand-soft" />}
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pb-6 pt-3 sm:flex-row">
            <a
              href={business.phone.href}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-brand font-semibold"
            >
              <Phone aria-hidden className="size-4" />
              Call {business.phone.short}
            </a>
            <a
              href={business.emailHref}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-white/35 font-semibold"
            >
              <Mail aria-hidden className="size-4" />
              Email Us
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
