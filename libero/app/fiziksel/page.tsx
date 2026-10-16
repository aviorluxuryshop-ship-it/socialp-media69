import type { Metadata } from 'next';
import Link from 'next/link';
import { EXERCISES } from '@/data/exercises';
import { BAND_RULES } from '@/lib/training';
import { ExerciseLibrary } from '@/components/ExerciseLibrary';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';

export const metadata: Metadata = {
  title: 'Fiziksel gelişim',
  description: 'Sürat, çeviklik, kuvvet, denge, dayanıklılık ve toparlanma egzersizleri. Kas grubuna, ortama ve ekipmana göre arayın; yaşa uygun dozları görün.',
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Fiziksel gelişim"
        title={
          <>
            Daha hızlı, daha güçlü, <em>daha dayanıklı</em> — güvenle.
          </>
        }
        lead="Egzersizleri kas grubuna, ortama ve elinizdeki ekipmana göre arayın. Her hareketin nasıl yapıldığını, hangi kasları çalıştırdığını, futbola katkısını ve yaşa uygun dozunu görün."
        wide
      />
      <section className="section section--tight">
        <div className="container">
          <div className="note note--warn" style={{ marginBottom: 32 }}>
            <Icon name="warn" />
            <div>
              <p>
                <strong>Çocuk ve ergenler için: </strong>
                {BAND_RULES.u12.rules[0]} 12–17 yaşta güçlendirme çalışmaları nitelikli gözetim altında, hafif yükle ve doğru teknikle yapılır; maksimum yük denemeleri
                ertelenir. Ayrıntılar için <Link href="/program/" className="btn--quiet" style={{ border: 0 }}>kişisel program</Link> sayfasına ve{' '}
                <Link href="/profil/#kaynaklar" className="btn--quiet" style={{ border: 0 }}>kaynaklara</Link> bakın.
              </p>
            </div>
          </div>
          <ExerciseLibrary
            items={EXERCISES.map((e) => ({ id: e.id, name: e.name, cat: e.cat, muscles: e.muscles, secondary: e.secondary, env: e.env, equip: e.equip, lv: e.lv, minAge: e.minAge, why: e.why }))}
          />
        </div>
      </section>
    </>
  );
}
