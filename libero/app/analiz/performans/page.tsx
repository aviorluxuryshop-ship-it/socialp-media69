import type { Metadata } from 'next';
import { TECHNIQUES } from '@/data';
import { QUIZ } from '@/data/quiz';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { IqPanel, TechPanel, TestsPanel, VolumePanel } from '@/components/PerformanceApp';

export const metadata: Metadata = {
  title: 'Performans analizi',
  description: 'Antrenman geçmişin, saha testi sonuçların, teknik seviye gelişimin ve Futbol IQ doğruluğun tek sayfada. Yalnızca senin kayıtlarından hesaplanır.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Performans analizi"
        title={
          <>
            Gelişimini <em>sayılarla</em> gör.
          </>
        }
        lead="Antrenman geçmişin, saha testi ölçümlerin, teknik seviye değişimin ve Futbol IQ doğruluğun burada toplanır. Hiçbir sayı hazır ya da uydurma değildir; hepsi senin girdiğin kayıtlardan hesaplanır."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <div className="note">
            <Icon name="info" />
            <p>Yaş ve seviyeye göre “norm” ya da “ortalama” göstermiyoruz: güvenilir ve yaşa özgü referans değerleri doğrulayamadığımız için seni yalnızca <strong>kendi geçmişinle</strong> karşılaştırıyoruz. Veriler bu tarayıcıda saklanır; ayrıntı için <a href="/profil/#veriler" className="btn--quiet" style={{ border: 0 }}>Panelim</a>.</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section-title"><div><p className="eyebrow">01 · Antrenman</p><h2 className="h2">Antrenman <em>düzenin</em></h2></div></div>
          <VolumePanel />
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title"><div><p className="eyebrow">02 · Saha testleri</p><h2 className="h2">Ölç, kaydet, <em>kıyasla</em></h2></div>
            <p className="muted" style={{ maxWidth: 440 }}>Sürat, çeviklik, sıçrama, dayanıklılık ve teknik testleri evde ya da sahada, yanında sadece kronometre ve koniyle yapabilirsin.</p>
          </div>
          <TestsPanel />
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title"><div><p className="eyebrow">03 · Teknik gelişim</p><h2 className="h2">Yıldızların <em>nereye gidiyor?</em></h2></div></div>
          <TechPanel techs={TECHNIQUES.map((t) => ({ id: t.id, name: t.name, pos: t.positions }))} />
        </div>
      </section>

      <section className="section section--tight section--ruled">
        <div className="container">
          <div className="section-title"><div><p className="eyebrow">04 · Futbol IQ</p><h2 className="h2">Karar verme <em>becerin</em></h2></div></div>
          <IqPanel quiz={QUIZ.map((q) => ({ id: q.id, theme: q.theme }))} />
        </div>
      </section>
    </>
  );
}
