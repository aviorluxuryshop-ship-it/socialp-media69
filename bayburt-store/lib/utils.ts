import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic Turkish Lira formatter.
 *
 * Implemented without `Intl` on purpose: the same string is produced on the
 * server and in the browser regardless of the ICU data shipped with the
 * runtime, which keeps React hydration free of text mismatches.
 */
export function formatPrice(value: number, symbol = '₺'): string {
  const negative = value < 0
  const [integer = '0', fraction = '00'] = Math.abs(value).toFixed(2).split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  // Whole lira are written whole. ₺2.450,00 reads like a bank statement.
  const kurus = fraction === '00' ? '' : `,${fraction}`
  return `${negative ? '-' : ''}${symbol}${grouped}${kurus}`
}

/**
 * Build an absolute URL from a site-relative path.
 */
export function absoluteUrl(path: string, base: string): string {
  const normalisedBase = base.replace(/\/+$/, '')
  const normalisedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalisedBase}${normalisedPath}`
}

/**
 * Clamp a number between a lower and upper bound.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Map a value from one numeric range onto another.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax - inMin === 0) return outMin
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin)
}
