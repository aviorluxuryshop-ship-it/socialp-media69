import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDocs, legalNotice } from "@/content/legal";
import { legalCompany } from "@/lib/site-helpers";

type Params = Promise<{ slug: string }>;

const docs = getLegalDocs(legalCompany);
const anchor = (i: number) => `bolum-${i + 1}`;

export const dynamicParams = false;

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const d = docs.find((x) => x.slug === slug);
  if (!d) return {};
  return { title: d.title, description: d.summary, alternates: { canonical: `/yasal/${d.slug}` } };
}

export default async function LegalDocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = docs.find((x) => x.slug === slug);
  if (!doc) notFound();

  const sections = doc.sections.map((s, i) => ({ ...s, id: anchor(i) }));
  const toc = sections.filter((s) => s.heading);

  return (
    <div className="container-x pt-6 sm:pt-10">
      <nav aria-label="Sayfa konumu" className="text-[13px] text-mute">
        <Link href="/yasal" className="inline-flex min-h-[40px] items-center hover:text-ink">← Tüm yasal metinler</Link>
      </nav>

      <div className="mt-2 grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:order-1">
          <div className="lg:sticky lg:top-28">
            {toc.length > 2 && (
              <details className="card group lg:hidden">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-5 text-[14.5px] font-semibold [&::-webkit-details-marker]:hidden">
                  İçindekiler <span className="text-mute transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <Toc items={toc} className="border-t border-line px-5 py-3" />
              </details>
            )}
            {toc.length > 2 && (
              <nav aria-label="İçindekiler" className="hidden lg:block">
                <p className="eyebrow">İçindekiler</p>
                <Toc items={toc} className="mt-3" />
              </nav>
            )}
            <nav aria-label="Diğer yasal metinler" className="mt-8 hidden border-t border-line pt-6 lg:block">
              <p className="eyebrow">Diğer metinler</p>
              <ul className="mt-3 space-y-1 text-[14px]">
                {docs.filter((d) => d.slug !== doc.slug).map((d) => (
                  <li key={d.slug}><Link href={`/yasal/${d.slug}`} className="inline-block py-1 text-mute underline-offset-4 hover:text-ink hover:underline">{d.title}</Link></li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <article className="max-w-[68ch] lg:order-2">
          <h1 className="h-display text-[30px] sm:text-[42px]">{doc.title}</h1>
          <p className="mt-3 text-[13.5px] text-mute">Son güncelleme: {doc.updated}</p>
          <p className="mt-5 rounded-xl border border-line bg-sand/60 px-4 py-3.5 text-[14px] leading-relaxed" role="note">
            <strong className="font-semibold">Not:</strong> {legalNotice}
          </p>

          <div className="mt-8 space-y-8 text-[16px] leading-[1.75] text-ink/85">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28" aria-labelledby={s.heading ? `${s.id}-baslik` : undefined}>
                {s.heading && <h2 id={`${s.id}-baslik`} className="font-display text-[20px] font-bold leading-snug text-ink sm:text-[22px]">{s.heading}</h2>}
                {s.paragraphs?.map((p, i) => <p key={i} className="mt-3 break-words">{p}</p>)}
                {s.list && (
                  <ul className={`mt-3 space-y-2 ${/^\d+\./.test(s.list[0]) ? "list-none" : "list-disc pl-5 marker:text-mute"}`}>
                    {s.list.map((li, i) => <li key={i} className="break-words">{li}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row">
            <Link href="/iletisim" className="btn-outline">Sorunuz mu var? Bize yazın</Link>
            <Link href="/urunler" className="btn-primary">Ürünlere Git</Link>
          </div>
        </article>
      </div>
    </div>
  );
}

function Toc({ items, className }: { items: { id: string; heading?: string }[]; className?: string }) {
  return (
    <ol className={`space-y-0.5 text-[14px] ${className ?? ""}`}>
      {items.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="inline-flex min-h-[44px] items-center text-mute underline-offset-4 hover:text-ink hover:underline lg:min-h-0 lg:py-1">{s.heading}</a>
        </li>
      ))}
    </ol>
  );
}
