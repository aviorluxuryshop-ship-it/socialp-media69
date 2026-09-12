import type { ResolvedLine } from '@/lib/cart'

/**
 * The delivery details an order is placed with. No postal code: the address
 * and the district carry it in Turkey, and a field nobody fills is a field
 * that only costs the buyer a step.
 */
export interface OrderDetails {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  city: string
  district: string
}

export interface DraftOrder {
  details: OrderDetails
  lines: ResolvedLine[]
  total: number
  currency: 'TRY'
}

export type PaymentHandoff =
  | { status: 'redirect'; url: string }
  | { status: 'unavailable'; reason: string }

/**
 * The single seam a payment provider is attached at.
 *
 * It is deliberately empty. No card number, expiry or CVV is asked for
 * anywhere in this codebase, and none ever should be: card details belong on
 * the provider's own hosted page or inside their iframe, where they never
 * touch our JavaScript, our storage or our server, and where being out of
 * scope for them is what keeps the rest of this application out of scope too.
 *
 * To attach one, send `order` to a server route that creates the payment on
 * the provider's side and hand back the URL they return:
 *
 *     return { status: 'redirect', url: session.url }
 *
 * The buyer comes back to /siparis/alindi. Until then this reports honestly
 * that there is nowhere to send them — which is the whole point of it being a
 * seam rather than a form that looks like one.
 */
export async function startPayment(order: DraftOrder): Promise<PaymentHandoff> {
  void order
  return {
    status: 'unavailable',
    reason: 'Ödeme sağlayıcısı henüz bağlı değil.',
  }
}
