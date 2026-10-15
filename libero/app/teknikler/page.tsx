import type { Metadata } from 'next';
import { LIGHT_TECHS } from '@/data';
import { Library } from '@/components/Library';
import { PageHead } from '@/components/PageHead';

export const metadata: Metadata = {
  title: 'Teknik kütüphanesi',
  description: 'Pas, şut, top kontrolü, çalım, kafa, bitiricilik, savunma, kalecilik ve duran top tekniklerini arayın, seviyenize göre çalışın.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Teknik kütüphanesi"
        title={
          <>
            Her tekniğin <em>nasıl</em> yapıldığını, nerede kullanıldığını ve nasıl çalışıldığını öğrenin.
          </>
        }
        lead="Teknikler temas yüzeyine, uygulama biçimine ve oyun içindeki amaca göre ayrılmıştır. Arama kutusuna bir teknik yazın, yıldızlı seviyenizi seçin; çalışmalar seviyenize göre öne çıkar."
        wide
      />
      <Library items={LIGHT_TECHS} />
    </>
  );
}
