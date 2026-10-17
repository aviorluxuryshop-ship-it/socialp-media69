// Beslenme denetimi: bağımsız sağlık/güvenlik incelemesinde bulunan kusurların kalıcı testleri (tarayıcısız).
// Gece yarısı ve geç saat maçları, ikinci maç doğrulaması, olası alerjenler, çocuklara uygun olmayan alternatifler,
// inceleme listesinin dürüstlüğü ve gün sınırı hesapları.
import fs from 'node:fs';
import path from 'node:path';

export const include = ['lib/nutrition.ts', 'data/nutrition.ts', 'data/nutrition-guide.ts', 'data/nutrition-validate.ts', 'data/sources.ts'];

export default async ({ ok, test, load, root }) => {
  const nut = await load('lib/nutrition.js');
  const food = await load('data/nutrition.js');
  const guide = await load('data/nutrition-guide.js');
  const val = await load('data/nutrition-validate.js');
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const titles = (t) => t.map((s) => `${s.label} ${s.title}`).join(' | ');
  const sortedOk = (t) => {
    const timed = t.filter((s) => s.abs !== null);
    for (let i = 1; i < timed.length; i++) if (timed[i].abs < timed[i - 1].abs) return false;
    return true;
  };

  await test('Beslenme denetimi: 00:30 gibi gece maçında "önceki akşam", "erken yat" ve "kahvaltı" çıkmaz; sıra ve kapanış doğrudur', async () => {
    for (const band of ['u11', 'u14', 'u17', 'a18']) {
      const t = nut.buildMatchTimeline({ kickoff: '00:30', band });
      ok(t && t.length >= 8, `${band}: çizelge yok`);
      ok(sortedOk(t), `${band}: adımlar sıralı değil: ${titles(t)}`);
      ok(!t.some((s) => /Hafif kahvaltı|Erken yat|Tanıdık, dengeli akşam yemeği/.test(s.title)), `${band}: gece maçında gündüz adımı var: ${titles(t)}`);
      ok(!t.some((s) => s.label === 'Önceki akşam'), `${band}: gece maçında "Önceki akşam" etiketi var`);
      ok(t.some((s) => s.label === 'Gün boyu'), `${band}: gün boyu adımı yok`);
      const main = t.find((s) => /^Ana öğün$/.test(s.title) && s.kind === 'yemek');
      ok(main && main.label === '21:30' && main.abs === -150, `${band}: maç öncesi ana öğün 21:30 değil (${main && main.label})`);
      ok(t.some((s) => s.kind === 'mac' && s.label === '00:30') && t.some((s) => /Maç biter/.test(s.title) && s.label === '01:40'), `${band}: maç saatleri yanlış`);
      ok(!t.some((s) => /^Ana öğün$/.test(s.title) && s.abs > 100), `${band}: gece geç saatte (maçtan sonra) büyük ana öğün önerilmiş`);
      ok(t.some((s) => /Geç saat/.test(s.title)), `${band}: geç saat uyarı adımı yok`);
      const last = t[t.length - 1];
      ok(/Sakin ol ve uyu/.test(last.title) && last.abs >= t.filter((s) => s.abs !== null).reduce((m, s) => Math.max(m, s.abs), 0), `${band}: son adım uyku değil: ${last.title}`);
      for (const s of t) ok(s.at === null || (s.at >= 0 && s.at < 1440), `${band}: ${s.title}: gün içi dakika aralık dışı`);
    }
    // çocuk metni uykuyu korumayı söyler; kafein/enerji içeceği önermez
    const minor = nut.buildMatchTimeline({ kickoff: '00:30', band: 'u14' });
    ok(minor.some((s) => /uyku süreni korumaya/.test(s.detail)), 'çocuk gece maçı uyarısı uykuyu anmıyor');
    ok(!minor.some((s) => /\d+\s*mL/.test(s.detail)), 'çocuk gece çizelgesinde mL hedefi var');
  });

  await test('Beslenme denetimi: sabaha karşı ve gece yarısına yakın başlangıçlar da çökmez, saatler 00:00–23:59 aralığında kalır', async () => {
    for (const kickoff of ['00:00', '00:30', '01:15', '03:00', '05:59', '06:00', '08:59', '09:00', '12:00', '19:00', '20:00', '21:30', '22:00', '23:00', '23:59']) {
      for (const dur of [30, 70, 120]) {
        const t = nut.buildMatchTimeline({ kickoff, band: 'u14', duration: dur });
        ok(t && sortedOk(t), `${kickoff}/${dur}: çizelge yok ya da sırasız`);
        ok(t.every((s) => /^(\d\d:\d\d|Önceki akşam|Gün boyu)$/.test(s.label)), `${kickoff}/${dur}: geçersiz etiket: ${titles(t)}`);
        ok(t.every((s) => !s.label.includes('NaN')), `${kickoff}/${dur}: NaN`);
        const uyku = t.filter((s) => /^Sakin (ol ve uyu|akşam ve uyku)$/.test(s.title));
        ok(uyku.length === 1, `${kickoff}/${dur}: uyku adımı ${uyku.length} kez`);
        ok(t.indexOf(uyku[0]) === t.length - 1, `${kickoff}/${dur}: uyku adımı son değil`);
      }
    }
    // geç biten maç: ana öğün yok, geç saat adımı var
    const late = nut.buildMatchTimeline({ kickoff: '21:30', band: 'u17' });
    ok(!late.some((s) => /^Ana öğün$/.test(s.title) && s.abs > 21 * 60 + 30), '21:30 maçından sonra gece ana öğünü önerilmiş');
    ok(late.some((s) => /Geç saat/.test(s.title)) && /Sakin ol ve uyu/.test(late[late.length - 1].title), '21:30 maçı için sakin kapanış yok');
    // öğleden sonraki maç eskisi gibi: ana öğün maçtan 2 saat sonra, uyku 21:00
    const day = nut.buildMatchTimeline({ kickoff: '15:00', band: 'u14' });
    ok(day.some((s) => s.label === '18:10' && /Ana öğün/.test(s.title)), 'gündüz maçından sonra ana öğün 18:10 değil');
    ok(day.some((s) => s.label === '21:00' && /Sakin akşam ve uyku/.test(s.title)), 'gündüz maçı için 21:00 uyku adımı yok');
    ok(!day.some((s) => /Geç saat/.test(s.title)), 'gündüz maçında geç saat adımı var');
    // sabah maçı hâlâ hafif kahvaltı ve önceki akşam adımlarını taşır
    const am = nut.buildMatchTimeline({ kickoff: '07:30', band: 'u11' });
    ok(am[0].label === 'Önceki akşam' && am.some((s) => /Hafif kahvaltı/.test(s.title) && s.label === '05:30'), 'sabah maçı adımları bozulmuş');
    ok(nut.timeToMin('9:05') === 545 && nut.timeToMin('09:05:30') === 545 && nut.timeToMin('24:00') === null && nut.timeToMin('9.05') === null, 'saat ayrıştırma hatalı');
  });

  await test('Beslenme denetimi: ikinci maç saati hatalıysa sessizce yok sayılmaz, durum bildirilir; sıkışık aralıkta adımlar sırasızlaşmaz', async () => {
    const st = (o) => nut.secondMatchStatus({ kickoff: '15:00', duration: 70, ...o });
    ok(st({}).status === 'yok' && st({ second: undefined }).status === 'yok', 'ikinci maç yokken durum yok değil');
    ok(st({ second: '' }).status === 'gecersiz' && st({ second: '25:00' }).status === 'gecersiz', 'geçersiz ikinci saat bildirilmedi');
    ok(st({ second: '17:30' }).status === 'tamam' && st({ second: '17:30' }).gap === 80, 'normal ikinci maç tamam değil');
    ok(st({ second: '10:00' }).status === 'uzak', 'ilk maçtan önce başlayan ikinci maç bildirilmedi');
    ok(st({ second: '15:30' }).status === 'cakisiyor', 'çakışan ikinci maç bildirilmedi');
    ok(st({ second: '16:20' }).status === 'cakisiyor' && st({ second: '16:30' }).status === 'tamam', 'en az 20 dakika sınırı hatalı');
    ok(st({ second: '03:00' }).status === 'uzak' && st({ second: '03:00' }).gap >= nut.MAX_MATCH_GAP, '10 saatten uzak maç bildirilmedi');
    ok(st({ second: '00:30' }).status === 'tamam', 'gece yarısını aşan ikinci maç (80 dk ara) reddedildi');
    // yok sayılan ikinci maç çizelgeye girmez
    for (const second of ['10:00', '15:30', '', '25:00']) {
      const t = nut.buildMatchTimeline({ kickoff: '15:00', band: 'u14', second });
      ok(t && !t.some((s) => /İkinci maç/.test(s.title)), `${second}: geçersiz ikinci maç çizelgeye girdi`);
    }
    // sıkışık aralıklarda sıra bozulmaz, ısınma/atıştırmalık maç bitmeden çıkmaz
    for (const second of ['16:30', '16:35', '16:45', '17:00', '17:30', '18:30']) {
      const t = nut.buildMatchTimeline({ kickoff: '15:00', band: 'u14', second, duration: 70 });
      ok(sortedOk(t), `${second}: sırasız`);
      const end1 = t.find((s) => /^Maç biter$/.test(s.title)).abs;
      for (const s of t) if (/İsteğe bağlı hafif atıştırmalık|Isınma ve sıvı/.test(s.title) && s.abs !== null && s.abs > 15 * 60 + 70 - 600) ok(s.abs >= end1 + 10 || s.abs < 15 * 60, `${second}: ${s.title} birinci maç bitmeden`);
      ok(t.some((s) => /İkinci maç başlar/.test(s.title)), `${second}: ikinci maç yok`);
    }
    // ikinci maç gece geç biterse son öğün de sakin kapanıştır
    const l = nut.buildMatchTimeline({ kickoff: '19:00', band: 'u17', second: '21:00', duration: 60 });
    ok(l.some((s) => /Geç saat/.test(s.title)) && !l.some((s) => /^Ana öğün$/.test(s.title) && s.abs > 22 * 60), 'ikinci maçtan sonra gece ana öğünü önerilmiş');
  });

  await test('Beslenme denetimi: bitkisel süt olası alerjenleri, çocuklara spor içeceği alternatifi önerilmez, yetişkine önerilebilir', async () => {
    const opt = (o) => ({ avoid: [], vegetarian: false, vegan: false, cheap: false, exclude: [], forPre: false, forPost: false, ...o });
    const ids = (r) => r.map((x) => x.food.id);
    const dairy = food.FOOD_BY_ID['yogurt'];
    ok(ids(food.alternativesFor(dairy, opt({ avoid: ['sut'] }))).includes('bitkisel-sut') === true, 'yalnızca süt alerjisinde bitkisel süt önerilmedi');
    for (const a of ['soya', 'kuruyemis', 'gluten']) ok(!ids(food.alternativesFor(dairy, opt({ avoid: ['sut', a] }))).includes('bitkisel-sut'), `${a} kaçınılırken bitkisel süt (soya/badem/yulaf olabilir) önerildi`);
    ok(food.FOOD_BY_ID['bitkisel-sut'].mayContain.length >= 3 && /etiket/i.test(food.FOOD_BY_ID['bitkisel-sut'].note), 'bitkisel süt notu etiket uyarısı vermiyor');
    const water = food.FOOD_BY_ID['su'];
    ok(!ids(food.alternativesFor(water, opt({ minor: true }))).includes('izotonik'), 'çocuğa spor içeceği alternatif olarak önerildi');
    ok(ids(food.alternativesFor(water, opt({ minor: false }))).includes('izotonik'), 'yetişkine spor içeceği alternatifi hiç gösterilmiyor');
    ok(food.FOOD_BY_ID['izotonik'].adultOnly === true && /AAP/.test(food.FOOD_BY_ID['izotonik'].note) && !/Yalnızca uzun/.test(food.FOOD_BY_ID['izotonik'].note), 'spor içeceği notu çocuk uyarısı taşımıyor');
    ok(/şehriye/i.test(food.FOOD_BY_ID['pirinc'].note), 'pilav notu şehriye (gluten) uyarısı vermiyor');
    // mayContain olan hiçbir besin öğünde kullanılmaz (öğün etiketi yalnızca kesin alerjenleri bilir)
    for (const m of food.MEALS) for (const id of m.foods) ok(food.FOOD_BY_ID[id].mayContain.length === 0, `${m.id}: olası alerjenli ${id} öğünde, alerjen etiketi eksik kalır`);
  });

  await test('Beslenme denetimi: inceleme listesi dürüsttür (doğrulanamayanlar işaretli), çocuk takviye satırları rozetlidir, sıvı sayıları yetişkin dışına sızmaz', async () => {
    const by = guide.REVIEW_BY_ID;
    for (const id of ['belirtiler', 'takviye', 'isi-uyari', 'zamanlama', 'idrar-karti', 'su-takibi', 'turnuva', 'uyku-genel', 'toparlanma-genel']) ok(by[id] && by[id].unverified === true, `${id}: kaynak doğrulanamadı işareti yok`);
    ok(/3–4 saat/.test(by.zamanlama.why) && /TÜBER/.test(by.zamanlama.why), 'zamanlama maddesi TÜBER 3–4 saat bilgisini anmıyor');
    ok(/IOC/.test(by.takviye.why) && /çocuk/i.test(by.takviye.why) && /kaynak okunmadı/.test(by.takviye.why), 'takviye maddesi IOC/çocuk sınırını açıklamıyor');
    ok(!/yetişkin içindir/.test(by['sivi-sayilari'].why) && /yaş ayrımı yapılmamıştır/.test(by['sivi-sayilari'].why), 'sıvı maddesi TÜBER değerlerini yanlış "yetişkin" diye niteliyor');
    ok(/okul öncesi/.test(by.porsiyon.why), 'porsiyon maddesi TÜBER okul öncesi sınırını anmıyor');
    const page = read('app/beslenme/page.tsx');
    ok(!/İçeriğin bazı bölümleri henüz/.test(page) && /henüz bir spor diyetisyeni, çocuk sağlığı uzmanı ya da spor hekimi tarafından incelenmedi/.test(page), 'uyarı şeridi sayfanın bir kısmının incelendiğini ima ediyor');
    ok(/hiçbir bölümü henüz/.test(guide.SECTION_BY_ID.uzman.lead), 'uzman bölümü girişi dürüst değil');
    // çocuk yaş notlarında takviye "kullanılmaz" cümlelerinin rozeti var
    for (const b of ['u11', 'u14', 'u17']) ok(guide.AGE_NOTES.takviye[b].review === 'takviye', `takviye/${b}: rozet yok`);
    for (const b of ['u11', 'u14']) ok(guide.AGE_NOTES.uyku[b].review === 'uyku-genel', `uyku/${b}: alışkanlık önerisi rozetsiz`);
    // sayısal sıvı hedefi (mL) yalnızca 18+ notlarında ve yetişkin çizelge adımlarında geçer
    for (const [topic, notes] of Object.entries(guide.AGE_NOTES)) for (const b of ['u11', 'u14', 'u17']) ok(!/\d+\s*mL/.test(notes[b].text), `${topic}/${b}: çocuk notunda mL`);
    // spor içeceği/kafein cümleleri AAP kapsamını aşmaz: "kesinlikle" yalnızca enerji içeceği için
    ok(!/Spor içeceği günlük bir içecek değildir; enerji içeceği kesinlikle/.test(JSON.stringify(guide.AGE_NOTES)), 'AAP kapsamını aşan eski ifade duruyor');
    ok(/kapsamı dışında/.test(guide.SUPPLEMENT_ROWS.find((r) => /Spor/.test(r.name)).minor), 'spor içeceği satırı AAP kapsam sınırını anmıyor');
    // yetişkin sıvı sayıları TÜBER'e atfedilir ve "yetişkin sporcu değerleri" başlığı kalmamıştır
    ok(!/TÜBER’deki yetişkin sporcu değerleri/.test(page), 'TÜBER değerleri hâlâ "yetişkin" diye başlıklandırılmış');
    // doğrulayıcı hâlâ geçer
    ok(val.validateNutritionGuide().length === 0 && val.prescriptionsForMinors().length === 0, 'doğrulayıcı hata veriyor');
  });

  await test('Beslenme denetimi: su takibi gün sınırları (ay, yıl, artık yıl) ve gün sonu bardak sayısı', async () => {
    const keys = (end, n) => nut.lastDays(nut.normalizeWater({}), end, n).map((d) => d.key);
    ok(keys('2026-03-01', 3).join() === '2026-02-27,2026-02-28,2026-03-01', 'ay sınırı hatalı');
    ok(keys('2024-03-01', 3).join() === '2024-02-28,2024-02-29,2024-03-01', 'artık yıl hatalı');
    ok(keys('2026-01-01', 2).join() === '2025-12-31,2026-01-01', 'yıl sınırı hatalı');
    ok(keys('2026-03-29', 3).join() === '2026-03-27,2026-03-28,2026-03-29' && keys('2026-10-25', 3).join() === '2026-10-23,2026-10-24,2026-10-25', 'yaz/kış saati geçişi gün anahtarlarını bozdu');
    // gün anahtarı yerel tarihtir: yerel gece yarısından 1 dk önce ve sonra farklı gün
    ok(nut.dayKey(new Date(2026, 2, 10, 23, 59, 59)) === '2026-03-10' && nut.dayKey(new Date(2026, 2, 11, 0, 0, 1)) === '2026-03-11', 'gece yarısı gün sınırı hatalı');
    // gece yarısını aşan ekleme yeni güne yazılır, dünün sayısı kalır
    let w = nut.normalizeWater({});
    w = nut.addGlass(w, nut.dayKey(new Date(2026, 2, 10, 23, 59, 59)), 1, 1);
    w = nut.addGlass(w, nut.dayKey(new Date(2026, 2, 11, 0, 0, 1)), 1, 2);
    ok(nut.glassesOn(w, '2026-03-10') === 1 && nut.glassesOn(w, '2026-03-11') === 1, 'gece yarısı sonrası bardak eski güne yazıldı');
    // bozuk günler: tarih biçimi geçersiz, sayı dışı, çok büyük
    const n = nut.normalizeWater({ days: { '2026-3-1': 3, '2026-03-02': Infinity, '2026-03-03': 1e9, '2026-03-04': NaN, '2026-03-05': 2.6 } });
    ok(Object.keys(n.days).join() === '2026-03-05,2026-03-03' || (n.days['2026-03-05'] === 3 && n.days['2026-03-03'] === 60 && !('2026-3-1' in n.days) && !('2026-03-02' in n.days) && !('2026-03-04' in n.days)), `bozuk gün kayıtları ayıklanmadı: ${JSON.stringify(n.days)}`);
  });
};
