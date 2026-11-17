import type { Metadata } from 'next'
import { Accordion, PageHeader } from '@/components/Common'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { faqGroups } from '@/data/faq'
import { whatsappLink } from '@/data/site'

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'Beden, sipariş, ödeme, kargo, iade ve değişim hakkında merak ettikleriniz.',
  alternates: { canonical: '/sss' },
}

export default function FaqPage() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqGroups.flatMap((g) => g.items).map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHeader crumbs={[{ label: 'Sıkça Sorulan Sorular' }]} eyebrow="Yardım" title="Sıkça Sorulan Sorular" lead="Aradığınızı bulamazsanız WhatsApp’tan yazın, hemen yanıtlayalım." />
      <div className="container section max-w-3xl space-y-10">
        {faqGroups.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`}>
            <h2 id={`faq-${g.title}`} className="mb-4 text-[22px]">{g.title}</h2>
            <Accordion items={g.items} />
          </section>
        ))}
        <a href={whatsappLink('Merhaba, bir sorum var.')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full">
          <WhatsAppIcon className="h-5 w-5" /> Sorum burada yok — WhatsApp’tan sor
        </a>
      </div>
    </>
  )
}
