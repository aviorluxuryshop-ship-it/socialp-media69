import Lines from '@/components/Lines'
import { label, type Product } from '@/content/site'

type Props = { product: Product; id: string; keyName: string; side: 'left' | 'right'; no: string }

export default function Ingredients({ product, id, keyName, side, no }: Props) {
  return (
    <section id={id} className={`section ingredients product--${product.id}`} aria-labelledby={`${id}-title`}>
      <div className="key" data-key={keyName} />
      <div className="wrap grid layer-front">
        <div className={`sheet col col--${side} col--wide`}>
          <p className="eyebrow" data-reveal>
            {no} — İçerik · {product.id === 'seftali' ? 'Şeftali' : 'Limon'}
          </p>
          <h2 id={`${id}-title`} className="display" data-reveal>
            <Lines lines={['İçerik']} />
          </h2>
          <p className="lead lead--s" data-reveal>
            Kutunun arka yüzünde yazanlar, olduğu gibi.
          </p>
          <ol className="ing" data-reveal>
            {product.ingredients.map((ing, i) => (
              <li key={ing.name}>
                <span className="ing__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="ing__name">{ing.name}</span>
                {ing.detail && <span className="ing__detail">{ing.detail}</span>}
              </li>
            ))}
          </ol>
          <div className="nutri" data-reveal>
            <p className="nutri__title">
              {label.nutritionTitle} <span>{label.nutritionUnit}</span>
            </p>
            <table>
              <caption className="sr-only">
                {product.name}, {label.nutritionUnit} {label.nutritionTitle.toLowerCase()}
              </caption>
              <tbody>
                {label.nutrition.map((n) => (
                  <tr key={n.label}>
                    <th scope="row">{n.label}</th>
                    <td>{n.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="notes" data-reveal>
            <li>{label.allergen}</li>
            {label.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="fine" data-reveal>
            {label.source}
          </p>
        </div>
      </div>
    </section>
  )
}
