import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { ProgramApp } from '@/components/ProgramApp';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Kişisel antrenman programı',
  description: 'Yaşınıza, seviyenize, hedefinize, pozisyonunuza ve ekipmanınıza göre esnek haftalık antrenman programı. Tamamla, devam et, geçmişi gör.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Kişisel program"
        title={
          <>
            Hayatına uyan, <em>sana özel</em> haftalık plan.
          </>
        }
        lead="Yaş, seviye, hedef, pozisyon, ekipman ve ortamını girin; program oluşsun. Oturumları istediğiniz güne taşıyın, tamamlandı işaretleyin, yarım bıraktığınız yerden devam edin."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <div className="note" style={{ marginBottom: 28 }}>
            <Icon name="lock" />
            <p>
              <strong>Verileriniz bu tarayıcıda saklanır.</strong> Hesap ya da sunucu yoktur; programınız ve geçmişiniz yalnızca bu cihazda ve bu tarayıcıda görünür.
              Başka cihaza taşımak için Panelim sayfasından yedek alın.
            </p>
          </div>
          <ProgramApp />
        </div>
      </section>
    </>
  );
}
