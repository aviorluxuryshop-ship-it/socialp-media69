import type { Metadata } from 'next'
import { OrderComplete } from '@/components/OrderComplete'

export const metadata: Metadata = { title: 'Siparişiniz Alındı', robots: { index: false } }

export default function OrderCompletePage() {
  return <OrderComplete />
}
