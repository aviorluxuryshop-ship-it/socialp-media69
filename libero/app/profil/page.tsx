import type { Metadata } from 'next';
import Link from 'next/link';
import { SOURCES } from '@/data/sources';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { DataTools, ProfileForm, ProfileSummary } from '@/components/ProfileApp';

export const metadata: Metadata = {
  title: 'Panelim ve verilerim',
  description: 'Profil, yetenek seviyesi, özet, yedek alma ve geri yükleme. Verilerin yalnızca bu tarayıcıda saklanır.',
};

const TOPIC_NAME: Record<string, string> = {
  egzersiz: 'Egzersiz',
  cocuk: 'Çocuk ve genç sporcu',
  beslenme: 'Beslenme',
  onleme: 'Sakatlık önleme',
  kafa: 'Kafa vuruşu',
};

export default function Page() {
  const topics = Array.from(new Set(SOURCES.map((s) => s.topic)));
  return (
    <>
      <PageHead
        eyebrow="Panelim"
        title={
          <>
            Senin <em>panelin.</em>
          </>
        }
        lead="Profilin, yıldız seviyelerin, antrenman geçmişin ve notların burada toplanır. Hesap gerekmez; ama verilerin yalnızca bu tarayıcıda durur — aşağıda nasıl yedekleyeceğini göster."
        wide
      />

      <section className="section section--tight">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">01 · Özet</p>
              <h2 className="h2">Şimdiye kadar <em>neler yaptın?</em></h2>
            </div>
          </div>
          <ProfileSummary />
          <div className="levelcard__actions" style={{ marginTop: 24 }}>
            <Link href="/program/" className="btn btn--ghost">Programım <Icon name="arrow" /></Link>
            <Link href="/analiz/performans/" className="btn btn--ghost">Performans analizi <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">02 · Profil</p>
              <h2 className="h2">Seni <em>tanıyalım</em></h2>
            </div>
            <p className="muted" style={{ maxWidth: 420 }}>Değişiklikler anında kaydedilir. Program, teknik önerileri ve güvenlik kuralları bu bilgilerle çalışır.</p>
          </div>
          <ProfileForm />
        </div>
      </section>

      <section className="section section--tight section--ruled" id="veriler">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">03 · Veriler</p>
              <h2 className="h2">Yedek, geri yükleme, <em>silme</em></h2>
            </div>
          </div>
          <DataTools />
        </div>
      </section>

      <section className="section section--tight section--ruled" id="kaynaklar">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">04 · Kaynaklar</p>
              <h2 className="h2">Dayandığımız <em>kaynaklar</em></h2>
            </div>
            <p className="muted" style={{ maxWidth: 460 }}>
              Sağlık, çocuk gelişimi ve beslenme bilgileri aşağıdaki kuruluşların yayımlanmış rehberlerine dayanır. Bağlantılar yeni sekmede açılır. Bu içerik tıbbi tavsiye değildir.
            </p>
          </div>
          <div className="grid cols-2" style={{ '--gap': '36px' } as React.CSSProperties}>
            {topics.map((t) => (
              <div key={t}>
                <h3 className="eyebrow" style={{ marginBottom: 6 }}>{TOPIC_NAME[t] ?? t}</h3>
                <ul className="sources">
                  {SOURCES.filter((s) => s.topic === t).map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <Icon name="external" style={{ width: 13, height: 13 }} /></a>
                      <span className="muted">{s.org}</span>
                      <span className="muted" style={{ fontSize: '.85rem' }}>{s.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="note" style={{ marginTop: 40 }}>
            <Icon name="info" />
            <div>
              <p><strong>Videolar ve telif.</strong> Videolar YouTube’un resmî gömme oynatıcısıyla, sahibinin kanalından gösterilir; kopyalanmaz ve indirilmez. Her videonun sahibi ve bağlantısı kartında yer alır. Videoların Türkçe özetleri bize aittir, bir çeviri değildir.</p>
              <p style={{ marginTop: 6 }}>Pozisyon ve teknik açıklamaları antrenörlük literatüründeki genel kabul görmüş ilkelere göre bu site için yazılmıştır; oyuncu analizleri eğitim amaçlı yorumdur, resmî istatistik değildir.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
