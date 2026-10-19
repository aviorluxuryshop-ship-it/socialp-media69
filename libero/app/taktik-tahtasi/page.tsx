import type { Metadata } from 'next';
import { Board } from '@/components/pitch/Board';
import { PageHead } from '@/components/PageHead';

export const metadata: Metadata = {
  title: 'Taktik tahtası',
  description: 'Oyuncu konumlarını sürükleyin, pas, koşu ve çalım yollarını adım adım oynatın. Kaydedin, PNG ya da JSON olarak dışa aktarın.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Etkileşimli taktik tahtası"
        title={
          <>
            Hareketi çizmeyin; <em>oynatın.</em>
          </>
        }
        lead="Oyuncuları sürükleyip yeni bir adım ekleyin: pas, koşu ve çalım okları kendiliğinden çizilir. Adımları oynatın, kaydedin, PNG olarak indirin."
        wide
      />
      <section className="section section--tight">
        <div className="container container--board">
          <Board />
        </div>
      </section>
    </>
  );
}
