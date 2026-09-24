import { Reveal } from '@/components/ui/Reveal'
import { GlobeIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/ui/Icons'
import { company } from '@/data/company'

const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Akşar Köyü, Bayburt')}`

export function Contact() {
  return (
    <section id="iletisim" className="relative z-10 bg-paper-deep py-24 lg:py-40">
      <div className="container">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-24">
          <div>
            <Reveal as="p" className="eyebrow text-ink-soft">
              İletişim
            </Reveal>
            <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
              GADA’ya ulaşın.
            </Reveal>
            <Reveal as="p" delay={0.12} className="lede mt-6 max-w-md">
              GADA ile ilgili sorularınız için üretici firma {company.shortName}’a ulaşabilirsiniz.
            </Reveal>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2">
            <Reveal className="bg-paper-deep p-7 lg:p-8">
              <PhoneIcon className="h-6 w-6 text-ink-soft" />
              <p className="eyebrow mt-6 text-ink-faint">Telefon</p>
              <a href={company.phone.href} className="mt-2 block text-xl tabular underline-offset-4 hover:underline">
                {company.phone.display}
              </a>
            </Reveal>
            <Reveal delay={0.05} className="bg-paper-deep p-7 lg:p-8">
              <MailIcon className="h-6 w-6 text-ink-soft" />
              <p className="eyebrow mt-6 text-ink-faint">E-posta</p>
              <a href={company.email.href} className="mt-2 block text-xl underline-offset-4 hover:underline">
                {company.email.display}
              </a>
            </Reveal>
            <Reveal delay={0.1} className="bg-paper-deep p-7 lg:p-8">
              <PinIcon className="h-6 w-6 text-ink-soft" />
              <p className="eyebrow mt-6 text-ink-faint">Merkez · {company.city}</p>
              <address className="mt-2 not-italic leading-relaxed">
                <span className="block font-medium">{company.legalName}</span>
                {company.address.lines.map((line) => (
                  <span key={line} className="block text-ink-soft">
                    {line}
                  </span>
                ))}
              </address>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
                Haritada aç
              </a>
            </Reveal>
            <Reveal delay={0.15} className="bg-paper-deep p-7 lg:p-8">
              <GlobeIcon className="h-6 w-6 text-ink-soft" />
              <p className="eyebrow mt-6 text-ink-faint">Almanya · Köln</p>
              <address className="mt-2 not-italic leading-relaxed">
                <span className="block font-medium">{company.germany.name}</span>
                {company.germany.lines.map((line) => (
                  <span key={line} className="block text-ink-soft">
                    {line}
                  </span>
                ))}
                <a href={company.germany.phone.href} className="mt-2 block tabular underline-offset-4 hover:underline">
                  {company.germany.phone.display}
                </a>
                <a href={company.germany.email.href} className="block underline-offset-4 hover:underline">
                  {company.germany.email.display}
                </a>
              </address>
            </Reveal>
            <Reveal delay={0.2} className="bg-paper-deep p-7 sm:col-span-2 lg:p-8">
              <p className="eyebrow text-ink-faint">Sosyal medya · {company.shortName}</p>
              <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-lg">
                {company.social.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                      {item.label} <span className="text-ink-faint">/{item.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
