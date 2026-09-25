import type { Metadata } from 'next'

import { ProductExperience } from '@/components/product/ProductExperience'
import { flavors } from '@/lib/flavors'

const flavor = flavors.seftali

export const metadata: Metadata = {
  title: flavor.name,
  description: `${flavor.pack.claimLine} — ${flavor.pack.frontSubtitle.join(' ')}, ${flavor.pack.volume}.`,
  alternates: { canonical: '/icecekler/seftali' },
}

export default function SeftaliPage() {
  return <ProductExperience flavor={flavor} />
}
