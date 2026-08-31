import { Lines } from '../Type';
import { Picture } from '../Picture';
import { site } from '@/content/site';
import type { Dict } from '@/content/tr';
import { anchors } from '@/lib/dict';

/**
 * Closing call to action.
 *
 * The end of a portfolio, so it is the largest type on the page. There is no
 * form: phone, WhatsApp and email are one tap away, which converts better for
 * an agency and keeps the site a pure static export with no backend.
 *
 * Every number and address here is the agency's real published contact detail.
 */
export function Contact({ dict }: { dict: Dict }) {
  const desks = [
    { title: dict.contact.trTitle, ...site.tr },
    { title: dict.contact.intlTitle, ...site.intl },
  ];

  return (
    <section
      id={anchors.contact}
      className="relative isolate overflow-hidden py-sect grain"
      aria-labelledby="contact-title"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div data-parallax="14" className="absolute -inset-y-[10%] inset-x-0">
          <Picture id="showroom-otomotiv" alt="" sizes="100vw" className="cover opacity-20" position="50% 45%" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />
        <div className="glow" />
      </div>

      <div className="shell">
        <p className="kicker mb-10 text-signal-lift">{dict.contact.kicker}</p>

        <Lines id="contact-title" as="h2" lines={[dict.contact.heading]} className="display display-hero max-w-[14ch]" />

        <p data-reveal="up" className="lead mt-10 max-w-xl text-mist">
          {dict.contact.lead}
        </p>

        <div className="mt-20 grid gap-12 sm:grid-cols-2 lg:gap-16" data-stagger>
          {desks.map((desk) => (
            <div key={desk.title} data-stagger-item className="hair border-t pt-8">
              <h3 className="kicker mb-8 text-mist-dim">{desk.title}</h3>
              <ul className="space-y-5">
                <li>
                  <a href={desk.phoneHref} className="display link-draw text-2xl tracking-tight sm:text-3xl">
                    {desk.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${desk.email}`} className="link-draw wrap-anywhere text-mist">
                    {desk.email}
                  </a>
                </li>
                <li>
                  <a
                    href={desk.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-draw inline-flex min-h-11 items-center gap-2 text-sm text-mist"
                  >
                    {dict.contact.whatsappLabel}
                    <ExternalIcon />
                  </a>
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2" data-reveal="up">
          <div className="hair border-t pt-8">
            <h3 className="kicker mb-4 text-mist-dim">{dict.contact.addressLabel}</h3>
            <a
              href={site.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-draw text-mist"
            >
              {site.address.line}
              <br />
              {site.address.district}
            </a>
          </div>
          <div className="hair border-t pt-8">
            <h3 className="kicker mb-4 text-mist-dim">{dict.contact.instagramLabel}</h3>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="display link-draw inline-flex items-center gap-2 text-xl tracking-tight"
            >
              {site.instagram.handle}
              <ExternalIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M8 16 16 8M9 8h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
