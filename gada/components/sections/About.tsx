import Lines from '@/components/Lines'
import { about } from '@/content/site'

export default function About() {
  return (
    <section id="gada" className="section" aria-labelledby="gada-title">
      <div className="key" data-key="about" />
      <div className="wrap grid layer-front">
        <div className="sheet col col--left">
          <p className="eyebrow" data-reveal>
            {about.eyebrow}
          </p>
          <h2 id="gada-title" className="display" data-reveal>
            <Lines lines={about.title} />
          </h2>
          <p className="lead" data-reveal>
            {about.lead}
          </p>
          {about.body.map((p, i) => (
            <p className="body" data-reveal key={i}>
              {p}
            </p>
          ))}
          <dl className="facts" data-reveal>
            {about.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
