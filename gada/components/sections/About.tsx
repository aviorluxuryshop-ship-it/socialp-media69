import { Reveal } from '@/components/ui/Reveal'
import { company } from '@/data/company'

export function About() {
  const facts: [string, string][] = [
    ['Marka', 'GADA'],
    ['Üretici', company.legalName],
    ['Kuruluş', `${company.founded}, ${company.city}`],
    ['Yönetim kurulu başkanı', company.chairman],
    ['Çeşitler', 'Limon · Şeftali'],
    ['Menşei', company.country],
  ]
  return (
    <section id="hakkinda" data-tone="dark" className="relative z-10 overflow-hidden bg-forest py-24 text-cream lg:py-40">
      <div className="container">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <div>
            <Reveal as="p" className="eyebrow text-cream/60">
              GADA hakkında
            </Reveal>
            <Reveal as="h2" delay={0.06} className="display balance mt-6 text-[clamp(2.5rem,1.5rem+4vw,5.5rem)]">
              Köln’de başlayan bir iş, Bayburt’ta bir marka.
            </Reveal>
          </div>
          <div className="space-y-6 text-[1.1rem] leading-relaxed text-cream/80 lg:pt-12">
            <Reveal as="p">
              GADA, {company.legalName}’nin soğuk çay markasıdır. Şirket 2017’de {company.city}’ta kuruldu; yönetim
              kurulu başkanı, Bayburtlu iş insanı {company.chairman}.
            </Reveal>
            <Reveal as="p" delay={0.06}>
              {company.shortName}’un kökleri Köln’e uzanır. Şirketin kendi anlatımına göre iş orada dört içecek
              marketiyle başladı; ilk kendi ürünü, memleketin adını taşıyan Byburt69 enerji içeceği oldu. Karaoğlu,
              üretimin yerel merkezini doğduğu köy Akşar’a kurduklarını anlatıyor.
            </Reveal>
            <Reveal as="p" delay={0.12}>
              GADA’nın iki içeceği aynı temelden gelir ve aynı kutuyu paylaşır; onları ayıran, aroma ve renktir.
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1}>
          <dl className="mt-20 grid gap-px overflow-hidden rounded-2xl bg-forest-line sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([term, value]) => (
              <div key={term} className="bg-forest p-6 lg:p-8">
                <dt className="eyebrow text-cream/50">{term}</dt>
                <dd className="mt-3 text-lg">{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
