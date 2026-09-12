import { getProductBySlug, type Product, type ProductSlug, type SizeOption } from '@/data/products'

/**
 * What the cart actually stores: which shirt, which size, how many. Never a
 * price — a price kept in the browser is a price a visitor can edit, so every
 * figure on every screen is recomputed from the catalogue on read.
 */
export interface CartLine {
  slug: ProductSlug
  size: SizeOption
  quantity: number
}

/** A line resolved against the catalogue, ready to be shown. */
export interface ResolvedLine extends CartLine {
  product: Product
  unitPrice: number
  lineTotal: number
}

export const MAX_PER_LINE = 9

/** Same shirt, same size is the same line. */
export const lineKey = (slug: string, size: string) => `${slug}::${size}`

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = getProductBySlug(line.slug)
    // A shirt that has left the catalogue simply drops out rather than
    // showing as a blank row with a price of nothing.
    if (!product) return []
    const quantity = Math.min(Math.max(Math.trunc(line.quantity), 1), MAX_PER_LINE)
    return [{ ...line, quantity, product, unitPrice: product.price, lineTotal: product.price * quantity }]
  })
}

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((total, line) => total + Math.max(Math.trunc(line.quantity), 0), 0)

export const cartTotal = (lines: ResolvedLine[]) =>
  lines.reduce((total, line) => total + line.lineTotal, 0)
