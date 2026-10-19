import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { TECHNIQUES, TECH_BY_ID } from '@/data';
import { EXERCISES } from '@/data/exercises';
import { QUIZ } from '@/data/quiz';
import { TACTICS } from '@/data/tactics';
import { POSITION_PROFILES } from '@/data/positions';
import { PLAYERS } from '@/data/players';
import { VIDEOS } from '@/data/videos';
import { CatGlyph } from '@/components/CatGlyph';
import { DailyQuiz } from '@/components/HomeWidgets';
import { HeroBall } from '@/components/HeroBall';
import { HeroPitch, MiniBoard, MiniChart, MiniQuiz, MiniVideo, MiniWeek } from '@/components/HomeShowcase';
import { Icon } from '@/components/Icon';
import { SceneView } from '@/components/pitch/SceneView';
import { Count, Reveal } from '@/components/Reveal';
import { TodayEntry } from '@/components/TodayEntry';
import type { TodayTech } from '@/lib/today';

const idx = (n: number) => String(n).padStart(2, '0');

export default function Home() {
  const hero = TECH_BY_ID['uzun-pas'];
  const pool = [QUIZ[0], QUIZ[1], QUIZ[3], QUIZ[7], QUIZ[11], QUIZ[13], QUIZ[17]].filter(Boolean);
  const sample = QUIZ[1] ?? QUIZ[0];

  // Gerçek sayılar: derleme anında veriden hesaplanır
  const stats: [string, number][] = [
    ['Teknik', TECHNIQUES.length],
    ['Egzersiz', EXERCISES.length],
    ['Doğrulanmış video', VIDEOS.length],
    ['Oyuncu analizi', PLAYERS.length],
    ['Taktik konusu', TACTICS.length],
  ];

  const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
  const techs: TodayTech[] = TECHNIQUES.map((t) => ({ id: t.id, name: t.name, cat: catName[t.cat] ?? t.cat, lv: t.lv, pos: t.positions }));

  return (
    <>
      {/* ── 1 · Açılış: stadyum gecesi ─────────────────────────── */}
      <section className="hero" data-parallax aria-labelledby="hero-title">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__beam hero__beam--l" data-depth="0.25" />
          <div className="hero__beam hero__beam--r" data-depth="0.4" />
          <div className="hero__haze" />
          <div className="hero__pitch" data-depth="0.12">
            <HeroPitch />
          </div>
          <div className="hero__grain grain" />
        </div>

        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--live enter" style={{ '--e': 0 } as React.CSSProperties}>
              Libero · Futbol Akademisi
            </p>
            <h1 id="hero-title" className="hero__title enter" style={{ '--e': 1 } as React.CSSProperties}>
              <span className="hero__line">Futbolu</span>
              <span className="hero__line">
                <em>anlayarak</em>
              </span>
              <span className="hero__line">oyna.</span>
            </h1>
            <p className="lead hero__lead enter" style={{ '--e': 3 } as React.CSSProperties}>
              Teknik, top kontrolü, taktik, fiziksel hazırlık ve gelişim takibi tek yerde. Her tekniği saha diyagramıyla izle, seviyene göre çalış, ilerlemeni kaydet.
            </p>
            <div className="hero__cta enter" style={{ '--e': 4 } as React.CSSProperties}>
              <Link href="/teknikler/" className="btn btn--primary btn--lg">
                Teknik kütüphanesini aç <Icon name="arrow" />
              </Link>
              <Link href="/program/" className="btn btn--ghost btn--lg">
                Programını oluştur
              </Link>
            </div>
          </div>

          <div className="hero__ball enter enter--scale" style={{ '--e': 2 } as React.CSSProperties} data-depth="0.5">
            <HeroBall />
          </div>
        </div>

        <div className="container hero__foot">
          <ul className="hero__stats" aria-label="Platform içeriği">
            {stats.map(([k, n], i) => (
              <li key={k} className="hero__stat" data-reveal="fade" data-delay={500 + i * 90}>
                <Count to={n} className="num hero__stat-n" />
                <span className="mono">{k}</span>
              </li>
            ))}
          </ul>
          <a href="#bugun" className="scroll-cue hero__cue" aria-label="Aşağı kaydır: Bugün ne çalışayım?">
            <span className="scroll-cue__line" aria-hidden="true" />
            Kaydır
          </a>
        </div>
      </section>

      {/* ── 2 · Bugün ne çalışayım? (akıllı giriş) ───────────────── */}
      <section id="bugun" className="band today-band" aria-labelledby="bugun-h">
        <div className="container today-grid">
          <Reveal className="today-grid__head">
            <p className="eyebrow">Senin için</p>
            <h2 id="bugun-h" className="h2 today-grid__title">
              Bugün ne <em>çalışayım?</em>
            </h2>
            <p className="lead">
              Seviyene, pozisyonuna ve programına bakıp tek bir somut öneri veririz. Hesap gerekmez; her şey yalnızca bu tarayıcıda durur.
            </p>
            <ul className="today-links">
              <li>
                <Link href="#iq" className="link-wipe">Günün Futbol IQ sorusu</Link>
              </li>
              <li>
                <Link href="/taktik-tahtasi/" className="link-wipe">Taktik tahtasını aç</Link>
              </li>
              <li>
                <Link href="/profil/" className="link-wipe">Profilini düzenle</Link>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={120} variant="scale" className="today-grid__body">
            <TodayEntry techs={techs} />
          </Reveal>
        </div>
      </section>

      {/* ── 3 · Vitrin: ürünün gerçek alanlarından önizlemeler ───── */}
      <section className="band band--deep showcase" aria-labelledby="vitrin-h">
        <div className="container">
          <div className="section-head">
            <Reveal variant="heading">
              <p className="eyebrow">01 · Çalışma alanları</p>
              <h2 id="vitrin-h" className="h2 section-head__title">
                Tek yerde <em>her çalışma alanı.</em>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="lead">Antrenman odası, taktik tahtası ve analiz laboratuvarı; hepsi tarayıcında, hesapsız.</p>
            </Reveal>
          </div>

          <div className="bento">
            <Reveal className="bento__cell bento__cell--tech" variant="scale">
              <Link href="/teknikler/" className="card card--edge bento__card nudge-group">
                <div className="bento__top">
                  <span className="tag tag--accent">Canlı önizleme</span>
                  <span className="mono muted">{hero.name}</span>
                </div>
                <div className="bento__scene">
                  <SceneView scene={hero.scene} title={hero.name} holdMs={2600} legend={false} />
                </div>
                <div className="bento__foot">
                  <div>
                    <h3 className="bento__t">Teknik kütüphanesi</h3>
                    <p className="bento__d">{TECHNIQUES.length} tekniğin adımları, hataları ve saha diyagramı.</p>
                  </div>
                  <span className="bento__go nudge"><Icon name="arrow" /></span>
                </div>
              </Link>
            </Reveal>

            <Reveal className="bento__cell bento__cell--board" delay={80}>
              <Link href="/taktik-tahtasi/" className="card card--edge bento__card nudge-group">
                <div className="bento__top">
                  <span className="tag">Örnek önizleme</span>
                </div>
                <div className="bento__art"><MiniBoard /></div>
                <div className="bento__foot">
                  <div>
                    <h3 className="bento__t">Taktik tahtası</h3>
                    <p className="bento__d">Oyuncuları sürükle; pas ve koşu okları kendiliğinden çizilsin, senaryoyu oynat.</p>
                  </div>
                  <span className="bento__go nudge"><Icon name="arrow" /></span>
                </div>
              </Link>
            </Reveal>

            <Reveal className="bento__cell bento__cell--week" delay={200}>
              <Link href="/program/" className="card card--edge bento__card nudge-group">
                <div className="bento__top">
                  <span className="tag">Örnek hafta</span>
                </div>
                <div className="bento__art"><MiniWeek /></div>
                <div className="bento__foot">
                  <div>
                    <h3 className="bento__t">Kişisel program</h3>
                    <p className="bento__d">Yaşa, seviyeye, ev/salon/saha ortamına ve ekipmana göre.</p>
                  </div>
                  <span className="bento__go nudge"><Icon name="arrow" /></span>
                </div>
              </Link>
            </Reveal>

            <Reveal className="bento__cell bento__cell--iq" delay={140}>
              <Link href="/taktik/test/" className="card card--edge bento__card nudge-group">
                <div className="bento__top">
                  <span className="tag tag--gold">{QUIZ.length} soru</span>
                </div>
                <div className="bento__art bento__art--quiz">
                  <MiniQuiz q={sample.q} opts={sample.opts.map((o) => o.t)} />
                </div>
                <div className="bento__foot">
                  <div>
                    <h3 className="bento__t">Futbol IQ</h3>
                    <p className="bento__d">Sahadaki kararı ver, nedenini oku.</p>
                  </div>
                  <span className="bento__go nudge"><Icon name="arrow" /></span>
                </div>
              </Link>
            </Reveal>

            <Reveal className="bento__cell bento__cell--video" delay={80}>
              <Link href="/analiz/video/" className="card card--edge bento__card nudge-group">
                <div className="bento__top">
                  <span className="tag tag--sky">Örnek önizleme</span>
                </div>
                <div className="bento__art"><MiniVideo /></div>
                <div className="bento__foot">
                  <div>
                    <h3 className="bento__t">Video analizi</h3>
                    <p className="bento__d">Kendi videonu kare kare incele, çizgi ve açı çiz, zaman damgalı not al. Video cihazından çıkmaz.</p>
                  </div>
                  <span className="bento__go nudge"><Icon name="arrow" /></span>
                </div>
              </Link>
            </Reveal>

            <Reveal className="bento__cell bento__cell--perf" delay={140}>
              <Link href="/analiz/performans/" className="card card--edge bento__card nudge-group">
                <div className="bento__top">
                  <span className="tag tag--sky">Örnek görünüm</span>
                </div>
                <div className="bento__art"><MiniChart /></div>
                <div className="bento__foot">
                  <div>
                    <h3 className="bento__t">Performans analizi</h3>
                    <p className="bento__d">Antrenman geçmişin, test sonuçların ve seviye gelişimin; yalnızca kendi kayıtlarından.</p>
                  </div>
                  <span className="bento__go nudge"><Icon name="arrow" /></span>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 4 · Teknik kütüphanesi: dev sayı + kategori bulutu ───── */}
      <section className="band lib" aria-labelledby="lib-h">
        <div className="container lib__grid">
          <Reveal className="lib__big" variant="heading">
            <p className="eyebrow">02 · Teknik kütüphanesi</p>
            <p className="lib__numeral numeral numeral--solid" aria-hidden="true">
              <Count to={TECHNIQUES.length} className="" />
            </p>
            <h2 id="lib-h" className="h2 lib__title">
              teknik, <em>{CATEGORIES.length} kategori.</em>
            </h2>
            <p className="lead">Her tekniğin nasıl yapıldığı, nerede kullanıldığı ve nasıl çalışıldığı; adım adım, saha diyagramıyla.</p>
            <p className="lib__cta">
              <Link href="/teknikler/" className="btn btn--primary">Tümünü gör <Icon name="arrow" /></Link>
            </p>
          </Reveal>
          <ul className="lib__cats" aria-label="Teknik kategorileri">
            {CATEGORIES.map((c, i) => {
              const n = TECHNIQUES.filter((t) => t.cat === c.id).length;
              return (
                <li key={c.id}>
                  <Reveal delay={i * 45} variant="scale">
                    <Link href={`/teknikler/?kategori=${c.id}`} className="lib__cat nudge-group" title={c.blurb}>
                      <span className="lib__cat-glyph"><CatGlyph id={c.id} size={34} /></span>
                      <span className="lib__cat-name">{c.name}</span>
                      <span className="lib__cat-n num">{n}</span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── 5 · Top kontrolü ───────────────────────────────────── */}
      <section className="band band--pitch spot-top" aria-labelledby="top-h">
        <div className="container split">
          <div className="split__copy">
            <Reveal variant="heading">
              <p className="eyebrow">03 · Top kontrolü ve topsuz hareket</p>
              <h2 id="top-h" className="h2 split__title">
                Top ayağına gelmeden <em>önce</em> başlar.
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="lead">
                İlk temas, yönlü kontrol, baskı altında kontrol; boş alan yaratma, koşu zamanlaması, pas açısı. Oyuncunun nereden başladığını, nereye koştuğunu ve topun nereye gittiğini oklarla izle.
              </p>
            </Reveal>
            <Reveal delay={140}>
              <ol className="steps">
                <li>Tara: top gelmeden önce omuz üstü bak.</li>
                <li>Al: ilk temasın bir sonraki hamleni hazırlasın.</li>
                <li>Karar ver: pas, sürüş ya da şut. Duraksama.</li>
              </ol>
            </Reveal>
            <Reveal delay={200}>
              <p>
                <Link href="/top-kontrolu/" className="btn btn--primary">Top kontrolü bölümünü aç <Icon name="arrow" /></Link>
              </p>
            </Reveal>
          </div>
          <Reveal className="split__fig" variant="right">
            <div className="stage card card--marks">
              <SceneView scene={TECH_BY_ID['bos-alan-yaratma'].scene} title="Boş alan yaratma" holdMs={2600} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 6 · Taktik tahtası ────────────────────────────────── */}
      <section className="band band--lift tactic" aria-labelledby="tak-h">
        <div className="container split split--rev">
          <Reveal className="split__fig" variant="left">
            <div className="stage card card--marks">
              <SceneView scene={TACTICS[0].scene} title={TACTICS[0].title} holdMs={2800} />
            </div>
          </Reveal>
          <div className="split__copy">
            <Reveal variant="heading">
              <p className="eyebrow">04 · Taktik ve taktik tahtası</p>
              <h2 id="tak-h" className="h2 split__title">
                Pres, geçiş, yerleşim: <em>çizme, oynat.</em>
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="lead">
                {TACTICS.length} taktik konusunu animasyonlu diyagramlarla öğren. Kendi senaryonu taktik tahtasında kur: oyuncuları sürükle, pas ve koşu okları kendiliğinden çizilsin.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="hero__cta">
                <Link href="/taktik-tahtasi/" className="btn btn--primary">Taktik tahtasını aç <Icon name="arrow" /></Link>
                <Link href="/taktik/" className="btn btn--ghost">Taktik konuları</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 7 · Futbol IQ ─────────────────────────────────────── */}
      <section id="iq" className="band iq" aria-labelledby="iq-h">
        <span className="iq__bg numeral numeral--ghost" aria-hidden="true">IQ</span>
        <div className="container">
          <div className="section-title">
            <Reveal variant="heading">
              <p className="eyebrow">05 · Futbol IQ</p>
              <h2 id="iq-h" className="h2">
                Ne yapardın? <em>Kararını ver.</em>
              </h2>
            </Reveal>
            <Link href="/taktik/test/" className="btn btn--ghost btn--sm">{QUIZ.length} soruluk testi çöz <Icon name="arrow" /></Link>
          </div>
          <Reveal delay={80}>
            <DailyQuiz pool={pool} />
          </Reveal>
        </div>
      </section>

      {/* ── 8 · Nasıl çalışır ─────────────────────────────────── */}
      <section className="band band--deep how" aria-labelledby="how-h">
        <div className="container">
          <div className="section-head">
            <Reveal variant="heading">
              <p className="eyebrow">06 · Nasıl çalışır</p>
              <h2 id="how-h" className="h2 section-head__title">
                Üç adımda <em>kendi planın.</em>
              </h2>
            </Reveal>
          </div>
          <ol className="how__steps">
            {[
              ['Seviyeni ve ortamını seç', 'Yaşını, yıldız seviyeni, pozisyonunu; ev, salon ya da saha ve elindeki ekipmanı işaretle. Öneriler buna göre daralır.', '/profil/', 'Profilini kur', 'user'],
              ['Planı kur, çalış', 'Program yaşına ve ortamına uygun hareketlerden oluşur. Her hareketi ayrıntısıyla gör; yarım bıraktığın yerden devam et.', '/program/', 'Programı oluştur', 'calendar'],
              ['Kaydet, izle, geliş', 'Antrenman geçmişin, test sonuçların ve video notların bu tarayıcıda durur; Panelim sayfasından yedek alabilirsin.', '/analiz/performans/', 'Gelişimi gör', 'chart'],
            ].map(([t, d, href, cta, icon], i) => (
              <li key={t} className="how__step">
                <Reveal delay={i * 120} className="how__inner">
                  <span className="how__n numeral" aria-hidden="true">{idx(i + 1)}</span>
                  <span className="how__icon"><Icon name={icon} /></span>
                  <h3 className="h3 how__t">{t}</h3>
                  <p className="how__d">{d}</p>
                  <Link href={href} className="btn btn--quiet">{cta}</Link>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 9 · Diğer alanlar: dizin listesi ───────────────────── */}
      <section className="band more" aria-labelledby="more-h">
        <div className="container">
          <div className="section-head">
            <Reveal variant="heading">
              <p className="eyebrow">07 · Daha fazlası</p>
              <h2 id="more-h" className="h2 section-head__title">
                Çalışma alanlarının <em>geri kalanı.</em>
              </h2>
            </Reveal>
          </div>
          <ul className="index-list">
            {[
              ['/fiziksel/', 'dumbbell', 'Fiziksel gelişim', 'Sürat, çeviklik, kuvvet, denge. Kas haritasından egzersiz bul; yaşa uygun doz gör.', `${EXERCISES.length} egzersiz`],
              ['/beslenme/', 'leaf', 'Beslenme ve toparlanma', 'Yaşa göre rehber: maç günü çizelgesi, su takibi, uyku, öğün planı ve alternatifler.', 'Genel bilgi'],
              ['/analiz/oyuncular/', 'user', 'Oyuncu analizi', 'Oyun tarzı, topsuz hareket ve kendi oyununa taşıyacağın dersler.', `${PLAYERS.length} oyuncu`],
              ['/videolar/', 'play', 'Video kütüphanesi', 'Konu, pozisyon ve seviyeye göre doğrulanmış eğitim videoları; Türkçe özetlerle.', `${VIDEOS.length} video`],
              ['/profil/', 'lock', 'Panelim ve verilerim', 'Profilini düzenle, yedek al, kaynakları gör. Verilerin nerede durduğu açıkça yazılı.', 'Yedek al'],
            ].map(([href, icon, t, d, meta], i) => (
              <li key={href}>
                <Reveal delay={i * 60} variant="fade">
                  <Link href={href} className="index-list__row nudge-group">
                    <span className="index-list__i num">{idx(i + 1)}</span>
                    <span className="index-list__icon"><Icon name={icon} /></span>
                    <span className="index-list__main">
                      <span className="index-list__t">{t}</span>
                      <span className="index-list__d">{d}</span>
                    </span>
                    <span className="index-list__meta mono">{meta}</span>
                    <span className="index-list__go nudge"><Icon name="arrow" /></span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 10 · Pozisyonlar ──────────────────────────────────── */}
      <section className="band band--deep pos" aria-labelledby="pos-h">
        <div className="container">
          <div className="section-title">
            <Reveal variant="heading">
              <p className="eyebrow">08 · Pozisyonlar</p>
              <h2 id="pos-h" className="h2">
                Her pozisyon <em>farklı</em> düşünür.
              </h2>
            </Reveal>
            <Link href="/pozisyonlar/" className="btn btn--ghost btn--sm">Pozisyonunu seç <Icon name="arrow" /></Link>
          </div>
          <ul className="pos-strip">
            {POSITION_PROFILES.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={(i % 4) * 60} variant="fade">
                  <Link href={`/pozisyonlar/${p.id}/`} className="pos-strip__item">
                    <span className="pos-strip__i num" aria-hidden="true">{idx(i + 1)}</span>
                    <span className="pos-strip__name">{p.name}</span>
                    <span className="pos-strip__tag">{p.tagline}</span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 11 · Dürüstlük ────────────────────────────────────── */}
      <section className="band honest-band" aria-labelledby="honest-h">
        <div className="container honest">
          <Reveal variant="heading">
            <p className="eyebrow">Bilmen gerekenler</p>
            <h2 id="honest-h" className="h2 honest__title">
              Ne var, ne yok, <em>açıkça.</em>
            </h2>
          </Reveal>
          <ul className="honest__list">
            {[
              ['Veriler bu tarayıcıda.', 'Hesap sistemi yok; programın ve ilerlemen yalnızca bu cihazda saklanır. Panelim sayfasından yedek alabilirsin.'],
              ['Eğitim amaçlı.', 'İçerik tıbbi tavsiye ya da bireysel diyet programı değildir. Çocuk ve ergenler için doz ve egzersiz seçimi yaşa göre sınırlandırılır.'],
              ['Videoların varlığı doğrulanır, içeriği değerlendirilmez.', 'Her video YouTube’un resmî bağlantısıyla gerçekten var ve gömülebilir olduğu için eklenir; tek tek izlenip puanlanmamıştır. Türkçe özetler başlığa dayanır, çeviri değildir; İngilizce videolarda Türkçe altyazı garanti edilmez.'],
            ].map(([t, d], i) => (
              <li key={t}>
                <Reveal delay={i * 100}>
                  <strong>{t}</strong>
                  <span className="honest__d">{d}</span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 12 · Kapanış çağrısı ──────────────────────────────── */}
      <section className="band band--volt cta" aria-labelledby="cta-h">
        <div className="container cta__inner">
          <Reveal variant="heading">
            <h2 id="cta-h" className="cta__title">
              Bugün <em>başla.</em>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="cta__lead">İlk tekniğini seç, ilk antrenmanını kur. Hesap açmana gerek yok.</p>
            <div className="cta__btns">
              <Link href="/teknikler/" className="btn btn--dark btn--lg">Tekniklere göz at <Icon name="arrow" /></Link>
              <Link href="/program/" className="btn btn--outline-dark btn--lg">Programını oluştur</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
