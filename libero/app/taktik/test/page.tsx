import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { QuizRunner } from '@/components/QuizRunner';

export const metadata: Metadata = {
  title: 'Futbol IQ testi',
  description: 'Maç durumlarında karar verin; doğru kararı saha üzerinde izleyin ve açıklamaları okuyun.',
};

export default function Page() {
  return (
    <>
      <PageHead
        crumbs={[{ href: '/taktik/', label: 'Taktik' }, { label: 'Futbol IQ testi' }]}
        eyebrow="Etkileşimli test"
        title={
          <>
            Maç durumunu oku, <em>kararını ver.</em>
          </>
        }
        lead="Her soruda sahadaki durumu görürsünüz. Seçiminizi yaptıktan sonra doğru karar animasyonla gösterilir ve her seçenek açıklanır."
      />
      <section className="section section--tight">
        <div className="container">
          <QuizRunner />
        </div>
      </section>
    </>
  );
}
