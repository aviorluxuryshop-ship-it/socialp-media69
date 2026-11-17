import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '@/components/Common'
import { ContactForm } from '@/components/ContactForm'
import { InstagramIcon, StoreIcon, WhatsAppIcon } from '@/components/BrandIcons'
import { site, whatsappLink } from '@/data/site'

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'PRIME KIDS müşteri hizmetleri: WhatsApp, telefon ve e-posta ile bize ulaşın.',
  alternates: { canonical: '/iletisim' },
}

export default function ContactPage() {
  const cards = [
    { icon: WhatsAppIcon, title: 'WhatsApp', text: 'En hızlı yanıt', value: 'Mesaj gönder', href: whatsappLink('Merhaba, bir sorum var.'), external: true, accent: 'bg-[#e3f5ea] text-[#187a41]' },
    { icon: Phone, title: 'Telefon', text: site.contact.hours, value: site.contact.phoneDisplay, href: `tel:${site.contact.phoneHref}`, accent: 'bg-sky' },
    { icon: Mail, title: 'E-posta', text: '1 iş günü içinde yanıt', value: site.contact.email, href: `mailto:${site.contact.email}`, accent: 'bg-blush' },
    ...(site.social.instagram
      ? [{ icon: InstagramIcon, title: 'Instagram', text: 'Yeni ürünler ve kombinler', value: site.social.instagramHandle || 'Takip et', href: site.social.instagram, external: true, accent: 'bg-butter' }]
      : []),
    ...(site.social.trendyol
      ? [{ icon: StoreIcon, title: 'Trendyol', text: 'Mağazamız ve yorumlar', value: 'Mağazaya git', href: site.social.trendyol, external: true, accent: 'bg-sage' }]
      : []),
  ]
  return (
    <>
      <PageHeader crumbs={[{ label: 'İletişim' }]} eyebrow="İletişim" title="Size nasıl yardımcı olabiliriz?" lead="Beden, sipariş, iade… Ne sorarsanız sorun; ekibimiz memnuniyetle yanıtlar." />
      <div className="container section grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {cards.map(({ icon: Icon, title, text, value, href, external, accent }) => (
              <li key={title}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex h-full items-start gap-4 rounded-3xl bg-white p-5 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accent}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[16px] font-bold">{title}</span>
                    <span className="block text-[13.5px] text-ink-muted">{text}</span>
                    <span className="mt-1 block break-words font-semibold underline underline-offset-4">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-4 rounded-3xl bg-white p-5 ring-1 ring-line">
            <p className="flex items-start gap-3 text-[15px]">
              <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="block">Çalışma saatleri</strong>
                {site.contact.hours}
                <br />
                {site.contact.whatsappHours}
              </span>
            </p>
            <p className="flex items-start gap-3 text-[15px]">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="block">Adres</strong>
                {site.company.address}
              </span>
            </p>
          </div>
          <details className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-line">
            <summary className="cursor-pointer font-display font-semibold">Şirket bilgileri</summary>
            <dl className="mt-3 grid gap-2 text-[14.5px] text-ink-soft">
              <div><dt className="inline font-semibold text-ink">Ünvan: </dt><dd className="inline">{site.company.title}</dd></div>
              <div><dt className="inline font-semibold text-ink">Vergi Dairesi / No: </dt><dd className="inline">{site.company.taxOffice} / {site.company.taxNumber}</dd></div>
              <div><dt className="inline font-semibold text-ink">MERSİS: </dt><dd className="inline">{site.company.mersis}</dd></div>
              <div><dt className="inline font-semibold text-ink">KEP: </dt><dd className="inline">{site.company.kep}</dd></div>
            </dl>
          </details>
        </div>
        <ContactForm />
      </div>
    </>
  )
}
