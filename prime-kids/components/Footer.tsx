import Link from 'next/link'
import { Lock, Mail, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { InstagramIcon, PaymentBadges, StoreIcon, WhatsAppIcon } from '@/components/BrandIcons'
import { site, whatsappLink } from '@/data/site'
import { legalDocs } from '@/data/legal'

const shop = [
  ['Tüm Ürünler', '/urunler'],
  ['Kız Çocuk', '/urunler?kategori=kiz'],
  ['Erkek Çocuk', '/urunler?kategori=erkek'],
  ['Mini 1-5 Yaş', '/urunler?kategori=mini'],
  ['Galeri', '/galeri'],
]
const help = [
  ['Beden Rehberi', '/beden-rehberi'],
  ['Hizmetlerimiz', '/hizmetler'],
  ['Sıkça Sorulan Sorular', '/sss'],
  ['Hakkımızda', '/hakkimizda'],
  ['İletişim', '/iletisim'],
]

export function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
        <div>
          <Logo className="h-11 w-auto text-white" />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
            1-14 yaş çocuklar için rahat ve havalı takımlar. Anne-babaların içi rahat, çocukların keyfi yerinde.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            {site.social.instagram && (
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {site.social.trendyol && (
              <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" aria-label="Trendyol mağazamız" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <StoreIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <FooterList title="Alışveriş" items={shop} />
        <FooterList title="Yardım" items={help} />

        <div>
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-white">Bize Ulaşın</h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li>
              <a href={whatsappLink('Merhaba, bir sorum var.')} target="_blank" rel="noopener noreferrer" className="flex min-h-[32px] items-center gap-2.5 hover:text-white">
                <WhatsAppIcon className="h-[18px] w-[18px]" /> WhatsApp Destek
              </a>
            </li>
            <li>
              <a href={`tel:${site.contact.phoneHref}`} className="flex min-h-[32px] items-center gap-2.5 hover:text-white">
                <Phone className="h-[18px] w-[18px]" aria-hidden="true" /> {site.contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="flex min-h-[32px] items-center gap-2.5 break-all hover:text-white">
                <Mail className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> {site.contact.email}
              </a>
            </li>
          </ul>
          <p className="mt-3 text-[13.5px] text-white/60">{site.contact.hours}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-white/70">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              <Lock className="h-4 w-4" aria-hidden="true" /> 256-bit SSL · 3D Secure
            </span>
            <PaymentBadges />
          </div>
          <nav aria-label="Yasal metinler">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/65">
              {legalDocs.map((d) => (
                <li key={d.slug}>
                  <Link href={`/yasal/${d.slug}`} className="inline-flex min-h-[32px] items-center hover:text-white">
                    {d.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="container pb-28 text-[12.5px] text-white/50 md:pb-8">
          © {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır. Fiyatlara KDV dahildir.
        </p>
      </div>
    </footer>
  )
}

function FooterList({ title, items }: { title: string; items: string[][] }) {
  return (
    <div>
      <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-white">{title}</h2>
      <ul className="mt-4 space-y-1 text-[15px]">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="inline-flex min-h-[36px] items-center hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
