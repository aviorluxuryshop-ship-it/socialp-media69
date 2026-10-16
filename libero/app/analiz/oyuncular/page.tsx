import type { Metadata } from 'next';
import { PLAYERS } from '@/data/players';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { PlayerGrid } from '@/components/PlayerGrid';

export const metadata: Metadata = {
  title: 'Oyuncu analizi',
  description: 'Profesyonel oyuncuların oyun tarzı, topsuz hareketleri ve senin oyununa taşıyabileceğin dersler. Eğitim amaçlı yorumdur; istatistik içermez.',
};

const GUIDE = [
  { t: 'Topu değil oyuncuyu izle', d: 'Videoyu bir kez izle; ikinci kez yalnızca seçtiğin oyuncuya odaklan. Top ondan uzaktayken ne yaptığına bak.' },
  { t: 'Topu almadan önce ne yapıyor?', d: 'Başını kaç kez çeviriyor? Vücudu hangi yöne dönük? Bunları sayarak izle.' },
  { t: 'İlk dokunuşu nereye?', d: 'Topu durdurmak mı, yönlendirmek mi? Hangi ayak, hangi yüzey, hangi yön?' },
  { t: 'Verdikten sonra ne yapıyor?', d: 'Pas verdikten sonraki iki saniyeyi izle: duruyor mu, yeni bir açı mı yaratıyor?' },
  { t: 'Kendi oyununa çevir', d: 'Bir şey seç ve bir hafta boyunca antrenmanda dene. Ardından kendi maç videonda aynı soruları sor.' },
];

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Oyuncu analizi"
        title={
          <>
            Ustalardan <em>öğrenmenin</em> yolu: doğru izlemek.
          </>
        }
        lead="Profesyonel oyuncuların oyun tarzını, topsuz hareketlerini ve senin oyununa taşıyabileceğin dersleri ayrıştırıyoruz. Her analizde izlerken nelere bakacağın ve kütüphanedeki ilgili teknikler yer alır."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <div className="note note--warn">
            <Icon name="warn" />
            <div>
              <p><strong>Bu analizler eğitim amaçlı yorumdur.</strong> İstatistik, ölçüm verisi, transfer ya da kulüp bilgisi içermez; herkesçe bilinen oyun özelliklerini antrenman diline çevirir. Sayısal veri için resmî lig ve kulüp kaynaklarına bakın; biz uydurma veri göstermiyoruz.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <PlayerGrid players={PLAYERS.map(({ id, name, pos, role, tagline }) => ({ id, name, pos, role, tagline }))} />
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
