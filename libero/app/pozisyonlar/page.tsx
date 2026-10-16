import type { Metadata } from 'next';
import { POSITION_PROFILES } from '@/data/positions';
import { TECHNIQUES } from '@/data';
import { PageHead } from '@/components/PageHead';
import { PositionPicker } from '@/components/PositionPicker';

export const metadata: Metadata = {
  title: 'Pozisyonlar',
  description: 'Kaleci, stoper, bek, ön libero, merkez orta saha, on numara, kanat ve santrfor: her pozisyonun düşünme biçimi, teknikleri, taktikleri ve fiziksel gelişim planı.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Pozisyonlar"
        title={
          <>
            Önce <em>pozisyonunu</em> seç, gelişim yolun belli olsun.
          </>
        }
        lead="Her pozisyonun farklı bir düşünme biçimi, öncelikli bir teknik seti ve fiziksel profili var. Bir ya da birkaç pozisyon seçin; öneriler ve haftalık programınız buna göre şekillenir."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <PositionPicker
            profiles={POSITION_PROFILES.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, keyTechs: p.keyTechs, think: p.think[0] }))}
            techs={TECHNIQUES.map((t) => ({ id: t.id, name: t.name, lv: t.lv }))}
          />
        </div>
      </section>
    </>
  );
}
