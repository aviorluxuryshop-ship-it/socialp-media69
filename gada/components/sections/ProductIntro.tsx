import type { Product } from '@/content/site'

type Props = { product: Product; id: string; keyName: string; side: 'left' | 'right'; eyebrow: string }

export default function ProductIntro({ product, id, keyName, side, eyebrow }: Props) {
  return (
    <section id={id} className={`section product product--${product.id}`} aria-labelledby={`${id}-title`}>
      <div className="key" data-key={keyName} />
      <div className="wrap grid layer-front">
        <div className={`sheet col col--${side}`}>
          <p className="eyebrow" data-reveal>
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="display display--product" data-reveal aria-label={product.name}>
            {product.nameLines.map((line, i) => (
              <span className="line" key={i} aria-hidden="true">
                <span style={{ '--i': i } as React.CSSProperties}>{line}</span>
              </span>
            ))}
          </h2>
          <div className="product__row" data-reveal>
            <p className="product__volume">330 ml</p>
            <p className="product__short">{product.short}</p>
          </div>
          <ul className="tags" data-reveal aria-label="Öne çıkanlar">
            {product.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
