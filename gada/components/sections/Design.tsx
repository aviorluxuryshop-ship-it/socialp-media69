import Lines from '@/components/Lines'
import type { Product } from '@/content/site'

type Props = { product: Product; id: string; keyPrefix: string; side: 'left' | 'right' }

export default function Design({ product, id, keyPrefix, side }: Props) {
  const steps = product.design
  return (
    <section
      id={id}
      className={`design design--${side} product--${product.id}`}
      data-steps
      data-active="0"
      style={{ '--steps': steps.length } as React.CSSProperties}
      aria-labelledby={`${id}-title`}
    >
      <div className="design__track" aria-hidden="true">
        {steps.map((_, i) => (
          <div
            key={i}
            className="key key--step"
            data-key={`${keyPrefix}${i + 1}`}
            data-step={i}
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="design__sticky">
        <div className="wrap design__frame layer-front">
          <header className="design__head">
            <p className="eyebrow" data-reveal>
              Tasarım · {product.id === 'seftali' ? 'Şeftali' : 'Limon'}
            </p>
            <h2 id={`${id}-title`} className="display" data-reveal>
              <Lines lines={['Tasarım']} />
            </h2>
          </header>
          <ol className="design__captions">
            {steps.map((s, i) => (
              <li key={s.title} data-i={i}>
                <p className="design__no">
                  {String(i + 1).padStart(2, '0')} <span>/ {String(steps.length).padStart(2, '0')}</span>
                </p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <ul className="palette" aria-label="Ambalajın renkleri">
            {product.palette.map((c) => (
              <li key={c.name}>
                <span className="palette__chip" style={{ background: c.hex }} />
                <span className="palette__name">{c.name}</span>
                <span className="palette__hex">{c.hex}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
