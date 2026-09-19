import type { Metadata } from 'next'
import { Instagram, Mail, MapPin, Phone } from 'lucide-react'

import { siteConfig } from '@/data/site'

export const metadata: Metadata = {
  title: 'İletişim',
  description: `${siteConfig.name} ile iletişime geç: telefon, e-posta ve Instagram.`,
  alternates: { canonical: '/iletisim' },
}

const channels = [
  { icon: Phone, label: 'Telefon', value: siteConfig.phone, href: `tel:${siteConfig.phone.replace(/\s/g, '')}` },
  { icon: Mail, label: 'E-posta', value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { icon: Instagram, label: 'Instagram', value: siteConfig.instagram, href: `https://instagram.com/${siteConfig.instagram.replace('@', '')}` },
  { icon: MapPin, label: 'Adres', value: siteConfig.address },
]

export default function ContactPage() {
  return (
    <section className="bg-paper py-20">
      <div className="container-prose">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">İletişim</h1>
        <p className="mt-3 text-ink-mute">Sorun mu var, toplu sipariş mi vereceksin? Aşağıdaki kanallardan bize ulaş.</p>

        <ul className="mt-10 space-y-4">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex items-center gap-4 rounded-card border border-ink/10 bg-paper-raised p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon text-signal">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-ink-mute">{label}</p>
                {href ? (
                  <a href={href} className="text-ink hover:text-signal-dim">
                    {value}
                  </a>
                ) : (
                  <p className="text-ink">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
