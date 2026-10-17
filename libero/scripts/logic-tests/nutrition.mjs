// Beslenme ve toparlanma rehberi: veri bütünlüğü, güvenlik kuralları ve saf mantık (tarayıcısız).
import fs from 'node:fs';
import path from 'node:path';

export const include = ['lib/nutrition.ts', 'data/nutrition.ts', 'data/nutrition-guide.ts', 'data/nutrition-validate.ts', 'data/sources.ts'];

export default async ({ ok, test, load, root }) => {
  const nut = await load('lib/nutrition.js');
  const food = await load('data/nutrition.js');
  const guide = await load('data/nutrition-guide.js');
  const val = await load('data/nutrition-validate.js');
  const src = await load('data/sources.js');
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const real = val.realData();

  await test('Beslenme: gerçek rehber verisi doğrulayıcıdan geçer, çocuk içeriğinde kalori/gram hedefi yoktur', async () => {
    const errs = val.validateNutritionGuide();
    ok(errs.length === 0, errs.join('; '));
    const pres = val.prescriptionsForMinors();
    ok(pres.length === 0, pres.join('; '));
    ok(guide.SECTIONS.length >= 15, 'bölüm sayısı beklenenden az');
    ok(guide.SECTIONS.some((s) => s.id === 'sivi') && guide.SECTIONS.some((s) => s.id === 'ramazan') && guide.SECTIONS.some((s) => s.id === 'uzman'), 'zorunlu bölüm eksik');
  });

  await test('Beslenme: doğrulayıcı bilerek bozulmuş veriyi reddeder', async () => {
    const bad = (mut) => {
      const d = { ...real, sections: clone(real.sections), reviewItems: clone(real.reviewItems), ageNotes: clone(real.ageNotes), dayPlans: clone(real.dayPlans), meals: clone(real.meals) };
      mut(d);
      return val.validateNutritionGuide(d);
    };
    ok(bad((d) => { d.sections[0].sources = ['yok-boyle-kaynak']; }).some((m) => /bilinmeyen kaynak/.test(m)), 'bilinmeyen kaynak kabul edildi');
    ok(bad((d) => { d.sections[0].sources = []; }).some((m) => /hiçbir kaynağa/.test(m)), 'kaynaksız bölüm kabul edildi');
    ok(bad((d) => { d.dayPlans.u11.mac.slots.sonra = 'yok-boyle-ogun'; }).some((m) => /bilinmeyen öğün/.test(m)), 'bilinmeyen öğün kabul edildi');
    ok(bad((d) => { d.dayPlans.u14.antrenman.slots.kahvalti = 'makarna-tavuk'; }).some((m) => /dilime uygun değil/.test(m)), 'yanlış dilim kabul edildi');
    ok(bad((d) => { d.ageNotes.temel.u11.review = 'olmayan'; }).some((m) => /bilinmeyen inceleme/.test(m)), 'bilinmeyen inceleme kimliği kabul edildi');
    ok(bad((d) => { const m = d.meals.find((x) => x.id === 'yogurt-meyve'); m.parts.push('Enerji içeceği'); }).some((m) => /yasak içerik/.test(m)), 'çocuk öğününde enerji içeceği kabul edildi');
    ok(bad((d) => { const m = d.meals.find((x) => x.id === 'tavuk-lavas'); m.foods = m.foods.filter((f) => f !== 'lavas'); }).some((m) => /alerjen etiketinde yok/.test(m)), 'eksik gluten etiketi kabul edildi');
    ok(bad((d) => { d.dayPlans.u17.antrenman.tips.push('Günde 2200 kcal ye.'); }).some((m) => /kalori\/gram/.test(m)), 'kalori hedefi kabul edildi');
    ok(val.prescriptionsForMinors({ ...real, ageNotes: { x: { u11: { text: 'Günde 150 g protein ye' }, u14: { text: 'ok' }, u17: { text: 'ok' }, a18: { text: 'ok' } } } }).length === 1, 'gram hedefi yakalanmadı');
  });

  await test('Beslenme: her bölüm en az bir mevcut kaynağa dayanır; yeni kaynaklar DOI ile doğrulanabilir bağlantı taşır', async () => {
    for (const s of guide.SECTIONS) {
      if (s.meta) continue;
      ok(s.sources.length >= 1, `${s.id}: kaynak yok`);
      for (const id of s.sources) ok(src.SOURCE_BY_ID[id], `${s.id}: ${id} kaynağı data/sources.ts içinde yok`);
    }
    const ids = src.SOURCES.map((x) => x.id);
    ok(new Set(ids).size === ids.length, 'yinelenen kaynak kimliği');
    for (const id of ['who-diet', 'tuber', 'acsm-nutrition', 'uefa-nutrition']) ok(src.SOURCE_BY_ID[id], `${id}: mevcut kaynak silinmiş`);
    for (const id of ['sda-adolescent', 'ioc-supplements', 'aap-drinks-2011', 'aap-heat-2011', 'acsm-fluid-2007', 'nata-fluid-2017', 'aasm-sleep-2016', 'sleep-athlete-2021', 'aap-media-2016', 'reds-2023', 'reds-2014', 'overtraining-2013', 'ramadan-2012']) {
      const s = src.SOURCE_BY_ID[id];
      ok(s && /^https:\/\/doi\.org\/10\.\d{4,}\//.test(s.url), `${id}: DOI bağlantısı yok`);
      ok(s.topic === 'beslenme' && s.note.length > 40, `${id}: konu ya da not eksik`);
    }
  });

  await test('Beslenme: her "Uzman incelemesi" rozeti inceleme listesinde bulunur ve listedeki her madde sayfada bir rozetle anılır', async () => {
    const reviewIds = new Set(guide.REVIEW_ITEMS.map((r) => r.id));
    const used = new Set();
    const scan = (file, res) => {
      const t = read(file);
      for (const re of res) for (const m of t.matchAll(re)) used.add(m[1]);
    };
    const files = ['app/beslenme/page.tsx', ...fs.readdirSync(path.join(root, 'components')).filter((f) => /^Nutrition.*\.tsx$/.test(f)).map((f) => 'components/' + f)];
    for (const f of files) scan(f, [/<Rv id="([^"]+)"/g, /review="([^"]+)"/g]);
    scan('data/nutrition-guide.ts', [/review: '([^']+)'/g]);
    scan('lib/nutrition.ts', [/[,:]\s*'([a-z]{4,}(?:-[a-z]+)*)'\s*,?\s*\)/g]);
    for (const u of used) ok(reviewIds.has(u), `rozet "${u}" inceleme listesinde yok`);
    for (const r of reviewIds) ok(used.has(r), `"${r}" listede var ama sayfada hiçbir rozetle anılmıyor`);
    ok(guide.REVIEW_ITEMS.length >= 12, 'inceleme listesi çok kısa');
    const must = ['porsiyon', 'sivi-sayilari', 'ramazan', 'menuler', 'takviye'];
    for (const m of must) ok(reviewIds.has(m), `${m}: zorunlu inceleme maddesi yok`);
  });

  await test('Beslenme: besin–alerjen etiketleri tutarlı, öğünlerde takviye/kafein/enerji içeceği yok', async () => {
    const rules = [
      [/yoğurt|peynir|ayran|\bsüt\b|kefir|\blor\b/i, 'sut', /bitkisel/i],
      [/yumurta/i, 'yumurta'],
      [/fıstık ezmesi/i, 'fistik'],
      [/ceviz|badem|fındık/i, 'kuruyemis'],
      [/balık|ton balığı/i, 'balik'],
      [/tofu/i, 'soya'],
      [/tahin|susam|humus|simit/i, 'susam'],
      [/ekmek|makarna|bulgur|lavaş|simit|yulaf/i, 'gluten'],
    ];
    for (const f of food.FOODS) {
      for (const [re, al, except] of rules) {
        if (re.test(f.name) && !(except && except.test(f.name))) ok(f.allergens.includes(al), `${f.id}: adında geçen "${al}" alerjeni etiketlenmemiş`);
      }
      ok(!f.vegan || f.vegetarian, `${f.id}: vegan ama vejetaryen değil`);
      if (f.vegan) ok(!f.allergens.includes('sut') && !f.allergens.includes('yumurta') && !f.allergens.includes('balik'), `${f.id}: vegan ama hayvansal alerjen taşıyor`);
    }
    for (const m of food.MEALS) {
      ok(!val.MINOR_FORBIDDEN.test(`${m.name} ${m.parts.join(' ')} ${m.why}`), `${m.id}: çocuklar için yasak içerik`);
      for (const id of m.foods) ok(food.FOOD_BY_ID[id], `${m.id}: bilinmeyen besin ${id}`);
      ok(m.when.length > 0, `${m.id}: zaman etiketi yok`);
    }
    ok(food.MEALS.length >= 28, 'öğün sayısı az');
    // her çocuk planında yasak besin yok (izotonik / meyve suyu)
    for (const b of ['u11', 'u14', 'u17'])
      for (const d of ['antrenman', 'mac', 'dinlenme'])
        for (const id of Object.values(guide.DAY_PLANS[b][d].slots)) ok(!food.MEAL_BY_ID[id].foods.includes('izotonik'), `${b}/${d}: ${id} izotonik içeriyor`);
  });

  await test('Beslenme: maç günü çizelgesi saat sırasına dizilir, erken ve gece maçını, iki maçı ve geçersiz girişi ele alır', async () => {
    const t = nut.buildMatchTimeline({ kickoff: '15:00', band: 'u14' });
    ok(t && t.length >= 10, 'çizelge çok kısa');
    ok(t[0].at === null && /Önceki akşam/.test(t[0].label), 'önceki akşam adımı başta değil');
    const timed = t.filter((s) => s.abs !== null);
    for (let i = 1; i < timed.length; i++) ok(timed[i].abs >= timed[i - 1].abs, 'adımlar sıralı değil');
    ok(t.some((s) => s.kind === 'mac' && s.label === '15:00'), 'maç başlangıcı 15:00 değil');
    ok(t.some((s) => s.label === '12:00' && /Ana öğün/.test(s.title)), 'ana öğün 3 saat önce değil');
    const early = nut.buildMatchTimeline({ kickoff: '08:30', band: 'u14' });
    ok(early.some((s) => /Hafif kahvaltı/.test(s.title)) && !early.some((s) => /^Ana öğün$/.test(s.title) && s.abs < 510), 'erken maçta hafif kahvaltı kullanılmıyor');
    ok(nut.buildMatchTimeline({ kickoff: '25:99', band: 'u14' }) === null && nut.buildMatchTimeline({ kickoff: '', band: 'u14' }) === null, 'geçersiz saat kabul edildi');
    const two = nut.buildMatchTimeline({ kickoff: '10:00', band: 'u14', second: '13:00', duration: 60 });
    ok(two.some((s) => /İkinci maç başlar/.test(s.title) && s.label === '13:00'), 'ikinci maç yok');
    ok(two.some((s) => /Maçlar arası/.test(s.title)), 'maçlar arası adım yok');
    const tight = nut.buildMatchTimeline({ kickoff: '10:00', band: 'u14', second: '11:30', duration: 60 });
    ok(tight.some((s) => /Kolay sindirilen/.test(s.title)), 'kısa aralıkta hafif karbonhidrat önerilmedi');
    const night = nut.buildMatchTimeline({ kickoff: '21:30', band: 'u17' });
    const ts = night.filter((s) => s.abs !== null);
    for (let i = 1; i < ts.length; i++) ok(ts[i].abs >= ts[i - 1].abs, 'gece maçı sırası bozuk');
    ok(nut.minToTime(-30) === '23:30' && nut.minToTime(1500) === '01:00' && nut.timeToMin('9:05') === 545, 'saat dönüşümü hatalı');
    // çocuk çizelgesinde yasak ürünler yalnızca uyarı bağlamında geçer; yetişkin çizelgesinde TÜBER sayıları vardır
    for (const b of ['u11', 'u14', 'u17']) {
      for (const s of nut.buildMatchTimeline({ kickoff: '14:00', band: b })) {
        const txt = `${s.title} ${s.detail}`;
        if (val.MINOR_FORBIDDEN.test(txt)) ok(/değil|yok|kullanılmaz|önerilmez/i.test(txt), `${b}: çizelgede uyarısız yasak ifade: ${txt}`);
        ok(!val.PRESCRIPTION.test(txt), `${b}: çizelgede kalori/gram kalıbı: ${txt}`);
        if (s.review) ok(guide.REVIEW_BY_ID[s.review], `çizelge: bilinmeyen inceleme ${s.review}`);
      }
    }
    const adult = nut.buildMatchTimeline({ kickoff: '14:00', band: 'a18' });
    ok(adult.some((s) => /500 mL/.test(s.detail) && s.review === 'sivi-sayilari'), 'yetişkin çizelgesinde incelemeli sıvı değeri yok');
    ok(!nut.buildMatchTimeline({ kickoff: '14:00', band: 'u14' }).some((s) => /\d+\s*mL/.test(s.detail)), 'çocuk çizelgesinde mL hedefi var');
  });

  await test('Beslenme: su takibi bozuk kayıtları onarır, ayrı anahtarda saklanır, hatırlatıcı zamanında tetiklenir', async () => {
    ok(nut.WATER_KEY === 'libero:su' && nut.PLAN_KEY === 'libero:beslenme' && nut.WATER_KEY !== 'libero:v1' && nut.PLAN_KEY !== 'libero:v1', 'anahtarlar libero:v1 ile çakışıyor ya da yanlış');
    const g1 = nut.normalizeWater(null);
    const g2 = nut.normalizeWater('çöp');
    const g3 = nut.normalizeWater({ goal: 999, days: { '2026-01-01': 5, 'kötü': 3, '2026-01-02': -4, '2026-01-03': 'x' }, reminder: { on: 'evet', everyMin: 7 }, lastAt: 'dün' });
    ok(g1.goal === 8 && g2.goal === 8 && g1.v === 1, 'varsayılan hatalı');
    ok(g3.goal === 30 && g3.days['2026-01-01'] === 5 && g3.days['2026-01-02'] === 0 && !('kötü' in g3.days) && !('2026-01-03' in g3.days), 'günler ayıklanmadı');
    ok(g3.reminder.on === false && g3.reminder.everyMin === 60 && g3.lastAt === null, 'hatırlatıcı onarılmadı');
    let s = nut.normalizeWater({});
    s = nut.addGlass(s, '2026-03-10', 1, 1000);
    s = nut.addGlass(s, '2026-03-10', 2, 2000);
    ok(nut.glassesOn(s, '2026-03-10') === 3 && s.lastAt === 2000, 'bardak eklenmedi');
    s = nut.addGlass(s, '2026-03-10', -10, 3000);
    ok(nut.glassesOn(s, '2026-03-10') === 0 && s.lastAt === 2000, 'eksiye düştü ya da çıkarma son içme zamanını değiştirdi');
    const last = nut.lastDays(nut.addGlass(s, '2026-03-09', 4, 1), '2026-03-10', 3);
    ok(last.length === 3 && last[0].key === '2026-03-08' && last[1].n === 4 && last[2].key === '2026-03-10', 'son günler hatalı');
    const r = { ...s, reminder: { on: true, everyMin: 30 }, lastAt: 1_000_000 };
    ok(!nut.reminderDue(r, 1_000_000 + 29 * 60_000) && nut.reminderDue(r, 1_000_000 + 30 * 60_000), 'hatırlatıcı zamanı yanlış');
    ok(!nut.reminderDue({ ...r, reminder: { on: false, everyMin: 30 } }, 9e12) && !nut.reminderDue({ ...r, lastAt: null }, 9e12), 'kapalı hatırlatıcı tetiklendi');
    ok(nut.dayKey(new Date(2026, 0, 5)) === '2026-01-05', 'gün anahtarı hatalı');
  });

  await test('Beslenme: haftalık plan bozuk kaydı onarır, alerji ve beslenme tercihine uyar, alışveriş listesi gruplanır', async () => {
    const p0 = nut.normalizePlan({ band: 'x', diet: 'y', avoid: ['sut', 'olmayan'], days: { pzt: { type: 'mac', slots: { kahvalti: 'omlet', ogle: 'yok', sonra: 'makarna-tavuk' } } }, ticked: ['tavuk', 5, 'olmayan'] });
    ok(p0.band === 'u14' && p0.diet === 'hepsi' && p0.avoid.length === 1 && p0.avoid[0] === 'sut', 'plan onarımı hatalı');
    ok(p0.days.pzt.type === 'mac' && p0.days.pzt.slots.kahvalti === 'omlet' && !p0.days.pzt.slots.ogle && !p0.days.pzt.slots.sonra, 'plan öğünleri onarılmadı (yanlış dilim ya da bilinmeyen öğün kalmış)');
    ok(p0.ticked.length === 1 && p0.ticked[0] === 'tavuk', 'işaretler ayıklanmadı');
    ok(nut.normalizePlan(undefined).days.cmt.type === 'mac', 'varsayılan hafta düzeni yok');
    // alerji: süt kaçınılırsa hiçbir seçilen öğün süt içermez
    for (const band of ['u11', 'u14', 'u17', 'a18']) {
      for (const day of ['antrenman', 'mac', 'dinlenme']) {
        const slots = nut.fillDay(day, guide.DAY_PLANS[band][day].slots, ['sut', 'gluten'], 'hepsi');
        for (const id of Object.values(slots)) {
          const al = food.mealAllergens(food.MEAL_BY_ID[id]);
          ok(!al.includes('sut') && !al.includes('gluten'), `${band}/${day}: ${id} alerjene rağmen seçildi`);
        }
        const vg = nut.fillDay(day, guide.DAY_PLANS[band][day].slots, [], 'vegan');
        for (const id of Object.values(vg)) ok(food.mealVegan(food.MEAL_BY_ID[id]), `${band}/${day}: ${id} vegan değil`);
        ok(Object.keys(vg).length >= 3, `${band}/${day}: vegan plan çok kısa`);
      }
    }
    const p = nut.emptyPlan('u14');
    p.days.pzt.slots = { kahvalti: 'omlet', ogle: 'tavuk-lavas' };
    p.days.sal.slots = { kahvalti: 'omlet' };
    const list = nut.shoppingList(p);
    const flat = list.flatMap((g) => g.items);
    const yum = flat.find((i) => i.id === 'yumurta');
    ok(yum && yum.count === 2, 'yumurta 2 öğünde sayılmadı');
    ok(list.every((g) => g.items.length > 0) && list.map((g) => g.title).includes('Süt ve süt ürünleri'), 'gruplar boş ya da süt grubu yok');
    ok(nut.shoppingList(nut.emptyPlan()).length === 0, 'boş plan için liste dolu');
  });

  await test('Beslenme: tabak çizimleri beş besin grubunu kapsar, yaş bantları ve gün tipleri eksiksizdir', async () => {
    for (const pl of guide.PLATES) {
      const w = Object.keys(pl.weights).sort().join(',');
      ok(w === 'meyve,protein,sebze,sut,tahil', `${pl.id}: besin grubu eksik (${w})`);
      ok(Object.values(pl.weights).every((v) => v > 0), `${pl.id}: sıfır dilim`);
    }
    const by = Object.fromEntries(guide.PLATES.map((p) => [p.id, p.weights.tahil]));
    ok(by.mac > by.antrenman && by.antrenman > by.dinlenme, 'karbonhidrat payı yüke göre artmıyor');
    ok(nut.AGE_BANDS.length === 4 && guide.SLEEP_ROWS.length >= 3 && guide.URINE_STEPS.length >= 5, 'bant/uyku/idrar tablosu eksik');
    ok(guide.SLEEP_ROWS.some((r) => /9–12/.test(r.hours)) && guide.SLEEP_ROWS.some((r) => /8–10/.test(r.hours)), 'AASM uyku süreleri eksik');
    ok(guide.RED_FLAGS_EATING.length >= 4 && guide.RED_FLAGS_ENERGY.length >= 4, 'uyarı işaretleri eksik');
    for (const r of guide.SUPPLEMENT_ROWS) ok(/(kullanılmaz|önerilmez|Kesinlikle|Önerilmez|sorusunu|Eksiklikten|Günlük içecek)/i.test(r.minor), `${r.name}: çocuk satırı yasaklayıcı ya da yönlendirici değil`);
  });
};
