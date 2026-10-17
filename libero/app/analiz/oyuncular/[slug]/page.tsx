import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import '@/data/player-guard';
import { PLAYERS, PLAYER_BY_ID } from '@/data/players';
import { PLAYER_KIND_NAME, PLAYER_SECTIONS } from '@/data/player-types';
import { POSITION_BY_ID } from '@/data/positions';
import { TECH_BY_ID } from '@/data';
import { VIDEO_BY_ID } from '@/data/videos';
import { CatGlyph } from '@/components/CatGlyph';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { PlayerVideoRail } from '@/components/PlayerVideoRail';
import { Reveal } from '@/components/Reveal';
import { initialsOf } from '@/lib/player-filter';
import { trDate } from '@/lib/video-honesty';

export const dynamicParams = false;
export function generateStaticParams() {
  return PLAYERS.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PLAYER_BY_ID[slug];
  return p ? { title: `${p.name} oyun analizi`, description: `${p.tagline} Pozisyon alma, topsuz hareket, pas tercihleri, ilk dokunuş ve karar verme; kaynaklı, eğitim amaçlı yorum.` } : {};
}

const Ticks = ({ items, warn }: { items: string[]; warn?: boolean }) => (
  <ul className={`ticks ${warn ? 'ticks--warn' : ''}`}>{items.map((s) => <li key={s}>{s}</li>)}</ul>
);

function Sec({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <Reveal as="section" className="tsec psec">
      <h2 className="h3 tsec__h" id={id}>
        <span className="tsec__n mono">{String(n).padStart(2, '0')}</span> {title}
      </h2>
      {children}
    </Reveal>
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PLAYER_BY_ID[slug];
  if (!p) notFound();
  const pos = POSITION_BY_ID[p.pos];
  const techs = p.techs.map((id) => TECH_BY_ID[id]).filter(Boolean);
  const videos = p.videos.map((id) => VIDEO_BY_ID[id]).filter(Boolean);
  const similar = p.similar.map((id) => PLAYER_BY_ID[id]).filter(Boolean);
  const idx = PLAYERS.findIndex((x) => x.id === p.id);
  const next = PLAYERS[(idx + 1) % PLAYERS.length];
  const title = (id: string) => PLAYER_SECTIONS.find((s) => s.id === id)?.title ?? id;
  const extras = p.extra ?? [];

  // içindekiler ve numaralar aynı diziden gelir
  const toc: { id: string; title: string }[] = [
    { id: 'ozet', title: title('ozet') },
    { id: 'pozisyon', title: title('pozisyon') },
    { id: 'topsuz', title: title('topsuz') },
    { id: 'pas', title: title('pas') },
    { id: 'kontrol', title: title('kontrol') },
    { id: 'hucum', title: title('hucum') },
    { id: 'savunma', title: title('savunma') },
    { id: 'karar', title: title('karar') },
    { id: 'guclu', title: title('guclu') },
    ...extras.map((e, i) => ({ id: `ek-${i + 1}`, title: e.title })),
    { id: 'tasi', title: title('tasi') },
    { id: 'izle', title: title('izle') },
    { id: 'videolar', title: title('videolar') },
    { id: 'benzer', title: title('benzer') },
    { id: 'kaynaklar', title: title('kaynaklar') },
  ];
  const num = (id: string) => toc.findIndex((t) => t.id === id) + 1;

  return (
    <>
      <PageHead
        crumbs={[{ href: '/analiz/oyuncular/', label: 'Oyuncu analizi' }, { label: p.name }]}
        eyebrow={`${pos.name} · ${p.role}`}
        title={p.name}
        lead={p.tagline}
      >
        <ul className="pfacts enter" style={{ '--e': 3 } as CSSProperties}>
          <li><span className="mono">Rol</span><strong>{PLAYER_KIND_NAME[p.kind]}</strong></li>
          <li><span className="mono">Bölüm</span><strong>{toc.length}</strong></li>
          <li><span className="mono">Kaynak</span><strong>{p.sources.length}</strong></li>
          <li><span className="mono">Video</span><strong>{videos.length}</strong></li>
          {p.deep && <li className="pfacts__feat"><span className="tag tag--accent">En kapsamlı analiz</span></li>}
        </ul>
      </PageHead>
      <section className="section section--tight">
        <div className="container">
          <div className="note">
            <Icon name="info" />
            <p><strong>Eğitim amaçlı yorum.</strong> Bu sayfa istatistik değil, kaynaklarda okunan genel oyun özelliklerinin antrenman diline çevrilmiş bir yorumudur; birebir alıntı değildir. Sayı, ödül, kulüp ya da transfer bilgisi bilinçli olarak verilmemiştir. Kaynaklar sayfanın sonundadır.</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container pa">
          <aside className="pa__aside">
            <div className="card card--marks card--pad pa__id">
              <span className="pa__mono" aria-hidden="true">{initialsOf(p.name)}</span>
              <p className="mono muted">Pozisyon</p>
              <Link href={`/pozisyonlar/${pos.id}/`} className="btn btn--ghost btn--sm">{pos.name} <Icon name="arrow" /></Link>
            </div>
            <nav className="pa__toc" aria-label="Bu sayfada">
              <p className="eyebrow">Bu sayfada</p>
              <ol>
                {toc.map((t, i) => (
                  <li key={t.id}><a href={`#${t.id}`}><span className="mono">{String(i + 1).padStart(2, '0')}</span> {t.title}</a></li>
                ))}
              </ol>
            </nav>
            <a className="btn btn--ghost btn--sm" target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(p.q)}`}>
              YouTube’da arama yap <Icon name="external" style={{ width: 14, height: 14 }} />
            </a>
            <p className="field__hint">Arama sonuçları üçüncü kişilere aittir. Doğrulanmış videolar için aşağıdaki <a href="#videolar" className="btn--quiet" style={{ border: 0 }}>Videolar</a> bölümüne ya da <Link href="/videolar/" className="btn--quiet" style={{ border: 0 }}>Video kütüphanesine</Link> bak.</p>
          </aside>

          <div className="pa__main">
            <Sec id="ozet" n={num('ozet')} title={title('ozet')}>
              <p className="pa__lead">{p.style}</p>
            </Sec>
            <Sec id="pozisyon" n={num('pozisyon')} title={title('pozisyon')}><Ticks items={p.positioning} /></Sec>
            <Sec id="topsuz" n={num('topsuz')} title={title('topsuz')}><Ticks items={p.offBall} /></Sec>
            <Sec id="pas" n={num('pas')} title={title('pas')}><Ticks items={p.passing} /></Sec>
            <Sec id="kontrol" n={num('kontrol')} title={title('kontrol')}><Ticks items={p.control} /></Sec>
            <Sec id="hucum" n={num('hucum')} title={title('hucum')}><Ticks items={p.onBall} /></Sec>
            <Sec id="savunma" n={num('savunma')} title={title('savunma')}><Ticks items={p.defending} /></Sec>
            <Sec id="karar" n={num('karar')} title={title('karar')}><Ticks items={p.decisions} /></Sec>
            <Sec id="guclu" n={num('guclu')} title={title('guclu')}>
              <div className="pcols">
                <div className="panel panel--flat"><p className="panel__title">Güçlü yanlar</p><Ticks items={p.strengths} /></div>
                <div className="panel panel--flat pcols__warn"><p className="panel__title">Sınırlılıklar ve taklit ederken dikkat</p><Ticks items={p.limits} warn /></div>
              </div>
            </Sec>
            {extras.map((e, i) => (
              <Sec key={e.title} id={`ek-${i + 1}`} n={num(`ek-${i + 1}`)} title={e.title}>
                <Ticks items={e.items} />
                {p.deep && i === extras.length - 1 && (
                  <p style={{ marginTop: 16 }}><Link href="/analiz/video/" className="btn btn--ghost btn--sm">Video analizi aracını aç <Icon name="arrow" /></Link></p>
                )}
              </Sec>
            ))}
            <Sec id="tasi" n={num('tasi')} title={title('tasi')}>
              <ul className="thoughts">
                {p.lessons.map((s, i) => <li key={i}><span className="num">{i + 1}</span>{s}</li>)}
              </ul>
              <ul className="tech-grid ptechs">
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
            </Sec>
            <Sec id="izle" n={num('izle')} title={title('izle')}><Ticks items={p.watch} /></Sec>
            <Sec id="videolar" n={num('videolar')} title={title('videolar')}>
              <p className="prose muted" style={{ marginBottom: 16 }}>
                Kütüphanedeki doğrulanmış, gömülebilir videolardan bu oyuncunun oyununu çalışmana yardım edecek olanlar. Bunlar çoğunlukla oyuncunun kendisi değil, ilgili beceriyi anlatan eğitim videolarıdır. Karta tıkla: video açılır, yan panelde bu videoda oyuncuda nelere bakacağın yazar. Zaman damgası eklemek için pencerenin “Kişisel notların” bölümünü kullan.
              </p>
              <PlayerVideoRail player={{ id: p.id, name: p.name, watch: p.watch, videoLooks: p.videoLooks, techs: p.techs }} videos={videos} />
            </Sec>
            <Sec id="benzer" n={num('benzer')} title={title('benzer')}>
              <p className="prose muted" style={{ marginBottom: 14 }}>Oyun anlayışı ya da rolü bu oyuncuya benzeyen, kaynaklarda benzer özelliklerle anılan oyuncular.</p>
              <ul className="psim">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link href={`/analiz/oyuncular/${s.id}/`} className="card psim__card">
                      <span className="psim__mono mono" aria-hidden="true">{initialsOf(s.name)}</span>
                      <span><strong>{s.name}</strong><span className="muted psim__role">{s.role}</span></span>
                      <Icon name="arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Sec>
            <Sec id="kaynaklar" n={num('kaynaklar')} title={title('kaynaklar')}>
              <ul className="psrc">
                {p.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="psrc__t">{s.title} <Icon name="external" style={{ width: 13, height: 13 }} /></a>
                    <p className="psrc__n">{s.note}</p>
                    <p className="mono psrc__d">Okundu: {trDate(s.accessed)}</p>
                  </li>
                ))}
              </ul>
              <p className="field__hint" style={{ marginTop: 14 }}>
                Yukarıdaki sayfalar yazım sırasında açılıp okunmuştur. Bu sayfadaki cümleler kaynaklardaki genel oyun özelliklerinin yeniden anlatımıdır; birebir alıntı değildir. Dış sitelerin içeriği ve sonraki değişiklikleri onlara aittir. Bir konuda kaynak bulamadıysak daha az şey yazdık.
              </p>
            </Sec>

            <div className="levelcard__actions" style={{ marginTop: 8 }}>
              <Link href="/analiz/oyuncular/" className="btn btn--ghost">Tüm oyuncular</Link>
              <Link href={`/analiz/oyuncular/${next.id}/`} className="btn btn--primary">Sıradaki: {next.name} <Icon name="arrow" /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
