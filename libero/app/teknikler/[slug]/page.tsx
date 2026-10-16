import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CAT_BY_ID } from '@/data/categories';
import { TECHNIQUES, TECH_BY_ID, techsByCat } from '@/data';
import { CatGlyph } from '@/components/CatGlyph';
import { FootMap } from '@/components/FootMap';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { SceneView } from '@/components/pitch/SceneView';
import { StarRating } from '@/components/StarRating';
import { DrillList, TechLevelCard } from '@/components/TechPlan';
import { VideoCard } from '@/components/VideoCard';
import { VIDEOS_BY_TECH } from '@/data/videos';
import { POSITION_NAME } from '@/lib/types';

export const dynamicParams = false;

export function generateStaticParams() {
  return TECHNIQUES.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TECH_BY_ID[slug];
  if (!t) return {};
  return { title: t.name, description: t.summary };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TECH_BY_ID[slug];
  if (!t) notFound();
  const cat = CAT_BY_ID[t.cat];
  const siblings = techsByCat(t.cat);
  const i = siblings.findIndex((x) => x.id === t.id);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const related = t.related.map((id) => TECH_BY_ID[id]).filter(Boolean);
  const videos = VIDEOS_BY_TECH[t.id] ?? [];

  return (
    <>
      <PageHead
        crumbs={[
          { href: '/teknikler/', label: 'Teknikler' },
          { href: `/teknikler/?kategori=${t.cat}`, label: cat.name },
          { label: t.name },
        ]}
        eyebrow={t.sub}
        title={t.name}
        lead={t.summary}
      >
        <div className="tech-meta">
          <span className="tag tag--brass">
            <CatGlyph id={t.cat} size={14} /> {cat.name}
          </span>
          <span className="tag">Temas: {t.contact}</span>
          <span className="tag" title="Tekniğin zorluk derecesi">
            Zorluk <StarRating value={t.lv} readOnly size="sm" showName={false} label="Zorluk" />
          </span>
        </div>
      </PageHead>

      <div className="container tech-layout">
        <aside className="tech-aside">
          <SceneView scene={t.scene} title={`${t.name} saha diyagramı`} />
          <TechLevelCard id={t.id} name={t.name} />
        </aside>

        <div className="tech-main">
          <section className="tsec">
            <h2 className="h3 tsec__h">
              <span className="tsec__n mono">01</span> Oyundaki amacı
            </h2>
            <p className="prose lead" style={{ maxWidth: '60ch' }}>{t.purpose}.</p>
            {t.foot && t.foot.length > 0 && (
              <div className="card surface" style={{ marginTop: 24 }}>
                <FootMap active={t.foot} />
                <div>
                  <p className="mono muted">Temas yüzeyi</p>
                  <p className="surface__t">{t.contact}</p>
                  <ul className="surface__list">
                    {t.foot.includes('ustDis') && (
                      <li>
                        <b>Üst dış (trivela)</b> ile <b>dış kenar</b> aynı şey değildir: üst dış, ayak üstünün dış bölümüdür; dış kenar küçük parmağın yan yüzüdür.
                      </li>
                    )}
                    {t.foot.includes('dis') && !t.foot.includes('ustDis') && (
                      <li>
                        <b>Dış kenar</b>, ayağın küçük parmak tarafındaki yan yüzüdür; ayak üstünün dış bölümü (<b>üst dış / trivela</b>) ayrı bir yüzeydir.
                      </li>
                    )}
                    {t.foot.includes('ic') && <li>İç yüz, ayağın en geniş ve en kontrollü temas yüzeyidir.</li>}
                    {t.foot.includes('ustTam') && <li>Ayak üstü (bağcık bölgesi), güçlü vuruşlar için kullanılır.</li>}
                  </ul>
                </div>
              </div>
            )}
            {t.safety && (
              <div className="note note--warn" style={{ marginTop: 20 }}>
                <Icon name="warn" />
                <p>
                  <strong>Güvenlik: </strong>
                  {t.safety}
                </p>
              </div>
            )}
          </section>

          <section className="tsec">
            <h2 className="h3 tsec__h">
              <span className="tsec__n mono">02</span> Adım adım uygulama
            </h2>
            <ol className="steps">
              {t.steps.map((s, k) => (
                <li key={k}>{s}</li>
              ))}
            </ol>
          </section>

          <section className="tsec">
            <h2 className="h3 tsec__h">
              <span className="tsec__n mono">03</span> Yaygın hatalar
            </h2>
            <ul className="ticks ticks--warn">
              {t.mistakes.map((s, k) => (
                <li key={k}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="tsec">
            <h2 className="h3 tsec__h">
              <span className="tsec__n mono">04</span> Maçta nerede kullanılır?
            </h2>
            <ul className="ticks">
              {t.usage.map((s, k) => (
                <li key={k}>{s}</li>
              ))}
            </ul>
            {t.positions.length > 0 && (
              <p className="field__hint" style={{ marginTop: 14 }}>
                En çok ilgili pozisyonlar:{' '}
                {t.positions.map((p, k) => (
                  <span key={p}>
                    {k > 0 && ', '}
                    <Link href={`/pozisyonlar/${p}/`} className="btn--quiet" style={{ border: 0 }}>
                      {POSITION_NAME[p]}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </section>

          <section className="tsec" id="alistirmalar">
            <h2 className="h3 tsec__h">
              <span className="tsec__n mono">05</span> Alıştırmalar — seviyenize göre
            </h2>
            <DrillList id={t.id} cat={t.cat} drills={t.drills} />
          </section>

          <section className="tsec" id="video">
            <h2 className="h3 tsec__h">
              <span className="tsec__n mono">06</span> Video ve kaynaklar
            </h2>
            {videos.length > 0 ? (
              <>
                <p className="prose muted" style={{ marginBottom: 16 }}>
                  Bu teknikle ilgili, varlığı ve gömülebilirliği doğrulanmış videolar. Karta tıkla; YouTube’un resmî oynatıcısı açılır, Türkçe özet ve kanal sahibi kartta yer alır.
                </p>
                <ul className="vlib__grid vlib__grid--two">
                  {videos.map((v) => <li key={v.id}><VideoCard video={v} compact /></li>)}
                </ul>
              </>
            ) : (
              <p className="prose muted">
                Bu teknik için henüz doğrulanmış bir video eklenmedi; uydurma bağlantı vermiyoruz. Diğer konular için <Link href="/videolar/" className="btn--quiet">Videolar</Link> bölümüne bakabilirsin.
              </p>
            )}
            <p className="field__hint" style={{ marginTop: 16 }}>
              Aşağıdaki bağlantı tekniği YouTube’da <strong>arama</strong> sonuçlarında açar; belirli bir video önermez ve sonuçlar üçüncü kişilere aittir.
            </p>
            <p style={{ marginTop: 10 }}>
              <a className="btn btn--ghost btn--sm" target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t.q)}`}>
                YouTube’da ara <Icon name="external" />
              </a>
            </p>
          </section>

          {related.length > 0 && (
            <section className="tsec">
              <h2 className="h3 tsec__h">
                <span className="tsec__n mono">07</span> İlgili teknikler
              </h2>
              <ul className="rel-list">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/teknikler/${r.id}/`} className="card rel">
                      <span className="rel__glyph"><CatGlyph id={r.cat} size={30} /></span>
                      <span>
                        <span className="rel__name">{r.name}</span>
                        <span className="rel__sub">{r.sub}</span>
                      </span>
                      <Icon name="arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <div className="container">
        <nav className="pager" aria-label="Aynı kategoride önceki ve sonraki">
          {prev ? (
            <Link href={`/teknikler/${prev.id}/`} className="pager__a">
              <span className="mono muted">← Önceki</span>
              <span className="h3">{prev.name}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/teknikler/${next.id}/`} className="pager__a pager__a--next">
              <span className="mono muted">Sonraki →</span>
              <span className="h3">{next.name}</span>
            </Link>
          ) : <span />}
        </nav>
      </div>
    </>
  );
}
