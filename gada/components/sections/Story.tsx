import Lines from '@/components/Lines'
import type { Product } from '@/content/site'

type Props = { product: Product; id: string; keyName: string; side: 'left' | 'right'; no: string }

export default function Story({ product, id, keyName, side, no }: Props) {
  const { story } = product
  return (
    <section id={id} className={`section story product--${product.id}`} aria-labelledby={`${id}-title`}>
      <div className="key" data-key={keyName} />
      <div className="wrap grid layer-front">
        <div className={`sheet col col--${side}`}>
          <p className="eyebrow" data-reveal>
            {no} — {story.eyebrow}
          </p>
          <h2 id={`${id}-title`} className="display display--m" data-reveal>
            <Lines lines={['Ürünün', 'hikâyesi']} />
          </h2>
          <p className="lead" data-reveal>
            {story.lead}
          </p>
          {story.body.map((p, i) => (
            <p className="body" data-reveal key={i}>
              {p}
            </p>
          ))}
          {story.quote && (
            <figure className="quote" data-reveal>
              <blockquote>“{story.quote.text}”</blockquote>
              <figcaption>{story.quote.source}</figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
