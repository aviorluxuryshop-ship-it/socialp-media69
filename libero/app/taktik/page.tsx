import type { Metadata } from 'next';
import Link from 'next/link';
import { TACTICS } from '@/data/tactics';
import { QUIZ } from '@/data/quiz';
import { PageHead } from '@/components/PageHead';
import { Icon } from '@/components/Icon';
import { Reveal } from '@/components/Reveal';
import { POSITIONS } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Taktik ve Futbol IQ',
  description: 'Pres, karşı pres, geçişler, savunma yerleşimi ve karar verme. Maç durumlarında kararınızı test edin; doğru kararı saha üzerinde izleyin.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Taktik ve Futbol IQ"
        title={
          <>
            Topu iyi oynamak yetmez; <em>doğru yerde ve doğru anda</em> olmak gerekir.
          </>
        }
        lead="Taktik konularını animasyonlu saha diyagramlarıyla öğrenin. Sonra maç durumlarında kararınızı test edin: her soruda doğru karar saha üzerinde oynatılır ve her seçeneğin neden doğru ya da yanlış olduğu açıklanır."
        wide
      />

      <section className="section section--tight">
        <div className="container">
          <div className="card card--marks card--pad iq-banner">
            <div>
              <p className="eyebrow">Futbol IQ testi</p>
              <h2 className="h2" style={{ marginTop: 12 }}>
                {QUIZ.length} maç durumu, <em>tek soru: ne yapardın?</em>
              </h2>
              <p className="lead" style={{ marginTop: 14 }}>
                Konuya, pozisyona ve soru sayısına göre seç. Sonuçların bu tarayıcıda saklanır; yanlış yaptıklarını sonra tekrar çözebilirsin.
              </p>
              <p style={{ marginTop: 24 }}>
                <Link href="/taktik/test/" className="btn btn--primary">Teste başla <Icon name="arrow" /></Link>
              </p>
            </div>
            <ul className="iq-banner__list">
              {['Karar', 'Pres', 'Geçiş', 'Savunma', 'Topsuz', 'Hücum', 'Duran top', 'Kaleci'].map((t) => (
                <li key={t}>
                  <span>{t}</span>
                  <b className="mono">{QUIZ.filter((q) => q.theme === t).length}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">Taktik konuları</p>
              <h2 className="h2">Oyunun <em>düzenini</em> anlayın</h2>
            </div>
          </div>
          <ul className="tactic-grid">
            {TACTICS.map((t, i) => (
              <li key={t.id}>
                <Reveal delay={(i % 3) * 60}>
                  <Link href={`/taktik/${t.id}/`} className="card tactic-card">
                    <div className="tactic-card__top">
                      <span className="num tactic-card__n">{String(i + 1).padStart(2, '0')}</span>
                      <span className="tag">{t.tag}</span>
                    </div>
                    <h3 className="tactic-card__t">{t.title}</h3>
                    <p className="tactic-card__s">{t.summary}</p>
                    <span className="tactic-card__go mono">Diyagramı izle <Icon name="arrow" /></span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">Pozisyona göre düşünme</p>
              <h2 className="h2">Her pozisyon <em>farklı</em> düşünür</h2>
            </div>
            <Link href="/pozisyonlar/" className="btn btn--ghost btn--sm">Tüm pozisyonlar <Icon name="arrow" /></Link>
          </div>
          <div className="chips">
            {POSITIONS.map((p) => (
              <Link key={p.id} href={`/pozisyonlar/${p.id}/`} className="chip">{p.name}</Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
