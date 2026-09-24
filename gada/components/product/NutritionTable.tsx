import type { Product } from '@/data/products'
import { cn } from '@/lib/cn'

export function NutritionTable({ product, className }: { product: Product; className?: string }) {
  return (
    <table className={cn('w-full text-[0.95rem]', className)}>
      <caption className="eyebrow mb-3 text-left text-ink-faint">Enerji ve besin öğeleri · 100 ml</caption>
      <tbody>
        {product.nutrition.map((row) => (
          <tr key={row.label} className="border-t border-ink/10">
            <th scope="row" className={cn('py-2 text-left font-normal', row.sub && 'pl-4 text-ink-soft')}>
              {row.label}
            </th>
            <td className="py-2 text-right tabular font-medium">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
