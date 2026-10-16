import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { WorkoutPage } from '@/components/WorkoutPage';

export const metadata: Metadata = {
  title: 'Antrenman ayrıntısı',
  description: 'Seçtiğiniz antrenman oturumunun hareketleri: hedef kaslar, set–tekrar–süre, dinlenme, doğru yürütme ve sık yapılan hatalar.',
};

export default function Page() {
  return (
    <>
      <PageHead
        crumbs={[{ href: '/program/', label: 'Programım' }, { label: 'Antrenman ayrıntısı' }]}
        eyebrow="Antrenman ayrıntısı"
        title={<>Bugünün antrenmanı, <em>hareket hareket.</em></>}
        lead="Her hareket için hedef kaslar, set–tekrar–süre, dinlenme, doğru yürütme ve sık yapılan hatalar. Hazır olunca antrenmanı başlatıp setlerinizi işaretleyin."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <WorkoutPage />
        </div>
      </section>
    </>
  );
}
