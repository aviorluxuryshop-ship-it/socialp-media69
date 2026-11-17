import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/Common'
import { getLegalDoc, legalDocs } from '@/data/legal'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return legalDocs.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getLegalDoc((await params).slug)
  return doc ? { title: doc.title, description: doc.summary, alternates: { canonical: `/yasal/${doc.slug}` } } : {}
}

export default async function LegalPage({ params }: Props) {
  const doc = getLegalDoc((await params).slug)
  if (!doc) notFound()
  return (
    <>
      <PageHeader crumbs={[{ label: 'Yasal', href: '/yasal/mesafeli-satis-sozlesmesi' }, { label: doc.title }]} title={doc.title} lead={doc.summary} />
      <div className="container section grid gap-10 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Yasal metinler" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {legalDocs.map((d) => (
              <li key={d.slug} className="shrink-0">
                <Link href={`/yasal/${d.slug}`} aria-current={d.slug === doc.slug ? 'page' : undefined} className="chip w-full justify-start lg:min-h-[46px] lg:rounded-2xl">
                  {d.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="prose-legal min-w-0 max-w-3xl overflow-x-auto rounded-[28px] bg-white p-5 ring-1 ring-line md:p-10" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </>
  )
}
