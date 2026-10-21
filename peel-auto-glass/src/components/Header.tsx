"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.webp";
import { business } from "@/data/business";
import { homeLink, nav } from "@/data/navigation";
import { services } from "@/data/services";
import { ServiceIcon } from "./ServiceIcon";

const items = [{ ...homeLink, children: undefined }, ...nav];

export function Header() {
  const pathname = usePathname();
  // The menu remembers the path it was opened on, so navigating elsewhere
  // closes it without needing an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);

  // While the menu covers the page, keep the page behind it still and out of the tab order.
  useEffect(() => {
    if (!open) return;
    const behind = [document.getElementById("main"), document.querySelector("footer"), document.getElementById("call-bar")];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      behind.forEach((el) => el?.removeAttribute("inert"));
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const slugOf = (href: string) => services.find((s) => `/services/${s.slug}` === href)?.slug;

  return (
    <header
      className="on-dark sticky top-0 z-50 bg-ink text-white"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpenOn(null);
          toggleRef.current?.focus();
        }
      }}
    >
      <div aria-hidden className="h-[3px] bg-[linear-gradient(90deg,var(--color-brand)_0_66%,var(--color-signal)_66%_100%)]" />
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-5">
        {/* On the homepage this scrolls back to the top; from any other page it opens the homepage. */}
        <Link
          href="/"
          aria-label="Peel Auto Glass — back to top"
          className="flex shrink-0 items-center gap-2.5 sm:gap-3"
          onClick={(e) => {
            setOpenOn(null);
            if (pathname === "/") {
              e.preventDefault();
              const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
            }
          }}
        >
          <Image src={logo} alt="" className="h-11 w-auto sm:h-[3rem]" sizes="60px" />
          <span className="whitespace-nowrap font-display text-[0.8rem] font-bold uppercase leading-none tracking-[0.05em] min-[400px]:text-[0.9rem] sm:text-lg sm:tracking-[0.06em]">
            Peel Auto Glass
          </span>
        </Link>

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
            className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-md border border-white/25 text-[0.95rem] font-semibold transition-colors hover:bg-white/10 sm:w-auto sm:px-4"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            <span aria-hidden className="hidden sm:inline">
              {open ? "Close" : "Menu"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="site-menu"
          className="fixed inset-x-0 bottom-0 top-[calc(4.25rem+3px)] overflow-y-auto overscroll-contain border-t border-white/10 bg-ink"
        >
          <div aria-hidden className="cols" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-6 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20 lg:pt-12">
            <nav aria-label="Main">
              <ol className="divide-y divide-white/10 border-y border-white/10">
                {items.map((item, i) => {
                  const current = isCurrent(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={current && (!item.children || pathname === item.href) ? "page" : undefined}
                        onClick={() => setOpenOn(null)}
                        className={`group flex min-h-16 items-center gap-5 py-3 font-display text-[1.65rem] font-bold leading-tight transition-colors sm:text-3xl lg:text-4xl ${
                          current ? "text-white" : "text-white/75 hover:text-white"
                        }`}
                      >
                        <span aria-hidden className="w-7 font-sans text-xs font-semibold tabular-nums tracking-[0.16em] text-brand-soft">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="transition-transform duration-300 group-hover:translate-x-1.5">{item.label}</span>
                      </Link>
                      {item.children && (
                        <ul className="mb-4 ml-12 grid gap-x-8 sm:grid-cols-2">
                          {item.children.map((child) => {
                            const slug = slugOf(child.href);
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  aria-current={pathname === child.href ? "page" : undefined}
                                  onClick={() => setOpenOn(null)}
                                  className={`flex min-h-12 items-center gap-3 text-base font-medium transition-colors hover:text-white ${
                                    pathname === child.href ? "text-white" : "text-white/65"
                                  }`}
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
                  );
                })}
              </ol>
            </nav>

            <div className="lg:pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">Peel Auto Glass</p>
              <div className="mt-5 flex flex-col gap-3">
                <a
                  href={business.phone.href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand font-semibold hover:bg-brand-deep"
                >
                  <Phone aria-hidden className="size-4" />
                  Call {business.phone.display}
                </a>
                <a
                  href={business.emailHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/35 px-4 font-semibold hover:bg-white/10"
                >
                  <Mail aria-hidden className="size-4 shrink-0" />
                  <span className="break-all">{business.email}</span>
                </a>
              </div>
              <address className="mt-8 flex gap-3 text-white/75 not-italic">
                <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-brand-soft" />
                <span>
                  {business.address.street}
                  <br />
                  {business.address.city}, {business.address.region}, {business.address.country}
                </span>
              </address>
              <a
                href={business.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-soft underline-offset-4 hover:underline"
              >
                Get directions
                <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
