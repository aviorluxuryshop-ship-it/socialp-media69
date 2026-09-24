import Lines from '@/components/Lines'
import { contact, manufacturer, site } from '@/content/site'

export default function Contact() {
  const rows = [
    { label: 'Instagram', value: site.instagram.handle, href: site.instagram.url, external: true },
    { label: 'Telefon', value: manufacturer.phone.label, href: manufacturer.phone.href },
    { label: 'Üretici', value: manufacturer.legalName },
    { label: 'Adres', value: manufacturer.officeAddress },
    { label: 'Üretim yeri', value: manufacturer.productionAddress },
    { label: 'Facebook', value: site.facebook.label, href: site.facebook.url, external: true },
  ]
  return (
    <section id="iletisim" className="section contact" aria-labelledby="iletisim-title">
      <div className="key" data-key="contact" />
      <div className="wrap layer-front">
        <p className="eyebrow" data-reveal>
          {contact.eyebrow}
        </p>
        <h2 id="iletisim-title" className="display display--xl" data-reveal>
          <Lines lines={[contact.title]} />
        </h2>
        <p className="lead contact__lead" data-reveal>
          {contact.lead}
        </p>
        <dl className="contact__list">
          {rows.map((r, i) => (
            <div key={r.label} data-reveal style={{ '--d': `${i * 0.06}s` } as React.CSSProperties}>
              <dt>{r.label}</dt>
              <dd>
                {r.href ? (
                  <a href={r.href} {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {r.value}
                    {r.external && (
                      <span className="arrow" aria-hidden="true">
                        ↗
                      </span>
                    )}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
