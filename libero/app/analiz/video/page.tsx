import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { VideoLab } from '@/components/VideoLab';

export const metadata: Metadata = {
  title: 'Video analizi',
  description: 'Kendi antrenman ya da maç videonu yükle; kare kare ilerle, yavaşlat, çizgi ve açı çiz, notlarını kaydet. Video cihazından çıkmaz.',
};

const TIPS = [
  { t: 'Telefonu sabitle', d: 'Yere dayayarak ya da bir arkadaşın sabit tutmasıyla çek. Sallanan görüntüde açı ve konum okunmaz.' },
  { t: 'Yandan ya da önden çek', d: 'Pas ve şut için yan görünüm, koşu ve duruş için önden/arkadan. Oyuncu kadrajın tamamına yakın yer kaplasın.' },
  { t: 'Yatay çek, 60 kare/sn seç', d: 'Yavaş çekim kare adımlarının daha net olmasını sağlar. Telefonun ayarlarından 60 fps seçeneği varsa onu kullan.' },
  { t: 'Aynı işi birkaç kez yap', d: 'Tek bir tekrar yerine 5–6 tekrar çek; en iyi ve en kötüsünü karşılaştır.' },
  { t: 'Sorunu tek kelimeyle yaz', d: 'Örn. “duruş ayağı geride”. Bir sonraki antrenmanda sadece onu düzelt.' },
];

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Video analizi"
        title={
          <>
            Kendini <em>dışarıdan</em> izle.
          </>
        }
        lead="Antrenman ya da maç videonu yükle; kare kare ilerle, yavaşlat, çizgi ve açı çiz, notlarını zaman damgasıyla kaydet. Ücretsizdir; video tarayıcında açılır ve cihazından hiçbir yere gönderilmez."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <VideoLab />
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container grid cols-2" style={{ '--gap': '48px' } as React.CSSProperties}>
          <div>
            <p className="eyebrow">Çekim ipuçları</p>
            <h2 className="h2" style={{ marginTop: 14 }}>İyi analiz, iyi <em>çekimle</em> başlar</h2>
            <ol className="principles" style={{ marginTop: 24 }}>
              {TIPS.map((g, i) => (
                <li key={g.t}>
                  <span className="num principles__n">{String(i + 1).padStart(2, '0')}</span>
                  <div><h3 className="principles__t">{g.t}</h3><p className="muted">{g.d}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow">Daha fazlası gerekirse</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Ücretsiz <em>alternatifler</em></h2>
            <ul className="sources" style={{ marginTop: 24 }}>
              <li>
                <a href="https://www.kinovea.org/" target="_blank" rel="noopener noreferrer">Kinovea <Icon name="external" style={{ width: 13, height: 13 }} /></a>
                <span className="muted">Spor hareketi analizi için ücretsiz, açık kaynaklı masaüstü uygulaması: çizim, açı, zaman ölçümü ve yan yana karşılaştırma. Windows için sunulur.</span>
              </li>
              <li>
                <a href="https://opensourcephysics.github.io/tracker-website/" target="_blank" rel="noopener noreferrer">Tracker <Icon name="external" style={{ width: 13, height: 13 }} /></a>
                <span className="muted">Video üzerinde nesne ve oyuncu konumunu işaretleyip hız/mesafe hesaplayan ücretsiz, açık kaynaklı fizik analiz aracı.</span>
              </li>
              <li>
                <span className="sources__plain">Telefonun galerisi</span>
                <span className="muted">Çoğu telefonda yavaş çekim ve kare kare ilerleme vardır; üstüne çizim için yerleşik “düzenle” araçları kullanılabilir.</span>
              </li>
            </ul>
            <p className="field__hint" style={{ marginTop: 14 }}>Bu araçlar bağımsız projelerdir; Libero ile bağlantıları yoktur. Kullanmadan önce kendi sitelerinden güncel sistem gereksinimlerini kontrol et.</p>
          </div>
        </div>
      </section>
    </>
  );
}
