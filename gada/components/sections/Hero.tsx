import { hero } from '@/content/site'

export default function Hero() {
  return (
    <section id="ana-sayfa" className="hero" aria-labelledby="hero-title">
      <div className="key key--fill" data-key="hero" />
      <p className="hero__word" aria-hidden="true">
        GADA
      </p>
      <h1 id="hero-title" className="sr-only">
        GADA — şeftali ve çay aromalı içecek, limon aromalı soğuk çay
      </h1>
      <div className="hero__meta wrap layer-front">
        <p className="hero__product intro">
          <span className="hero__index">01 / 02</span>
          <span className="hero__name">{hero.product}</span>
          <span className="hero__volume">{hero.volume}</span>
        </p>
        <a className="hero__cue intro" href="#gada" style={{ '--d': '.75s' } as React.CSSProperties}>
          <span>{hero.cue}</span>
          <span className="hero__cue-line" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
