import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.webp";
import { business, legalLinks } from "@/data/business";
import { homeLink } from "@/data/navigation";
import { services } from "@/data/services";

const heading = "text-xs font-semibold uppercase tracking-[0.18em] text-white";
const link = "inline-block py-1 text-white/70 transition-colors hover:text-white";

const company = [
  homeLink,
  { href: "/about", label: "About Us" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/auto-glass-guide", label: "Auto Glass Guide" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export function Footer() {
  return (
    <footer className="on-dark bg-ink text-white/70">
      <div aria-hidden className="h-0.5 bg-[linear-gradient(90deg,var(--color-brand)_0_66%,var(--color-signal)_66%_100%)]" />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_0.9fr_1.15fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Image src={logo} alt="Peel Auto Glass logo" className="h-28 w-auto" sizes="110px" />
          <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed">
            Windshield repair and replacement, side window replacement and rear windshield replacement in Mississauga,
            Ontario.
          </p>
        </div>

        <nav aria-label="Footer services">
          <h2 className={heading}>Services</h2>
          <ul className="mt-4 text-[0.95rem]">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className={link}>
                  {s.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className={`${link} font-medium text-white`}>
                All services
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Footer">
          <h2 className={heading}>Company</h2>
          <ul className="mt-4 text-[0.95rem]">
            {company.map((item) => (
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
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-28 pt-6 text-sm text-white/55 md:pb-6 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} Peel Auto Glass. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-block py-1 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/image-credits" className="inline-block py-1 hover:text-white">
                  Image credits
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
