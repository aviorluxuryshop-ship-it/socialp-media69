import type { Metadata } from 'next';
import Link from 'next/link';
import { TECH_BY_ID, techsByCat } from '@/data';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { ScenePicker } from '@/components/ScenePicker';
import { StarRating } from '@/components/StarRating';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Top kontrolü ve topsuz hareketler',
  description: 'İlk temas, yönlü kontrol, havadan gelen top, baskı altında kontrol; boş alan yaratma, savunma arkasına koşu, koşu zamanlaması ve pas açısı. Oyuncu hareketini oklarla izleyin.',
};

const LADDER = [
  'ilk-temas',
  'ic-yuz-durdurma',
  'yonlu-kontrol',
  'dis-ayak-kontrol',
  'ayak-ustu-indirme',
  'gogus-kontrolu',
  'uyluk-kontrolu',
  'sirti-donuk-kontrol',
  'alip-donme',
  'baski-altinda-kontrol',
  'kontrol-sonrasi-karar',
];

const PICK = [
  ['pas-acisi-olusturma', 'Rakibin gizlediği pas yolunu küçük bir hareketle açın: topu taşıyan sizi görsün.'],
  ['bos-alan-yaratma', 'Bir oyuncu savunmacıyı çeker, diğeri boşalan alana girer. Yeşil alan, açılan boşluktur.'],
  ['savunma-arkasina-kosu', 'Savunmacının görüş alanı dışından, ofsayt çizgisinin gerisinden başlayan kavisli koşu.'],
  ['ucuncu-adam-kosusu', 'Pas verenle alanın dışındaki üçüncü oyuncu, savunma ilk iki oyuncuya bakarken boşluğa çıkar.'],
  ['topa-gelme-kacma', 'Önce topa gelip markörü çekin, sonra ani dönüşle savunma arkasına kaçın.'],
  ['kosu-zamanlamasi', 'Koşu, pasörün başını kaldırdığı anda başlar: ne erken ne geç.'],
] as const;

const LEGEND: { cls: string; t: string; d: string }[] = [
  { cls: 'lg lg--pass', t: 'Düz ok', d: 'Pas: topun gittiği yol' },
  { cls: 'lg lg--run', t: 'Kesikli ok', d: 'Topsuz koşu: oyuncunun gittiği yol' },
  { cls: 'lg lg--dribble', t: 'Dalgalı çizgi', d: 'Top sürme' },
  { cls: 'lg lg--air', t: 'Noktalı ok', d: 'Havadan pas' },
];

export default function Page() {
  const ladder = LADDER.map((id) => TECH_BY_ID[id]).filter(Boolean);
  const offball = techsByCat('topsuz');
  return (
    <>
      <PageHead
        eyebrow="Platformun kalbi"
        title={
          <>
            Top kontrolü ve <em>topsuz</em> hareketler.
          </>
        }
        lead="Futbolcu, vaktinin çok küçük bir bölümünde topla oynar. Gerisinde nereye, ne zaman ve nasıl hareket ettiği oyunu belirler. İlk temastan koşu zamanlamasına kadar her şeyi animasyonlu diyagramlarla öğrenin."
        wide
      />

      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">01 · Top kontrolü</p>
              <h2 className="h2">İlk temastan <em>karara</em>: bir merdiven.</h2>
            </div>
            <Link href="/teknikler/?kategori=kontrol" className="btn btn--ghost btn--sm">Tüm kontrol teknikleri <Icon name="arrow" /></Link>
          </div>
          <ol className="ladder">
            {ladder.map((t, i) => (
              <li key={t.id}>
                <Reveal>
                  <Link href={`/teknikler/${t.id}/`} className="ladder__row">
                    <span className="num ladder__n">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="ladder__t">{t.name}</span>
                      <span className="ladder__s">{t.purpose}</span>
                    </span>
                    <span className="ladder__lv"><StarRating value={t.lv} readOnly size="sm" showName={false} label="Zorluk" /></span>
                    <Icon name="arrow" />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">02 · Topsuz hareketler</p>
              <h2 className="h2">Oyuncu nereden başlar, <em>nereye koşar</em>, boşluk neresi?</h2>
            </div>
          </div>
          <ScenePicker
            items={PICK.map(([id, blurb]) => ({ id, name: TECH_BY_ID[id].name, blurb, scene: TECH_BY_ID[id].scene }))}
          />
          <div className="panel" style={{ marginTop: 40 }}>
            <p className="panel__title">Diyagramı nasıl okurum?</p>
            <ul className="legend-grid">
              {LEGEND.map((l) => (
                <li key={l.t}>
                  <i className={l.cls} aria-hidden="true" />
                  <span><b>{l.t}</b><span className="muted"> — {l.d}</span></span>
                </li>
              ))}
              <li><i className="legend-ghost" aria-hidden="true" /><span><b>Kesikli halka</b><span className="muted"> — oyuncunun başladığı yer</span></span></li>
              <li><i className="legend-zone legend-zone--free" aria-hidden="true" /><span><b>Yeşil alan</b><span className="muted"> — boş alan</span></span></li>
              <li><i className="legend-zone legend-zone--danger" aria-hidden="true" /><span><b>Kırmızı alan / çizgi</b><span className="muted"> — kapalı alan, savunma ya da ofsayt çizgisi</span></span></li>
              <li><i className="legend-dot legend-dot--a" aria-hidden="true" /><span><b>Altın oyuncu</b><span className="muted"> — sizin takımınız · </span><i className="legend-dot legend-dot--b" aria-hidden="true" /><b> kırmızı</b><span className="muted"> rakip</span></span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">03 · Tüm topsuz hareketler</p>
              <h2 className="h2">{offball.length} hareket, <em>seviyene göre.</em></h2>
            </div>
            <Link href="/teknikler/?kategori=topsuz" className="btn btn--ghost btn--sm">Kütüphanede aç <Icon name="arrow" /></Link>
          </div>
          <ul className="tech-grid">
            {offball.map((t) => (
              <li key={t.id}>
                <Link href={`/teknikler/${t.id}/`} className="card tech-card">
                  <div className="tech-card__top">
                    <span className="tag tag--brass">{t.sub}</span>
                    <StarRating value={t.lv} readOnly size="sm" showName={false} label="Zorluk" />
                  </div>
                  <h3 className="tech-card__name">{t.name}</h3>
                  <p className="tech-card__sum">{t.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="card card--marks card--pad" style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="h3">Kendi hareketini kur.</p>
              <p className="muted" style={{ marginTop: 6 }}>Taktik tahtasında oyuncuları sürükle; koşu ve pas okları kendiliğinden çizilsin.</p>
            </div>
            <Link href="/taktik-tahtasi/" className="btn btn--primary">Taktik tahtasını aç <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
