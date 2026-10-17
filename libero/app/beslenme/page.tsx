import type { Metadata } from 'next';
import Link from 'next/link';
import { MEALS, TIMELINE, YOUTH_RULES } from '@/data/nutrition';
import {
  RAMADAN_POINTS,
  RED_FLAGS_EATING,
  RED_FLAGS_ENERGY,
  REVIEW_ITEMS,
  SECTIONS,
  SLEEP_ROWS,
  SOURCE_CHECK,
  SUPPLEMENT_ROWS,
  TOURNAMENT_BAG,
  TOURNAMENT_POINTS,
} from '@/data/nutrition-guide';
import { assertNutritionGuide } from '@/data/nutrition-validate';
import { SOURCES } from '@/data/sources';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';
import { AlternativeFinder, MealFinder } from '@/components/NutritionTools';
import { GuideSection, PlateModel, Rv } from '@/components/NutritionBits';
import { NutritionNav } from '@/components/NutritionNav';
import { MatchTimelineBuilder, UrineCard, WaterTracker } from '@/components/NutritionTrackers';
import { AgeNote, AgeSelector, DayPlans, SleepTable, WeeklyPlanner } from '@/components/NutritionPlanner';

// Veri bozuksa derleme burada durur (çocuk içeriğinde kalori/gram hedefi, bilinmeyen kaynak, yanlış öğün dilimi…)
assertNutritionGuide();

export const metadata: Metadata = {
  title: 'Futbolcu beslenmesi ve toparlanma rehberi',
  description:
    'Yaşa göre futbolcu beslenmesi: temel ilkeler, antrenman ve maç günü, sıvı ve idrar rengi, uyku, dinlenme, takviyeler, örnek öğünler, su takibi ve maç günü çizelgesi. Kaynaklı genel bilgi; kişisel diyetisyen değerlendirmesi değildir.',
};

const PILLARS: { t: string; icon: 'bolt' | 'leaf' | 'dumbbell' | 'heart' | 'target' | 'layers'; d: string; rv?: string }[] = [
  { t: 'Enerji dengesi', icon: 'bolt', d: 'Büyüyen ve her gün hareket eden bir sporcunun vücudu yakıta ihtiyaç duyar. Antrenman yükü arttıkça yeterince yemek de gerekir; yetersiz yeme yorgunluğa, sakatlanmaya ve gelişim sorunlarına yol açabilir (bkz. Uyarı işaretleri). Çocuk ve ergenlerde kalori saymak, kısıtlamak ya da kilo vermeye çalışmak yerine düzenli ve doyurucu öğünler hedeflenir.' },
  { t: 'Karbonhidrat', icon: 'leaf', d: 'Antrenman ve maçın ana yakıtı: pilav, bulgur, makarna, ekmek, patates, yulaf ve meyve. Yük arttıkça tabaktaki payı büyür, dinlenme gününde küçülür; ergen sporcularda yeme düzeni günlük egzersiz yüküne göre ayarlanır (SDA).' },
  { t: 'Protein', icon: 'dumbbell', d: 'Kas ve doku onarımı ile büyüme için gerekir: tavuk, balık, yumurta, et, mercimek, nohut, kuru fasulye, süt, yoğurt, lor. Tek seferde çok değil, gün içine yayılmış öğünlerle alınır (SDA). TÜBER’e göre gereksinim toz ya da amino asit takviyesi olmadan da karşılanabilir.' },
  { t: 'Yağ', icon: 'heart', d: 'Zeytinyağı, ceviz, fındık, avokado ve balık yararlı yağ kaynaklarıdır; enerji ve yağda çözünen vitaminler için gerekir. Maçtan hemen önce kızartma ve çok yağlı yiyecekler mideyi yorabilir.', rv: 'zamanlama' },
  { t: 'Mikro besinler', icon: 'target', d: 'Gençlerde kalsiyum, D vitamini ve demire özellikle dikkat edilir (SDA). Kalsiyum için süt, yoğurt, peynir; demir için kırmızı et, yumurta, baklagiller ve yeşil yapraklılar, C vitaminli yiyeceklerle birlikte. Eksiklikten şüphelenirsen kendi başına takviye başlatma; hekime git.' },
  { t: 'Beş besin grubu', icon: 'layers', d: 'TÜBER her öğünde beş gruptan birer besin önerir: süt-yoğurt; et-tavuk-balık-yumurta-baklagil-yağlı tohum; sebze; meyve; ekmek-tahıl. WHO serbest şekerin yaşam boyu sınırlı tutulmasını önerir; tuz da ölçülü olmalıdır.' },
];

const SLEEP_CARDS: { t: string; d: string; rv?: string }[] = [
  { t: 'Ekran ve uyku', d: 'AAP, okul çağı çocuk ve ergenlerde medya kullanımının riskleri arasında uyku ve kilo üzerindeki olumsuz etkileri sayar ve aile–hekim işbirliğiyle bir “Aile Medya Kullanım Planı” önerir. Pratikte yatmadan önce ekranı bırakmak ve telefonu yatak odasından uzak tutmak yardımcı olur.', rv: 'uyku-genel' },
  { t: 'Kafein', d: 'Enerji içeceklerindeki kafein ve uyarıcıların çocuk ve ergen beslenmesinde yeri yoktur (AAP). Çay ve kola da kafein içerebilir; bu içecekleri gece geç saatte içmemek uykuyu korumaya yardımcı olabilir. Yetişkin sporcular için de geç saatlerde kafeinden kaçınmak uykuyu korumanın bir yoludur.', rv: 'uyku-genel' },
  { t: 'Kısa uyku', d: 'Düzenli olarak önerilenden az uyumak dikkat, davranış ve öğrenme sorunlarıyla ilişkilidir (AASM). Elit sporcularda 7 saatten kısa uyku sık görülür; genel nüfus çalışmaları 7 saatten kısa uykuyu solunum yolu enfeksiyonuna yatkınlıkla ilişkilendirir (Walsh ve ark.). Uyku sorunu sürüyorsa bir yetişkine ve hekime söyle.' },
  { t: 'Gündüz şekerlemesi', d: 'Gün içi kısa uyku (şekerleme) genellikle gece uykusunun yerini tutmaz; geç saatte uzun uyumak gece uykusunu bozabilir. Gece uykusu önceliklidir. Şekerlemenin yararı konusunda araştırma gerektiği belirtilir (Walsh ve ark.).', rv: 'uyku-genel' },
];

export default function Page() {
  const src = SOURCES.filter((s) => s.topic === 'beslenme');
  const once3 = MEALS.filter((m) => m.when.includes('once-3sa')).slice(0, 6);
  const once1 = MEALS.filter((m) => m.when.includes('once-hafif')).slice(0, 6);
  return (
    <>
      <PageHead
        eyebrow="Beslenme ve toparlanma rehberi"
        title={
          <>
            Futbolcu <em>beslenmesi</em> ve toparlanma rehberi
          </>
        }
        lead="Antrenman ve maç günü ne yenir, ne zaman içilir, nasıl dinlenilir? Yaşına göre, kaynaklarıyla ve kullanabileceğin araçlarla: su takibi, maç günü çizelgesi, haftalık plan."
        wide
      />

      <section className="section section--tight gtop">
        <div className="container">
          <div className="gbanner" role="note" aria-label="Önemli uyarı" data-reveal>
            <Icon name="warn" />
            <div>
              <p className="gbanner__t">Genel bilgilendirme; kişisel diyetisyen değerlendirmesi değildir.</p>
              <p>
                <strong>Platformda diyetisyen hizmeti yoktur.</strong> Bu sayfa bir hekim ya da diyetisyenle görüşmenin yerini tutmaz. Sağlık sorunu, alerji, kilo ya da vücut görünümüyle ilgili kaygı ya da çocuk/ergen sporcu için özel bir plan gerekiyorsa bir hekime ve diyetisyene danışın.
              </p>
              <p className="gbanner__s">
                Bu sayfanın içeriği henüz bir spor diyetisyeni, çocuk sağlığı uzmanı ya da spor hekimi tarafından incelenmedi. En çok dikkat isteyen maddeler <Rv id="porsiyon" /> rozetiyle işaretlidir ve <a href="#uzman">listede</a> açıklanmıştır. Her bölümün sonunda dayandığı kaynaklar bulunur.
              </p>
            </div>
          </div>
          <AgeSelector />
          <nav className="gquick np" aria-label="Hızlı bağlantılar">
            <a className="btn btn--ghost btn--sm" href="#mac-gunu"><Icon name="clock" /> Maç günü çizelgesi</a>
            <a className="btn btn--ghost btn--sm" href="#sivi"><Icon name="target" /> Su takibi</a>
            <a className="btn btn--ghost btn--sm" href="#planlayici"><Icon name="calendar" /> Haftalık plan</a>
            <a className="btn btn--ghost btn--sm gquick__warn" href="#uyari"><Icon name="flag" /> Uyarı işaretleri</a>
          </nav>
        </div>
      </section>

      <div className="container nutri">
        <NutritionNav items={SECTIONS.map(({ id, no, nav }) => ({ id, no, nav }))} />
        <div className="nutri__main">
          {/* 01 */}
          <GuideSection id="temel-ilkeler">
            <AgeNote topic="temel" />
            <div className="pillars">
              {PILLARS.map((p) => (
                <article key={p.t} className="pillar card card--pad card--hover" data-reveal>
                  <span className="pillar__ic"><Icon name={p.icon} /></span>
                  <h3 className="h3">{p.t}</h3>
                  <p>{p.d}</p>
                  {p.rv && <Rv id={p.rv} />}
                </article>
              ))}
            </div>
            <div className="note" data-reveal>
              <Icon name="info" />
              <p>
                <strong>Öğün düzeni.</strong> Öğün atlamak, çocuk ve ergenlerde en sık görülen olumsuz beslenme alışkanlıklarından biridir ve en çok kahvaltı atlanır (TÜBER). Üç ana öğün ve gerektiğinde ara öğünle ilerlemek enerjiyi gün boyu dengeler.
              </p>
            </div>
            <h3 className="h3 gsub" data-reveal>Tabak modeli: yüke göre değişir</h3>
            <p className="muted gsub__p">
              TÜBER’in beş besin grubundan oluşan tabağı ve “her öğünde her gruptan bir besin” ilkesi temel alınır. Aşağıdaki çizimler dilimlerin yüke göre nasıl büyüyüp küçüldüğünü gösterir; <strong>sayısal bir hedef değil</strong>, Libero’nun örnek çizimidir. <Rv id="tabak-oranlari" />
            </p>
            <PlateModel />
          </GuideSection>

          {/* 02 */}
          <GuideSection id="oncesi">
            <AgeNote topic="oncesi" />
            <div className="grid cols-2 gcols">
              {TIMELINE.slice(0, 2).map((t) => (
                <div key={t.t} className="card card--pad card--hover" data-reveal>
                  <h3 className="h3">{t.t}</h3>
                  <ul className="ticks">{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
            <div className="eg card card--pad card--flat" data-reveal>
              <div>
                <p className="eyebrow">Örnekler · 3–4 saat önce</p>
                <ul className="chips">{once3.map((m) => <li key={m.id} className="tag">{m.name}</li>)}</ul>
              </div>
              <div>
                <p className="eyebrow">Örnekler · 30–60 dk önce (hafif)</p>
                <ul className="chips">{once1.map((m) => <li key={m.id} className="tag">{m.name}</li>)}</ul>
              </div>
              <p className="field__hint">Hepsi için <a href="#ogunler">filtreli öğün önerilerine</a> bak. <Rv id="zamanlama" /></p>
            </div>
          </GuideSection>

          {/* 03 */}
          <GuideSection id="sirasinda">
            <AgeNote topic="sirasinda" />
            <div className="grid cols-3 gcols">
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Su yeterli</h3>
                <p>Çoğu antrenmanda su yeterlidir; mola verildikçe küçük yudumlarla iç. Susamayı beklemek yerine düzenli ol; ama aşırı içmek de risklidir (NATA).</p>
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Sıcakta</h3>
                <p>Yeterli sıvı alındığında gençler sıcakta yetişkinlerden daha kötü ısı düzenlemesi yapmaz. Riski artıranlar: yetersiz sıvı, aşırı efor, ardışık antrenman ya da maçlar arasında yetersiz toparlanma ve ısı tutan kıyafet (AAP). Bunlar değiştirilebilir: mola, gölge, hafif kıyafet, sıvı. <strong>Sıcakta baş dönmesi, bulantı, aşırı halsizlik ya da kafa karışıklığı hissedersen oyunu bırak, gölgeye geç ve hemen bir yetişkine söyle.</strong> <Rv id="isi-uyari" /></p>
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">İçecekler</h3>
                <p>Spor içeceği ile enerji içeceği aynı şey değildir. Enerji içeceklerindeki kafein ve uyarıcıların çocuk ve ergen beslenmesinde yeri yoktur (AAP). Yetişkin sporcularda spor içeceği, TÜBER’e göre, 1 saatten uzun etkinliklerde gerekebilir; çocuk ve ergenlerde bunun ne zaman uygun olduğu AAP raporunun kapsamı dışındadır, karar antrenör, hekim ya da diyetisyene aittir.</p>
              </div>
            </div>
            <div className="card card--pad card--flat" data-reveal>
              <h3 className="h3">Antrenman sırasında</h3>
              <ul className="ticks">{TIMELINE[2].items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          </GuideSection>

          {/* 04 */}
          <GuideSection id="sonrasi">
            <AgeNote topic="sonrasi" />
            <div className="grid cols-2 gcols">
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">{TIMELINE[3].t}</h3>
                <ul className="ticks">{TIMELINE[3].items.map((i) => <li key={i}>{i}</li>)}</ul>
                <Rv id="zamanlama" />
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Abartmadan bak</h3>
                <ul className="ticks">
                  <li>Ergen sporcular için kaynaklar yemeklerin gün boyu düzenli dağılımını, özellikle antrenmandan hemen sonraki dönemde kaliteli karbonhidrat ve protein alınmasını vurgular (SDA).</li>
                  <li>Bunun için özel ürün gerekmez: TÜBER’e göre sporcular için mucizevi bir besin ya da takviye yoktur; iyi dengelenmiş beslenme ve yeterli sıvı yeterlidir. Süt, toparlanma döneminde iyi bir seçimdir.</li>
                  <li>Dakikası dakikasına bir “pencere” aramaya gerek yoktur; günlük toplam beslenme ve düzen daha önemlidir. Aynı gün ikinci bir antrenman ya da maç varsa acele etmek mantıklıdır. <Rv id="toparlanma-yorum" /></li>
                </ul>
              </div>
            </div>
          </GuideSection>

          {/* 05 */}
          <GuideSection id="sivi">
            <AgeNote topic="sivi" />
            <div className="grid cols-3 gcols">
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Önce, sırada, sonra</h3>
                <ul className="ticks">
                  <li>Önce: etkinlikten birkaç saat önce, normal öğünlere ek olarak başla; amaç sıvı dengesi yerinde başlamak (ACSM).</li>
                  <li>Sırada: aşırı sıvı kaybını önle ama aşırı da içme (ACSM, NATA).</li>
                  <li>Sonra: kaybı yerine koy; ne kadar acele edileceği eksiğe bağlıdır (ACSM).</li>
                </ul>
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Susama yetmez</h3>
                <p>TÜBER’e göre susama, vücut ağırlığının yaklaşık %2’si kaybedilene kadar hissedilmeyebilir; bu yüzden gün boyu düzenli içmek ve idrar rengini izlemek önerilir. Kafeinli ve enerji içecekleri su yerine geçmez.</p>
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Elektrolit</h3>
                <p>Belirli durumlarda, özellikle 1 saatten uzun etkinliklerde, karbonhidrat ve elektrolit içeren içecek sudan daha faydalı olabilir (ACSM, TÜBER). Çocuk ve ergenlerde sık ya da fazla şekerli spor içeceği fazla kilo riskini artırabilir (AAP); bu günlük bir içecek değildir, ihtiyaç olup olmadığına antrenör, hekim ya da diyetisyen karar verir.</p>
              </div>
            </div>
            <div className="grid cols-2 gcols gtools">
              <UrineCard />
              <div className="card card--pad card--flat adultbox" data-reveal>
                <p className="eyebrow">18 yaş ve üstü için örnek değerler</p>
                <h3 className="h3">TÜBER’in sporcu bölümündeki değerler</h3>
                <ul className="ticks">
                  <li>Egzersizden yaklaşık 4 saat önce yaklaşık 500 mL sıvı.</li>
                  <li>Egzersiz sırasında 15–20 dakikada bir 150–350 mL su ve/veya spor içeceği.</li>
                  <li>Egzersiz sonrası kaybedilen her yarım kg için 450–675 mL (yaklaşık 2–3 su bardağı) sıvı.</li>
                  <li>Ter oranı, egzersizden önce ve sonra tartılarak tahmin edilir; kişiden kişiye çok değişir.</li>
                </ul>
                <p className="field__hint">TÜBER bu değerleri yaş ayrımı yapmadan sporcular için verir; çocuk ve ergenler için ayrıca doğrulanmadığından yalnızca 18 yaş ve üstüne gösterilir.</p>
                <p className="field__hint"><strong>Çocuk ve ergenler için sayısal hedef verilmez.</strong> İdrar rengi, susama ve antrenör/hekim önerisi birlikte izlenir. <Rv id="sivi-sayilari" /></p>
              </div>
            </div>
            <WaterTracker />
          </GuideSection>

          {/* 06 */}
          <GuideSection id="uyku">
            <AgeNote topic="uyku" />
            <SleepTable rows={SLEEP_ROWS} />
            <div className="grid cols-2 gcols">
              {SLEEP_CARDS.map((c) => (
                <div key={c.t} className="card card--pad card--hover" data-reveal>
                  <h3 className="h3">{c.t}</h3>
                  <p>{c.d}</p>
                  {c.rv && <Rv id={c.rv} />}
                </div>
              ))}
            </div>
          </GuideSection>

          {/* 07 */}
          <GuideSection id="dinlenme">
            <div className="grid cols-2 gcols">
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Dinlenme günü</h3>
                <p>Dinlenme günü, yemeyi ve hareketi bırakma günü değildir: öğünler aynı düzende sürer, hafif yürüyüş ya da oyun iyi gelir; yoğun antrenman yapılmaz.</p>
                <Rv id="toparlanma-genel" />
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Yoğun fikstür</h3>
                <p>Ardışık maç ve antrenmanlar arasında yetersiz toparlanma, sıcakta ısı sorunlarının riskini artırır (AAP). Arka arkaya yüklenme dönemlerinde yeme–içme ve uykuyu öne al, yorgunluğu antrenörüne söyle.</p>
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Aktif toparlanma</h3>
                <p>Maç ya da yoğun antrenmandan sonraki gün hafif yürüyüş, bisiklet, esneme ya da oyun gibi düşük şiddetli hareket tercih edilebilir. Ağrı varsa zorlama.</p>
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Aşırı antrenman belirtileri</h3>
                <p>Başarılı antrenman, yük ile toparlanma dengesini gerektirir; denge bozulursa performans düşebilir (ECSS/ACSM). Aşağıdakilerden birkaçı birlikte sürüyorsa antrenörüne ve hekime söyle:</p>
                <ul className="ticks ticks--warn">
                  <li>Dinlenmeye rağmen geçmeyen yorgunluk ve düşen performans</li>
                  <li>Uyku bozukluğu, isteksizlik ya da ruh hali değişimi</li>
                  <li>Sık hastalanma ve uzun süren ağrılar</li>
                </ul>
                <Rv id="belirtiler" />
              </div>
            </div>
          </GuideSection>

          {/* 08 */}
          <GuideSection id="uyari">
            <div className="redflag" role="region" aria-label="Uyarı işaretleri" data-reveal>
              <div className="redflag__h">
                <Icon name="warn" />
                <div>
                  <p className="redflag__t">Bu işaretlerden birkaçını fark ediyorsan kendi başına diyet yapma; bir yetişkine söyle ve hekime ve diyetisyene başvur.</p>
                  <p>
                    RED-S (REDs), egzersiz harcamasına göre yetersiz enerji alımı nedeniyle metabolizma, adet düzeni, kemik sağlığı, bağışıklık ve kalp-damar sağlığı gibi birçok sistemin etkilenmesidir; kız ve erkek sporcuları etkiler ve ruh sağlığıyla ilişkilidir (IOC). Bu sayfa tanı koymaz; işaretler başka nedenlerden de olabilir.
                  </p>
                </div>
              </div>
              <div className="grid cols-2 gcols">
                <div>
                  <h3 className="h3">Yeme ve vücut algısı</h3>
                  <ul className="ticks ticks--warn">{RED_FLAGS_EATING.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
                <div>
                  <h3 className="h3">Yetersiz enerjiyle uyumlu olabilecek işaretler</h3>
                  <ul className="ticks ticks--warn">{RED_FLAGS_ENERGY.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              </div>
              <p className="redflag__f">
                <strong>Ne yapmalı?</strong> Güvendiğin bir yetişkine (aile, antrenör, okul) söyle; aile hekimi, çocuk sağlığı ya da spor hekimi ve diyetisyenle görüş. Bayılma, göğüs ağrısı ya da nefes darlığında 112’yi ara. Kilo ya da vücut görünümüyle ilgili kaygıyı bu sayfadaki bilgilerle çözmeye çalışma. <Rv id="belirtiler" />
              </p>
            </div>
          </GuideSection>

          {/* 09 */}
          <GuideSection id="mac-gunu">
            <MatchTimelineBuilder />
          </GuideSection>

          {/* 10 */}
          <GuideSection id="turnuva">
            <div className="grid cols-2 gcols">
              {TOURNAMENT_POINTS.map((p) => (
                <div key={p.t} className="card card--pad card--hover" data-reveal>
                  <h3 className="h3">{p.t}</h3>
                  <p>{p.d}</p>
                  {p.review && <Rv id={p.review} />}
                </div>
              ))}
              <div className="card card--pad card--flat bag" data-reveal>
                <h3 className="h3">Turnuva çantası</h3>
                <ul className="chips">{TOURNAMENT_BAG.map((b) => <li key={b} className="tag">{b}</li>)}</ul>
                <p className="field__hint"><Rv id="turnuva" /></p>
              </div>
            </div>
            <p><a className="btn btn--ghost btn--sm np" href="#mac-gunu">İki maçlı çizelge oluştur</a></p>
          </GuideSection>

          {/* 11 */}
          <GuideSection id="takviye">
            <AgeNote topic="takviye" />
            <div className="tablewrap" data-reveal>
              <table className="table suptable">
                <caption className="visually-hidden">Takviyeler ve yaş gruplarına göre yaklaşım</caption>
                <thead>
                  <tr><th scope="col">Ürün</th><th scope="col">Çocuk ve ergen (≤17)</th><th scope="col">18 yaş ve üstü</th></tr>
                </thead>
                <tbody>
                  {SUPPLEMENT_ROWS.map((r) => (
                    <tr key={r.name}>
                      <th scope="row">{r.name}</th>
                      <td>{r.minor}</td>
                      <td>{r.adult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="field__hint" data-reveal>
              Çocuk ve ergen sütunu kanıta dayalı bir çocuk önerisi değil, temkinli bir çizgidir: AAP yalnızca enerji içeceklerindeki kafein ve uyarıcıların yerinin olmadığını söyler, SDA ihtiyaçların takviye yerine temel besinlerle karşılanmasını önerir. IOC metni yetişkin yüksek performanslı sporcular içindir ve çocuklar için ayrı bir öneri vermez; kreatin ve protein tozu için çocuklara özgü bir kaynak okunmadı. Bu tablo ürün tavsiyesi değildir.
            </p>
            <div className="grid cols-2 gcols">
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Neden temkinli?</h3>
                <ul className="ticks ticks--warn">
                  <li>Takviye kararından önce tam bir beslenme değerlendirmesi yapılmalıdır; kanıtı olan ürün sayısı azdır (IOC).</li>
                  <li>Ürünler içeriği bildirilmemiş yasaklı madde taşıyabilir ve istemeden pozitif teste yol açabilir (IOC).</li>
                  <li>Gelişmekte olan sporcuya takviye önermek, takviyelerin performanstaki rolünü abartır (SDA).</li>
                </ul>
                <Rv id="takviye" />
              </div>
              <div className="card card--pad card--hover" data-reveal>
                <h3 className="h3">Çocuk ve ergenlerde güvenlik</h3>
                <ul className="ticks ticks--warn">{YOUTH_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            </div>
          </GuideSection>

          {/* 12 */}
          <GuideSection id="ramazan">
            <div className="grid cols-2 gcols">
              {RAMADAN_POINTS.map((p, i) => (
                <div key={p.t} className={`card card--pad card--hover${i === 4 ? ' ram__stop' : ''}`} data-reveal>
                  <h3 className="h3">{p.t}</h3>
                  <p>{p.d}</p>
                  {p.review && <Rv id={p.review} />}
                </div>
              ))}
            </div>
            <p className="note note--warn" data-reveal>
              <Icon name="warn" />
              <span><strong>Hekime danışın.</strong> Oruç tutup tutmamak ve sporun nasıl yürütüleceği kişiye göre değişir; özellikle çocuk, ergen ve kronik sağlık sorunu olanlar için önce hekim görüşü alın. <Rv id="ramazan" /></span>
            </p>
          </GuideSection>

          {/* 13 */}
          <GuideSection id="alerji">
            <div className="gtool" id="ogunler">
              <h3 className="h3 gsub">Ne yesem? Filtreleyin.</h3>
              <MealFinder />
            </div>
            <div className="gtool" id="alternatif">
              <h3 className="h3 gsub">Sevmiyorum, bulamıyorum, yiyemiyorum: ne yerim?</h3>
              <AlternativeFinder />
            </div>
            <p className="field__hint">Süt ürünlerini kendi başına bırakma: kalsiyum kaynağını nasıl koruyacağını hekim ya da diyetisyenle konuş. Etiketler sade tarife göredir: pilavda şehriye, hazır ürünlerde katkı, ortak üretim ya da çapraz bulaşma olabilir; ambalaj etiketini her seferinde oku. Ciddi alerjide ve çölyakta hekimin planı geçerlidir. <Rv id="alerjen" /></p>
          </GuideSection>

          {/* 14 */}
          <GuideSection id="menuler">
            <DayPlans />
          </GuideSection>

          {/* 15 */}
          <GuideSection id="planlayici">
            <WeeklyPlanner />
          </GuideSection>

          {/* 16 */}
          <GuideSection id="uzman" noCite>
            <div className="note note--warn" data-reveal>
              <Icon name="warn" />
              <p>
                <strong>Henüz uzman incelemesinden geçmedi.</strong> Aşağıdaki maddeler kaynaklara dayandırılmaya çalışıldı; ancak bir spor diyetisyeni, çocuk sağlığı uzmanı ya da spor hekimi tarafından gözden geçirilmedi. “Kaynak doğrulanamadı” etiketi, maddenin genel pratiğe ya da yoruma dayandığını gösterir.
              </p>
            </div>
            <ol className="rvlist">
              {REVIEW_ITEMS.map((r, i) => (
                <li key={r.id} id={`uzman-${r.id}`} className="rvlist__i card card--pad" data-reveal>
                  <span className="rvlist__n mono">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="eyebrow">{r.area}</p>
                    <h3 className="rvlist__t">{r.what}</h3>
                    <p className="muted">{r.why}</p>
                    <p className="rvlist__f mono">
                      İncelemesi gereken: {r.reviewer}
                      {r.unverified && <span className="rvlist__u"> · kaynak doğrulanamadı</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </GuideSection>

          {/* 17 */}
          <GuideSection id="kaynaklar" noCite>
            <ul className="srcs">
              {src.map((s) => (
                <li key={s.id} id={`kaynak-${s.id}`} className="srcs__i">
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title} <Icon name="external" style={{ width: 13, height: 13 }} />
                  </a>
                  <span className="muted">{s.org}</span>
                  <span className="muted srcs__n">{s.note}</span>
                  {SOURCE_CHECK[s.id] && <span className="mono srcs__c">Bu rehberde: {SOURCE_CHECK[s.id]}</span>}
                </li>
              ))}
            </ul>
            <p className="field__hint">
              DOI bağlantıları ve sayfa adresleri Crossref, Europe PMC ve doğrudan istekle denetlendi. Bazı yayıncı siteleri otomatik isteklere kapalıdır; bu durumda özet metni Europe PMC üzerinden okundu ve yalnızca özette yazan bilgiler aktarıldı. Daha fazlası: <Link href="/profil/#kaynaklar" className="btn--quiet" style={{ border: 0 }}>tüm kaynaklar</Link>.
            </p>
          </GuideSection>
        </div>
      </div>
    </>
  );
}
