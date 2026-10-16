import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { TECHNIQUES, TECH_BY_ID } from '@/data';
import { EXERCISES } from '@/data/exercises';
import { QUIZ } from '@/data/quiz';
import { TACTICS } from '@/data/tactics';
import { POSITION_PROFILES } from '@/data/positions';
import { CatGlyph } from '@/components/CatGlyph';
import { ContinueCard, DailyQuiz, HomeLevel } from '@/components/HomeWidgets';
import { Icon } from '@/components/Icon';
import { SceneView } from '@/components/pitch/SceneView';
import { Reveal } from '@/components/Reveal';

export default function Home() {
  const hero = TECH_BY_ID['ucuncu-adam-kosusu'];
  const pool = [QUIZ[0], QUIZ[1], QUIZ[3], QUIZ[7], QUIZ[11], QUIZ[13], QUIZ[17]].filter(Boolean);
  const stats: [string, number][] = [
    ['Teknik', TECHNIQUES.length],
    ['Egzersiz', EXERCISES.length],
    ['Taktik konusu', TACTICS.length],
    ['Karar testi', QUIZ.length],
    ['Pozisyon', POSITION_PROFILES.length],
  ];
  return (
    <>
      {/* ── Açılış ───────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Libero · Futbol Akademisi · Türkçe</p>
            <h1 className="display hero__title">
              Futbolu <em>anlayarak</em> oyna.
            </h1>
            <p className="lead">
              Teknik, top kontrolü, taktik, fiziksel hazırlık ve gelişim takibi tek yerde. Her tekniği saha diyagramıyla izleyin, seviyenize göre çalışın, ilerlemenizi kaydedin.
            </p>
            <div className="hero__cta">
              <Link href="/teknikler/" className="btn btn--primary">Teknik kütüphanesini aç <Icon name="arrow" /></Link>
              <Link href="/program/" className="btn btn--ghost">Programını oluştur</Link>
            </div>
            <div className="hero__me">
              <HomeLevel />
              <ContinueCard />
            </div>
          </div>
          <div className="hero__scene">
            <div className="card card--marks hero__frame">
              <p className="hero__tag mono">
                <span>Örnek hareket</span>
                <Link href={`/teknikler/${hero.id}/`}>{hero.name} →</Link>
              </p>
              <SceneView scene={hero.scene} title={hero.name} holdMs={2600} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Sayılar ──────────────────────────────────── */}
      <section className="stats" aria-label="Platform içeriği">
        <div className="container stats__row">
          {stats.map(([k, n]) => (
            <div key={k} className="stats__item">
              <span className="num stats__n">{n}</span>
              <span className="mono muted">{k}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Teknik kütüphanesi ───────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">01 · Teknik kütüphanesi</p>
              <h2 className="h2">Her tekniğin <em>nasıl</em> yapıldığı, adım adım.</h2>
            </div>
            <Link href="/teknikler/" className="btn btn--ghost btn--sm">Tümünü gör <Icon name="arrow" /></Link>
          </div>
          <ul className="cat-grid">
            {CATEGORIES.map((c, i) => {
              const n = TECHNIQUES.filter((t) => t.cat === c.id).length;
              return (
                <li key={c.id}>
                  <Reveal delay={(i % 4) * 50}>
                    <Link href={`/teknikler/?kategori=${c.id}`} className="card cat-card">
                      <span className="cat-card__glyph"><CatGlyph id={c.id} size={40} /></span>
                      <span className="cat-card__n num">{String(n).padStart(2, '0')}</span>
                      <h3 className="cat-card__name">{c.name}</h3>
                      <p className="cat-card__blurb">{c.blurb}</p>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Top kontrolü / topsuz ─────────────────────── */}
      <section className="section section--ruled">
        <div className="container split">
          <div className="split__copy">
            <p className="eyebrow">02 · Top kontrolü ve topsuz hareket</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Top ayağına gelmeden <em>önce</em> başlar.</h2>
            <p className="lead" style={{ marginTop: 18 }}>
              İlk temas, yönlü kontrol, baskı altında kontrol; boş alan yaratma, koşu zamanlaması, pas açısı. Oyuncunun nereden başladığını, nereye koştuğunu ve topun nereye gittiğini oklarla izleyin.
            </p>
            <ol className="steps" style={{ marginTop: 28 }}>
              <li>Tara: top gelmeden önce omuz üstü bakın.</li>
              <li>Al: ilk temasınız bir sonraki hamleyi hazırlasın.</li>
              <li>Karar ver: pas, sürüş ya da şut. Duraksamayın.</li>
            </ol>
            <p style={{ marginTop: 28 }}>
              <Link href="/top-kontrolu/" className="btn btn--primary">Top kontrolü bölümünü aç <Icon name="arrow" /></Link>
            </p>
          </div>
          <div className="split__fig">
            <div className="card card--marks hero__frame">
              <SceneView scene={TECH_BY_ID['bos-alan-yaratma'].scene} title="Boş alan yaratma" holdMs={2600} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Taktik tahtası ───────────────────────────── */}
      <section className="section section--ruled">
        <div className="container split split--rev">
          <div className="split__fig">
            <div className="card card--marks hero__frame">
              <SceneView scene={TACTICS[0].scene} title={TACTICS[0].title} holdMs={2800} />
            </div>
          </div>
          <div className="split__copy">
            <p className="eyebrow">03 · Taktik ve taktik tahtası</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Pres, geçiş, yerleşim: <em>çizmeyin, oynatın.</em></h2>
            <p className="lead" style={{ marginTop: 18 }}>
              Dokuz taktik konusunu animasyonlu diyagramlarla öğrenin. Kendi senaryonuzu taktik tahtasında kurun: oyuncuları sürükleyin, pas ve koşu okları kendiliğinden çizilsin.
            </p>
            <div className="hero__cta" style={{ marginTop: 28 }}>
              <Link href="/taktik-tahtasi/" className="btn btn--primary">Taktik tahtasını aç <Icon name="arrow" /></Link>
              <Link href="/taktik/" className="btn btn--ghost">Taktik konuları</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Futbol IQ ────────────────────────────────── */}
      <section className="section section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">04 · Futbol IQ</p>
              <h2 className="h2">Ne yapardın? <em>Kararını ver.</em></h2>
            </div>
            <Link href="/taktik/test/" className="btn btn--ghost btn--sm">{QUIZ.length} soruluk testi çöz <Icon name="arrow" /></Link>
          </div>
          <DailyQuiz pool={pool} />
        </div>
      </section>

      {/* ── Gelişim ──────────────────────────────────── */}
      <section className="section section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">05 · Gelişim</p>
              <h2 className="h2">Çalış, kaydet, <em>geliştiğini gör.</em></h2>
            </div>
          </div>
          <ul className="dev-grid">
            {[
              ['/program/', 'calendar', 'Kişisel program', 'Yaşa, seviyeye, hedefe ve ekipmana göre esnek haftalık plan. Tamamla, yarım bıraktığın yerden devam et.'],
              ['/fiziksel/', 'dumbbell', 'Fiziksel gelişim', 'Sürat, çeviklik, kuvvet, denge. Kas haritasından egzersiz bul; yaşa uygun doz gör.'],
              ['/beslenme/', 'leaf', 'Beslenme ve toparlanma', 'Antrenman öncesi-sonrası, sıvı ve pratik öğünler. Sevmediğin yiyeceğe alternatif bul.'],
              ['/analiz/performans/', 'chart', 'Performans analizi', 'Antrenman geçmişin, test sonuçların ve teknik seviye gelişimin tek ekranda.'],
            ].map(([href, icon, t, d]) => (
              <li key={href}>
                <Link href={href} className="card dev-card">
                  <span className="dev-card__icon"><Icon name={icon} /></span>
                  <h3 className="dev-card__t">{t}</h3>
                  <p>{d}</p>
                  <span className="dev-card__go mono">Aç <Icon name="arrow" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Pozisyonlar ──────────────────────────────── */}
      <section className="section section--ruled">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="eyebrow">06 · Pozisyonlar</p>
              <h2 className="h2">Her pozisyon <em>farklı</em> düşünür.</h2>
            </div>
            <Link href="/pozisyonlar/" className="btn btn--ghost btn--sm">Pozisyonunu seç <Icon name="arrow" /></Link>
          </div>
          <ul className="pos-strip">
            {POSITION_PROFILES.map((p) => (
              <li key={p.id}>
                <Link href={`/pozisyonlar/${p.id}/`} className="pos-strip__item">
                  <span className="pos-strip__name">{p.name}</span>
                  <span className="pos-strip__tag">{p.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Dürüstlük ────────────────────────────────── */}
      <section className="section section--ruled">
        <div className="container honest">
          <div>
            <p className="eyebrow">Bilmeniz gerekenler</p>
            <h2 className="h2" style={{ marginTop: 14 }}>Ne var, ne yok — <em>açıkça.</em></h2>
          </div>
          <ul className="honest__list">
            <li><strong>Veriler bu tarayıcıda.</strong> Hesap sistemi yok; programınız ve ilerlemeniz yalnızca bu cihazda saklanır. Panelim sayfasından yedek alabilirsiniz.</li>
            <li><strong>Eğitim amaçlı.</strong> İçerik tıbbi tavsiye ya da bireysel diyet programı değildir. Çocuk ve ergenler için doz ve egzersiz seçimi yaşa göre sınırlandırılır.</li>
            <li><strong>Videolar doğrulanmıştır.</strong> Gösterilen her video gerçek ve resmî gömme oynatıcısıyla sunulur; bulunamayan içerik uydurulmaz.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
