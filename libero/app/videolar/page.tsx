import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VIDEOS } from '@/data/videos';
import verified from '@/data/videos/verified.json';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { VideoLibrary } from '@/components/VideoLibrary';

export const metadata: Metadata = {
  title: 'Videolar',
  description: 'Konuya, pozisyona ve seviyeye göre doğrulanmış futbol eğitim videoları. Türkçe özetlerle; videolar YouTube’un resmî oynatıcısıyla, sahibinin kanalından gösterilir.',
};

export default function Page() {
  const tr = VIDEOS.filter((v) => v.lang === 'tr').length;
  const date = (verified as { generatedAt: string }).generatedAt;
  return (
    <>
      <PageHead
        eyebrow="Video kütüphanesi"
        title={
          <>
            Gösteren <em>doğru</em> videoyu bul.
          </>
        }
        lead="Konuya, pozisyona ve seviyeye göre ayrılmış eğitim videoları. Her video, varlığı ve gömülebilirliği YouTube’un resmî bağlantısı üzerinden doğrulanarak eklenir; Türkçe özeti ve kanal sahibi kartında yer alır."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <div className="note">
            <Icon name="info" />
            <div>
              <p><strong>Nasıl çalışıyor?</strong> {VIDEOS.length} video listeleniyor ({tr} Türkçe, {VIDEOS.length - tr} İngilizce). Videolar bize ait değildir; kopyalanmaz ya da indirilmez. Karta tıkladığında YouTube’un resmî gömme oynatıcısı açılır ve kanal sahibine bağlantı verilir. Kapalı altyazı varsa Türkçe olarak açılmaya çalışılır; yoksa “Türkçe özet” bölümünü kullan.</p>
              <p style={{ marginTop: 6 }}>Türkçe özetler video başlığı ve konusuna göre bu site için yazılmıştır, çeviri değildir. Doğrulama tarihi: {date}. Bir video kaldırılmış ya da gizlenmişse oynatıcı bunu gösterir; doğrulamayı <code>npm run videos:verify</code> ile yenileyebilirsin.</p>
            </div>
          </div>
        </div>
      </section>
      <Suspense fallback={null}>
        <VideoLibrary videos={VIDEOS} />
      </Suspense>
    </>
  );
}
