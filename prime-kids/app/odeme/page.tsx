import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/CheckoutForm'

export const metadata: Metadata = { title: 'Güvenli Ödeme', robots: { index: false } }

export default function CheckoutPage() {
  return <CheckoutForm />
}
