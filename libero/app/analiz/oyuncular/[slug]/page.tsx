import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLAYERS, PLAYER_BY_ID } from '@/data/players';
import { POSITION_BY_ID } from '@/data/positions';
import { TECH_BY_ID } from '@/data';
import { CatGlyph } from '@/components/CatGlyph';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';

export const dynamicParams = false;
export function generateStaticParams() {
  return PLAYERS.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PLAYER_BY_ID[slug];
  return p ? { title: `${p.name} oyun analizi`, description: p.tagline } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLAYER_BY_ID[slug];
  if (!p) notFound();
  const pos = POSITION_BY_ID[p.pos];
  const techs = p.techs.map((id) => TECH_BY_ID[id]).filter(Boolean);
  const idx = PLAYERS.findIndex((x) => x.id === p.id);
  const next = PLAYERS[(idx + 1) % PLAYERS.length];

  return (
    <>
      <PageHead
        crumbs={[{ href: '/analiz/oyuncular/', label: 'Oyuncu analizi' }, { label: p.name }]}
        eyebrow={`${pos.name} · ${p.role}`}
        title={p.name}
        lead={p.tagline}
      />
      <section className="section section--tight">
        <div className="container">
          <div className="note">
            <Icon name="info" />
            <p><strong>Eğitim amaçlı yorum.</strong> Bu sayfa istatistik değil, oyun özelliklerinin antrenman diline çevrilmiş bir yorumudur. Oyuncunun kulüp, sayı ya da başarı bilgisi bilinçli olarak verilmemiştir.</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container tech-layout">
          <aside className="tech-aside">
            <div className="card card--marks card--pad">
              <p className="eyebrow">Özet</p>
              <p style={{ marginTop: 10, color: 'var(--ivory-2)' }}>{p.style}</p>
              <p className="mono muted" style={{ marginTop: 18 }}>Pozisyon</p>
              <Link href={`/pozisyonlar/${pos.id}/`} className="btn btn--ghost btn--sm" style={{ marginTop: 8 }}>{pos.name} <Icon name="arrow" /></Link>
            </div>
            <a className="btn btn--ghost btn--sm" target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(p.q)}`}>
              YouTube’da arama yap <Icon name="external" style={{ width: 14, height: 14 }} />
            </a>
            <p className="field__hint">Arama sonuçları üçüncü kişilere aittir; içerik ve doğruluğundan biz sorumlu değiliz. Doğrulanmış videolar için <Link href="/videolar/" className="btn--quiet" style={{ border: 0 }}>Videolar</Link> bölümüne bakın.</p>
          </aside>
          <div className="tech-main">
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">01</span> Oyunun üç evresinde</h2>
              <div className="grid cols-3" style={{ '--gap': '14px' } as React.CSSProperties}>
                <div className="panel panel--flat"><p className="panel__title">Topla</p><ul className="ticks">{p.onBall.map((s) => <li key={s}>{s}</li>)}</ul></div>
                <div className="panel panel--flat"><p className="panel__title">Topsuz</p><ul className="ticks">{p.offBall.map((s) => <li key={s}>{s}</li>)}</ul></div>
                <div className="panel panel--flat"><p className="panel__title">Savunmada</p><ul className="ticks">{p.defending.map((s) => <li key={s}>{s}</li>)}</ul></div>
              </div>
            </section>
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">02</span> Senin oyununa taşı</h2>
              <ul className="thoughts">
                {p.lessons.map((s, i) => <li key={i}><span className="num">{i + 1}</span>{s}</li>)}
              </ul>
            </section>
            <section className="tsec">
              <h2 className="h3 tsec__h"><span className="tsec__n mono">03</span> İzlerken şuna bak</h2>
              <ul className="ticks">{p.watch.map((s) => <li key={s}>{s}</li>)}</ul>
            </section>
          </div>
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">Kütüphanede çalış</p>
              <h2 className="h2">Bu oyunu <em>çalışacağın teknikler</em></h2>
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
          <div className="levelcard__actions" style={{ marginTop: 40 }}>
            <Link href="/analiz/oyuncular/" className="btn btn--ghost">Tüm oyuncular</Link>
            <Link href={`/analiz/oyuncular/${next.id}/`} className="btn btn--primary">Sıradaki: {next.name} <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
