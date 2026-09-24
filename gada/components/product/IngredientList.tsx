import type { Product } from '@/data/products'
import { cn } from '@/lib/cn'

/** The ingredient line from the back of the can, one entry per ingredient. */
export function IngredientList({ product, className }: { product: Product; className?: string }) {
  return (
    <ol className={cn('flex flex-wrap gap-2', className)}>
      {product.ingredients.map((ingredient, index) => (
        <li
          key={ingredient.name}
          className={cn(
            'inline-flex items-baseline gap-2 rounded-full border px-3.5 py-1.5 text-[0.95rem]',
            ingredient.distinct ? 'border-transparent' : 'border-ink/12 bg-paper/60',
          )}
          style={ingredient.distinct ? { background: product.colors.tint, color: product.colors.ink } : undefined}
        >
          <span className="tabular text-xs text-ink-faint">{index + 1}</span>
          <span className="font-medium">{ingredient.name}</span>
          {ingredient.role && <span className="text-[0.75rem] text-ink-soft">{ingredient.role}</span>}
        </li>
      ))}
    </ol>
  )
}
