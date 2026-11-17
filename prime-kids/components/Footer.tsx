import Link from 'next/link'
import { Lock, Mail, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { InstagramIcon, PaymentBadges, StoreIcon, WhatsAppIcon } from '@/components/BrandIcons'
import { site, whatsappLink } from '@/data/site'
import { legalDocs } from '@/data/legal'

const links = [
  ['Tüm Ürünler', '/urunler'],
  ['Kız Çocuk', '/urunler?kategori=kiz'],
  ['Erkek Çocuk', '/urunler?kategori=erkek'],
  ['Bebek & Mini', '/urunler?kategori=mini'],
  ['Beden Rehberi', '/beden-rehberi'],
  ['Hizmetler', '/hizmetler'],
  ['Sıkça Sorulan Sorular', '/sss'],
  ['Hakkımızda', '/hakkimizda'],
  ['İletişim', '/iletisim'],
]

export function Footer() {
  return (
    <footer className="mt-16 bg-sky text-ink">
      {/* Dalgalı üst kenar */}
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="block h-6 w-full -translate-y-px fill-white md:h-10" aria-hidden="true">
        <path d="M0 0h1440v14c-120 22-240 22-360 0s-240-22-360 0-240 22-360 0-240-22-360 0V0z" />
      </svg>
      <div className="container grid gap-8 pb-8 pt-6 md:grid-cols-[1.1fr_1.6fr_1fr] md:pt-10">
        <div>
          <Logo className="h-10 w-auto text-ink" />
          <p className="mt-3 max-w-xs text-[15.5px] text-ink-soft">1-14 yaş çocuklar için rahat ve renkli takımlar.</p>
          <div className="mt-4 flex gap-2">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#157a3f] shadow-sm hover:scale-105">
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            {site.social.instagram && (
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full bg-white text-pink shadow-sm hover:scale-105">
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {site.social.trendyol && (
              <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" aria-label="Trendyol mağazamız" className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#c2410c] shadow-sm hover:scale-105">
                <StoreIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <nav aria-label="Site bağlantıları">
          <ul className="grid grid-cols-2 gap-x-6 text-[15.5px] font-semibold">
            {links.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-[40px] items-center text-ink-soft hover:text-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 text-[15px]">
          <a href={whatsappLink('Merhaba, bir sorum var.')} target="_blank" rel="noopener noreferrer" className="flex min-h-[36px] items-center gap-2.5 font-semibold hover:text-brand">
            <WhatsAppIcon className="h-[18px] w-[18px] text-[#157a3f]" /> WhatsApp Destek
          </a>
          <a href={`tel:${site.contact.phoneHref}`} className="flex min-h-[36px] items-center gap-2.5 hover:text-brand">
            <Phone className="h-[18px] w-[18px]" aria-hidden="true" /> {site.contact.phoneDisplay}
          </a>
          <a href={`mailto:${site.contact.email}`} className="flex min-h-[36px] items-center gap-2.5 break-all hover:text-brand">
            <Mail className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> {site.contact.email}
          </a>
          <p className="pt-1 text-[13.5px] text-ink-muted">{site.contact.hours}</p>
        </div>
      </div>

      <div className="border-t border-[#cfe0f5]">
        <div className="container flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-ink-soft">
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <Lock className="h-4 w-4" aria-hidden="true" /> Güvenli ödeme
            </span>
            <PaymentBadges />
          </div>
          <nav aria-label="Yasal metinler">
            <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-ink-muted">
              {legalDocs.map((d) => (
                <li key={d.slug}>
                  <Link href={`/yasal/${d.slug}`} className="inline-flex min-h-[32px] items-center hover:text-brand">
                    {d.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="container pb-28 text-[13px] text-ink-muted md:pb-8">
          © {new Date().getFullYear()} {site.name}. Fiyatlara KDV dahildir.
        </p>
      </div>
    </footer>
  )
}
