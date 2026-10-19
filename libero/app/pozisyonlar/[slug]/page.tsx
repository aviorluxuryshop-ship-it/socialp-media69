import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSITION_BY_ID, POSITION_PROFILES, QUALITY_NAME, type Quality } from '@/data/positions';
import { TECH_BY_ID } from '@/data';
import { TACTIC_BY_ID } from '@/data/tactics';
import { CatGlyph } from '@/components/CatGlyph';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { SceneView } from '@/components/pitch/SceneView';
import { SetPositionButton } from '@/components/PositionPicker';
import { MUSCLE_NAME } from '@/data/exercises';
import { VideoCard } from '@/components/VideoCard';
import { VIDEOS } from '@/data/videos';

export const dynamicParams = false;
export function generateStaticParams() {
  return POSITION_PROFILES.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = POSITION_BY_ID[slug];
  return p ? { title: p.name, description: p.tagline } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = POSITION_BY_ID[slug];
  if (!p) notFound();
  const techs = p.keyTechs.map((id) => TECH_BY_ID[id]).filter(Boolean);
  const tactics = p.keyTactics.map((id) => TACTIC_BY_ID[id]).filter(Boolean);
  const videos = VIDEOS.filter((v) => v.pos.includes(p.id)).slice(0, 3);
  const quals = (Object.keys(p.qual) as Quality[]).sort((a, b) => p.qual[b] - p.qual[a]);

  return (
    <>
      <PageHead crumbs={[{ href: '/pozisyonlar/', label: 'Pozisyonlar' }, { label: p.name }]} eyebrow="Pozisyon" title={p.name} lead={p.tagline}>
        <p style={{ marginTop: 24 }}>
          <SetPositionButton id={p.id} />
        </p>
      </PageHead>

      <section className="section section--tight">
        <div className="container tech-layout">
          <aside className="tech-aside">
            <SceneView scene={p.scene} title={`${p.name} örnek durum`} />
            <p className="field__hint">{p.sceneNote}</p>
          </aside>
          <div className="tech-main">
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">01</span> Nasıl düşünür?</h2>
              <ul className="thoughts">
                {p.think.map((s, i) => <li key={i}><span className="num">“</span>{s}</li>)}
              </ul>
            </section>
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">02</span> Oyunun üç evresinde</h2>
              <div className="grid cols-3" style={{ '--gap': '14px' } as React.CSSProperties}>
                <div className="panel panel--flat"><p className="panel__title">Topla</p><ul className="ticks">{p.onBall.map((s) => <li key={s}>{s}</li>)}</ul></div>
                <div className="panel panel--flat"><p className="panel__title">Topsuz</p><ul className="ticks">{p.offBall.map((s) => <li key={s}>{s}</li>)}</ul></div>
                <div className="panel panel--flat"><p className="panel__title">Savunmada</p><ul className="ticks">{p.defending.map((s) => <li key={s}>{s}</li>)}</ul></div>
              </div>
            </section>
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">03</span> Fiziksel profil</h2>
              <p className="muted" style={{ marginBottom: 16 }}>Genel eğilimdir; bireysel ihtiyaçlar, yaş ve seviyeyle değişir. Çocuk ve ergenlerde fiziksel çalışma antrenör gözetiminde ve yaşa uygun yapılmalıdır.</p>
              <ul className="qualbars">
                {quals.map((q) => (
                  <li key={q}>
                    <span>{QUALITY_NAME[q]}</span>
                    <span className="qualbars__bar" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((n) => <i key={n} data-on={n <= p.qual[q] || undefined} />)}
                    </span>
                    <b className="mono">{p.qual[q]}/5</b>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 18 }}>
                Öne çıkan kas grupları:{' '}
                {p.muscles.map((m, k) => (
                  <span key={m}>{k > 0 && ', '}<Link href={`/fiziksel/?kas=${m}`} className="btn--quiet" style={{ border: 0 }}>{MUSCLE_NAME[m] ?? m}</Link></span>
                ))}
              </p>
            </section>
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">04</span> Gelişim önerileri</h2>
              <ul className="ticks">{p.tips.map((s) => <li key={s}>{s}</li>)}</ul>
              <h3 className="h3" style={{ margin: '28px 0 12px' }}>Sık yapılan hatalar</h3>
              <ul className="ticks ticks--warn">{p.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
          </div>
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">Öncelikli teknikler</p>
              <h2 className="h2">{p.name} için <em>önce bunlar</em></h2>
            </div>
          </div>
          <ul className="tech-grid">
            {techs.map((t) => (
              <li key={t.id}>
                <Link href={`/teknikler/${t.id}/`} className="card tech-card">
                  <div className="tech-card__top">
                    <span className="tech-card__glyph"><CatGlyph id={t.cat} size={34} /></span>
                    <span className="tag">{'★'.repeat(t.lv)}</span>
                  </div>
                  <h3 className="tech-card__name">{t.name}</h3>
                  <p className="tech-card__sum">{t.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="section-title" style={{ marginTop: 56 }}>
            <div>
              <p className="eyebrow">Taktik</p>
              <h2 className="h2">Bu pozisyonun <em>taktik</em> dünyası</h2>
            </div>
          </div>
          <ul className="rel-list" style={{ maxWidth: 720 }}>
            {tactics.map((t) => (
              <li key={t.id}>
                <Link href={`/taktik/${t.id}/`} className="card rel">
                  <span className="rel__glyph tag">{t.tag}</span>
                  <span className="rel__name">{t.title}</span>
                  <Icon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
          {videos.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 56 }}>
                <div>
                  <p className="eyebrow">Videolar</p>
                  <h2 className="h2">Bu pozisyon için <em>izlenecekler</em></h2>
                </div>
                <Link href={`/videolar/?pozisyon=${p.id}`} className="btn btn--ghost btn--sm">Tümünü gör <Icon name="arrow" /></Link>
              </div>
              <ul className="vlib__grid">
                {videos.map((v) => <li key={v.id}><VideoCard video={v} compact /></li>)}
              </ul>
            </>
          )}
          <p style={{ marginTop: 40 }}>
            <Link href="/program/" className="btn btn--primary">Bu pozisyona göre program oluştur <Icon name="arrow" /></Link>
          </p>
        </div>
      </section>
    </>
  );
}
