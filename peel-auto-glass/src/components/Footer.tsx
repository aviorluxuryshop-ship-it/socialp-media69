import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.webp";
import { business, legalLinks, nav } from "@/data/business";

const heading = "text-xs font-semibold uppercase tracking-[0.18em] text-white";
const link = "inline-block py-1 text-white/70 transition-colors hover:text-white";

export function Footer() {
  return (
    <footer className="on-dark bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_1.2fr_1fr]">
        <div>
          <Image src={logo} alt="Peel Auto Glass logo" className="h-28 w-auto" sizes="110px" />
          <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed">
            Windshield repair and replacement, side window replacement and rear windshield replacement in Mississauga,
            Ontario.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className={heading}>Explore</h2>
          <ul className="mt-4 text-[0.95rem]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={heading}>Contact</h2>
          <ul className="mt-4 space-y-3 text-[0.95rem]">
            <li className="flex gap-3">
              <Phone aria-hidden className="mt-1 size-4 shrink-0 text-brand-soft" />
              <a href={business.phone.href} className="hover:text-white">
                {business.phone.display}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail aria-hidden className="mt-1 size-4 shrink-0 text-brand-soft" />
              <a href={business.emailHref} className="break-all hover:text-white">
                {business.email}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-brand-soft" />
              <address className="not-italic">
                {business.address.street}
                <br />
                {business.address.city}, {business.address.region}
                <br />
                {business.address.country}
              </address>
            </li>
          </ul>
        </div>

        <nav aria-label="Legal">
          <h2 className={heading}>Legal</h2>
          <ul className="mt-4 text-[0.95rem]">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Peel Auto Glass. All rights reserved.</p>
          <Link href="/image-credits" className="hover:text-white">
            Image credits
          </Link>
        </div>
      </div>
    </footer>
  );
}
