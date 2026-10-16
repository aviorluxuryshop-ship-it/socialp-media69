import type { Metadata } from 'next';
import Link from 'next/link';
import { PRINCIPLES, TIMELINE, YOUTH_RULES } from '@/data/nutrition';
import { SOURCES } from '@/data/sources';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { AlternativeFinder, MealFinder } from '@/components/NutritionTools';

export const metadata: Metadata = {
  title: 'Beslenme ve toparlanma',
  description: 'Dengeli beslenme, antrenman öncesi ve sonrası, sıvı tüketimi, pratik öğünler ve yiyecek alternatifleri. Genel bilgi; kişisel diyet planı değildir.',
};

export default function Page() {
  const src = SOURCES.filter((s) => s.topic === 'beslenme');
  return (
    <>
      <PageHead
        eyebrow="Beslenme ve toparlanma"
        title={
          <>
            Performansın yarısı <em>tabakta</em> başlar.
          </>
        }
        lead="Antrenman öncesi ve sonrası ne yenir, ne kadar su içilir, pratik öğünler nelerdir? Sevmediğin ya da ulaşamadığın bir yiyecek için alternatif bul."
        wide
      />

      <section className="section section--tight">
        <div className="container">
          <div className="note note--warn">
            <Icon name="warn" />
            <div>
              <p><strong>Bu sayfa genel bilgi içerir; kişisel diyet programı değildir ve bir diyetisyenle görüşme yerine geçmez.</strong></p>
              <p style={{ marginTop: 6 }}>Platformda diyetisyen hizmeti yoktur. Sağlık sorunu, alerji, kilo ile ilgili kaygı ya da çocuk/ergen sporcu için özel plan gerekiyorsa bir hekim ve diyetisyene danışın.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">01 · Temel ilkeler</p>
              <h2 className="h2">Beş basit <em>ilke</em></h2>
            </div>
          </div>
          <ol className="principles">
            {PRINCIPLES.map((p, i) => (
              <li key={p.t}>
                <span className="num principles__n">{String(i + 1).padStart(2, '0')}</span>
                <div><h3 className="principles__t">{p.t}</h3><p className="muted">{p.d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">02 · Zamanlama</p>
              <h2 className="h2">Antrenmanın <em>öncesi, sırası ve sonrası</em></h2>
            </div>
          </div>
          <div className="grid cols-4" style={{ '--gap': '14px' } as React.CSSProperties}>
            {TIMELINE.map((t) => (
              <div key={t.t} className="card card--pad">
                <h3 className="h3" style={{ marginBottom: 14 }}>{t.t}</h3>
                <ul className="ticks">{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight section--ruled" id="ogunler">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">03 · Pratik öğünler</p>
              <h2 className="h2">Ne yesem? <em>Filtreleyin.</em></h2>
            </div>
          </div>
          <MealFinder />
        </div>
      </section>

      <section className="section section--tight section--ruled" id="alternatif">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">04 · Yiyecek alternatifi</p>
              <h2 className="h2">Sevmiyorum, bulamıyorum, yiyemiyorum — <em>peki ne yerim?</em></h2>
            </div>
          </div>
          <AlternativeFinder />
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container grid cols-2" style={{ '--gap': '28px' } as React.CSSProperties}>
          <div>
            <p className="eyebrow">05 · Çocuk ve ergenler</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Büyüyen sporcu için <em>güvenlik</em></h2>
            <ul className="ticks ticks--warn" style={{ marginTop: 24 }}>
              {YOUTH_RULES.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Kaynaklar</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Dayandığımız <em>kaynaklar</em></h2>
            <ul className="sources" style={{ marginTop: 24 }}>
              {src.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <Icon name="external" style={{ width: 13, height: 13 }} /></a>
                  <span className="muted">{s.org}</span>
                  <span className="muted" style={{ fontSize: '.85rem' }}>{s.note}</span>
                </li>
              ))}
            </ul>
            <p className="field__hint" style={{ marginTop: 14 }}>Daha fazlası: <Link href="/profil/#kaynaklar" className="btn--quiet" style={{ border: 0 }}>tüm kaynaklar</Link>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
