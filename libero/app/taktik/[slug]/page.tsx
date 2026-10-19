import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TACTICS, TACTIC_BY_ID } from '@/data/tactics';
import { TECH_BY_ID } from '@/data';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { SceneView } from '@/components/pitch/SceneView';
import { POSITION_NAME } from '@/lib/types';

export const dynamicParams = false;
export function generateStaticParams() {
  return TACTICS.map((t) => ({ slug: t.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TACTIC_BY_ID[slug];
  return t ? { title: t.title, description: t.summary } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TACTIC_BY_ID[slug];
  if (!t) notFound();
  const idx = TACTICS.findIndex((x) => x.id === t.id);
  const prev = TACTICS[idx - 1];
  const next = TACTICS[idx + 1];
  const related = t.related.map((id) => ({ id, tech: TECH_BY_ID[id], tac: TACTIC_BY_ID[id] })).filter((r) => r.tech || r.tac);
  return (
    <>
      <PageHead
        crumbs={[{ href: '/taktik/', label: 'Taktik' }, { label: t.title }]}
        eyebrow={t.tag}
        title={t.title}
        lead={t.summary}
      />
      <div className="container tech-layout">
        <aside className="tech-aside">
          <SceneView scene={t.scene} title={`${t.title} saha diyagramı`} />
          <div className="note">
            <Icon name="info" />
            <p>Altın oyuncular sizin takımınız, kırmızılar rakip. Kesikli oklar topsuz koşu, düz oklar pas, dalgalı oklar top sürmedir.</p>
          </div>
        </aside>
        <div className="tech-main">
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">01</span> İlkeler</h2>
            <ol className="steps">
              {t.principles.map((s, k) => <li key={k}>{s}</li>)}
            </ol>
          </section>
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">02</span> Pozisyona göre rolünüz</h2>
            <dl className="roles">
              {t.roles.map((r) => (
                <div key={r.pos} className="roles__row">
                  <dt><Link href={`/pozisyonlar/${r.pos}/`}>{POSITION_NAME[r.pos]}</Link></dt>
                  <dd>{r.text}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">03</span> Sık yapılan hatalar</h2>
            <ul className="ticks ticks--warn">{t.mistakes.map((s, k) => <li key={k}>{s}</li>)}</ul>
          </section>
          <section className="tsec">
            <h2 className="h3 tsec__h"><span className="tsec__n mono">04</span> Antrenmanda dene</h2>
            <ul className="ticks">{t.tryIt.map((s, k) => <li key={k}>{s}</li>)}</ul>
          </section>
          {related.length > 0 && (
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">05</span> İlgili içerik</h2>
              <ul className="rel-list">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={r.tech ? `/teknikler/${r.id}/` : `/taktik/${r.id}/`} className="card rel">
                      <span className="rel__glyph tag">{r.tech ? 'Teknik' : 'Taktik'}</span>
                      <span><span className="rel__name">{r.tech?.name ?? r.tac?.title}</span></span>
                      <Icon name="arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p>
            <Link href="/taktik/test/" className="btn btn--primary">Futbol IQ testini çöz <Icon name="arrow" /></Link>
          </p>
        </div>
      </div>
      <div className="container">
        <nav className="pager" aria-label="Önceki ve sonraki taktik konusu">
          {prev ? (
            <Link href={`/taktik/${prev.id}/`} className="pager__a"><span className="mono muted">← Önceki</span><span className="h3">{prev.title}</span></Link>
          ) : <span />}
          {next ? (
            <Link href={`/taktik/${next.id}/`} className="pager__a pager__a--next"><span className="mono muted">Sonraki →</span><span className="h3">{next.title}</span></Link>
          ) : <span />}
        </nav>
      </div>
    </>
  );
}
