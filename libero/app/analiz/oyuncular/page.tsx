import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import '@/data/player-guard';
import { PLAYERS } from '@/data/players';
import { PLAYER_SECTIONS } from '@/data/player-types';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { PlayerIndex } from '@/components/PlayerIndex';
import type { PlayerLite } from '@/lib/player-filter';

export const metadata: Metadata = {
  title: 'Oyuncu analizi',
  description: 'Profesyonel oyuncuların oyun tarzı, pozisyon alma, topsuz hareket, pas tercihleri ve senin oyununa taşıyabileceğin dersler. Kaynaklı, eğitim amaçlı yorum; istatistik içermez.',
};

const GUIDE = [
  { t: 'Topu değil oyuncuyu izle', d: 'Videoyu bir kez izle; ikinci kez yalnızca seçtiğin oyuncuya odaklan. Top ondan uzaktayken ne yaptığına bak.' },
  { t: 'Topu almadan önce ne yapıyor?', d: 'Başını kaç kez çeviriyor? Vücudu hangi yöne dönük? Bunları sayarak izle.' },
  { t: 'İlk dokunuşu nereye?', d: 'Topu durdurmak mı, yönlendirmek mi? Hangi ayak, hangi yüzey, hangi yön?' },
  { t: 'Verdikten sonra ne yapıyor?', d: 'Pas verdikten sonraki iki saniyeyi izle: duruyor mu, yeni bir açı mı yaratıyor?' },
  { t: 'Kendi oyununa çevir', d: 'Bir şey seç ve bir hafta boyunca antrenmanda dene. Ardından kendi maç videonda aynı soruları sor.' },
];

export default function Page() {
  const lite: PlayerLite[] = PLAYERS.map((p) => ({
    id: p.id,
    name: p.name,
    pos: p.pos,
    role: p.role,
    tagline: p.tagline,
    kind: p.kind,
    deep: !!p.deep,
    sources: p.sources.length,
    videos: p.videos.length,
    sections: PLAYER_SECTIONS.length,
  }));
  const sources = PLAYERS.reduce((a, p) => a + p.sources.length, 0);
  const stats: [string, string][] = [
    [String(PLAYERS.length), 'oyuncu analizi'],
    [String(PLAYER_SECTIONS.length), 'bölüm, her oyuncuda'],
    [String(sources), 'okunmuş kaynak'],
    [String(new Set(PLAYERS.flatMap((p) => p.videos)).size), 'doğrulanmış video'],
  ];
  return (
    <>
      <PageHead
        eyebrow="Oyuncu analizi"
        title={
          <>
            Ustalardan <em>öğrenmenin</em> yolu: doğru izlemek.
          </>
        }
        lead="Profesyonel oyuncuların oyun tarzını bölüm bölüm ayrıştırıyoruz: pozisyon alma, topsuz hareket, pas tercihleri, ilk dokunuş, karar verme, güçlü yanlar ve sınırlılıklar. Her analizde okunmuş kaynaklar, ilgili videolar ve kendi oyununa taşıyacağın dersler yer alır."
        wide
      >
        <dl className="vstats enter" style={{ '--e': 3 } as CSSProperties}>
          {stats.map(([n, label]) => (
            <div key={label} className="vstats__i">
              <dt className="vstats__n">{n}</dt>
              <dd className="vstats__l mono">{label}</dd>
            </div>
          ))}
        </dl>
      </PageHead>
      <section className="section section--tight">
        <div className="container">
          <div className="note note--warn">
            <Icon name="warn" />
            <div>
              <p><strong>Bu analizler eğitim amaçlı yorumdur.</strong> İstatistik, ödül, transfer ya da kulüp bilgisi içermez; okunmuş kaynaklardaki oyun özelliklerini kendi cümlelerimizle antrenman diline çevirir. Her sayfanın sonunda hangi kaynakların okunduğu yazar; bir şey için kaynak bulamadıysak onu yazmak yerine daha azını söyleriz. Fotoğraf kullanmıyoruz.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <PlayerIndex players={lite} />
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">Kendin analiz et</p>
              <h2 className="h2">Bir oyuncuyu <em>nasıl izlersin?</em></h2>
            </div>
            <p className="muted" style={{ maxWidth: 440 }}>Ücretsiz, araç gerektirmeyen yöntem: bir maç görüntüsü, bir kâğıt ve beş soru.</p>
          </div>
          <ol className="principles">
            {GUIDE.map((g, i) => (
              <li key={g.t}>
                <span className="num principles__n">{String(i + 1).padStart(2, '0')}</span>
                <div><h3 className="principles__t">{g.t}</h3><p className="muted">{g.d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
