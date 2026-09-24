import Lines from '@/components/Lines'
import { manufacturer, origin } from '@/content/site'
import { TURKEY } from '@/lib/turkey'

export default function Origin() {
  const { bayburt } = TURKEY
  return (
    <section id="uretim" className="section origin" aria-labelledby="uretim-title">
      <div className="key" data-key="origin" />
      <div className="wrap layer-front">
        <div className="origin__head">
          <p className="eyebrow" data-reveal>
            {origin.eyebrow}
          </p>
          <h2 id="uretim-title" className="display" data-reveal>
            <Lines lines={origin.title} />
          </h2>
        </div>
        <div className="origin__grid">
          <figure className="map" data-reveal>
            <svg
              viewBox={`-24 -40 ${TURKEY.width + 48} ${TURKEY.height + 96}`}
              role="img"
              aria-label="Türkiye haritası üzerinde Bayburt"
            >
              <text className="map__sea" x="452" y="-6" textAnchor="middle">
                {origin.seas.north}
              </text>
              <text className="map__sea" x="300" y={TURKEY.height + 44} textAnchor="middle">
                {origin.seas.south}
              </text>
              <path className="map__land" d={TURKEY.path} pathLength={1} />
              <line className="map__lead" x1={bayburt.x} y1={bayburt.y} x2={bayburt.x} y2={bayburt.y + 96} />
              <circle className="map__ring" cx={bayburt.x} cy={bayburt.y} r="14" />
              <circle className="map__dot" cx={bayburt.x} cy={bayburt.y} r="5" />
              <text className="map__city" x={bayburt.x - 14} y={bayburt.y + 92} textAnchor="end">
                {origin.city.toLocaleUpperCase('tr-TR')}
              </text>
              <text className="map__coords" x={bayburt.x - 14} y={bayburt.y + 116} textAnchor="end">
                {origin.coords}
              </text>
            </svg>
          </figure>
          <div className="origin__text sheet">
            <p className="lead" data-reveal>
              {origin.lead}
            </p>
            <p className="body" data-reveal>
              {origin.body}
            </p>
            <dl className="facts facts--stack" data-reveal>
              <div>
                <dt>Menşei</dt>
                <dd>{manufacturer.origin}</dd>
              </div>
              <div>
                <dt>Üretim adresi</dt>
                <dd>{manufacturer.productionAddress}</dd>
              </div>
              <div>
                <dt>Üretici</dt>
                <dd>{manufacturer.legalName}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
