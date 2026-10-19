import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { VIDEOS } from '@/data/videos';
import verified from '@/data/videos/verified.json';
import { VIDEO_GROUPS } from '@/data/video-topics';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { VideoLibrary } from '@/components/VideoLibrary';

export const metadata: Metadata = {
  title: 'Videolar',
  description: 'Konuya, pozisyona ve seviyeye göre doğrulanmış futbol eğitim videoları. Türkçe özetlerle; videolar YouTube’un resmî oynatıcısıyla, sahibinin kanalından gösterilir.',
};

export default function Page() {
  const tr = VIDEOS.filter((v) => v.lang === 'tr').length;
  const topics = new Set(VIDEOS.map((v) => v.topic)).size;
  const date = (verified as { generatedAt: string }).generatedAt;
  const stats: [string, string][] = [
    [String(VIDEOS.length), 'doğrulanmış video'],
    [String(tr), 'Türkçe anlatım'],
    [String(VIDEOS.length - tr), 'İngilizce anlatım'],
    [String(topics), `konu · ${VIDEO_GROUPS.length} kategori`],
  ];
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
      <VideoLibrary videos={VIDEOS} />
      <section className="section section--tight">
        <div className="container">
          <details className="vinfo">
            <summary className="vinfo__sum"><Icon name="info" /> Bu videolar nasıl seçildi, nasıl oynatılıyor?</summary>
            <div className="vinfo__body">
              <p><strong>Doğrulama.</strong> {VIDEOS.length} video listeleniyor ({tr} Türkçe, {VIDEOS.length - tr} İngilizce). Her kimlik YouTube’un resmî oEmbed bağlantısıyla denetlenir; kaldırılmış, özel ya da gömmeye kapalı videolar elenir. Son doğrulama: {date}. Yenilemek için <code>npm run videos:verify</code>.</p>
              <p><strong>Oynatma.</strong> Videolar bize ait değildir; kopyalanmaz, indirilmez. Karta tıkladığında YouTube’un resmî gömme oynatıcısı (youtube-nocookie) açılır ve kanal sahibine bağlantı verilir. Oynatıcı ve (kişisel notlar için) YouTube’un resmî IFrame API betiği yalnızca sen bir kartı açınca yüklenir.</p>
              <p><strong>Özetler ve altyazı.</strong> Türkçe özetler başlık, kanal ve konuya göre bu site için yazılmıştır; çeviri ya da tam döküm değildir. Türkçe altyazı yalnızca YouTube bilgisinde göründüğü videolarda belirtilir; doğrulanamadıysa bunu yazarız.</p>
              <p><strong>Kapak görselleri.</strong> Her konunun kendi çizim kapağı vardır. “Kapak görselleri YouTube’dan yüklensin” açıkken videonun küçük resmi YouTube’dan çekilir (i.ytimg.com); kapatırsan hiçbir dış görsel istenmez.</p>
              <p><strong>Notların.</strong> Zaman damgalı notlar yalnızca bu tarayıcıda saklanır ve Profil’deki yedeğe girer. Süreler senin eklediğin anlardır; video sahibinin bölüm başlıkları değildir.</p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
