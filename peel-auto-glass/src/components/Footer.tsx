import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { nav, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-[#040813] pb-28 pt-14 text-white/70 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Image src="/logo.webp" alt={`${site.name} logo`} width={110} height={120} className="h-28 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{site.tagline} across {site.region}.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#quote" className="hover:text-white">
                Free quote
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-brand-red" aria-hidden />
              <a href={`tel:${site.phone.tel}`} className="hover:text-white">
                {site.phone.display}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-brand-red" aria-hidden />
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-red" aria-hidden /> {site.region}
            </li>
            <li className="text-white/50">{site.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 px-4 pt-6 text-xs text-white/40">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </p>
    </footer>
  );
}
