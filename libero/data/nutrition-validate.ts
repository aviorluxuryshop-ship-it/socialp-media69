// Beslenme rehberi veri doğrulayıcısı. Sayfa yüklenirken (derleme dahil) çalışır; hata varsa fırlatır.
// Mantık testleri (scripts/logic-tests/nutrition.mjs) aynı işlevi bilerek bozulmuş veriyle de dener.
import { ALLERGEN_NAME, FOODS, FOOD_BY_ID, MEALS, MEAL_BY_ID, mealAllergens, type Allergen, type Meal } from './nutrition';
import { AGE_NOTES, DAY_PLANS, PLATES, PORTION_GUIDE, REVIEW_ITEMS, SECTIONS, SUPPLEMENT_ROWS, TOURNAMENT_POINTS, type GuideSection, type ReviewItem } from './nutrition-guide';
import { SOURCE_BY_ID } from './sources';
import { AGE_BANDS, DAY_SLOTS, DAY_TYPES, SLOTS, mealFitsSlot, type AgeBand } from '@/lib/nutrition';

/** Çocuk/ergen öğünlerinde ve planlarında bulunmaması gereken sözcükler */
export const MINOR_FORBIDDEN = /kafein|kahve|\bçay\b|\bkola\b|enerji\s*içece|protein\s*toz|kreatin|takviye|supplement|izotonik|spor\s*içece|yağ\s*yakıcı|bcaa/i;
/** Kalori / gram / kilo hedefi kalıpları */
export const PRESCRIPTION = /\b\d+(?:[.,]\d+)?\s*(?:kcal|kalori|kj|cal|g|gr|gram|kg)\b|\bg\s*\/\s*kg\b|kilo\s*(?:ver|kaybet)\w*\s*(?:için|hedef)|zayıflama\s*(?:diyeti|programı)/i;
/** Uyarı/ret bağlamını gösteren ifadeler: yasaklı sözcük bu cümlelerde geçebilir */
const CAUTION = /(değil|yok\b|yoktur|kullanılmaz|kullanma|önerilmez|önermez|kesinlikle|kaçın|yapma|hekim|diyetisyen|uygun değil|yeri yok)/i;

export interface GuideData {
  sections: GuideSection[];
  reviewItems: ReviewItem[];
  ageNotes: typeof AGE_NOTES;
  dayPlans: typeof DAY_PLANS;
  meals: Meal[];
  sourceIds: Set<string>;
}

export function realData(): GuideData {
  return { sections: SECTIONS, reviewItems: REVIEW_ITEMS, ageNotes: AGE_NOTES, dayPlans: DAY_PLANS, meals: MEALS, sourceIds: new Set(Object.keys(SOURCE_BY_ID)) };
}

export function collectStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach((x) => collectStrings(x, out));
  return out;
}

const ALLERGEN_WORDS: [RegExp, Allergen][] = [
  [/\bsüt\b|yoğurt|peynir|ayran|kefir|\blor\b|cacık/i, 'sut'],
  [/yumurta|omlet|menemen/i, 'yumurta'],
  [/ekmek|makarna|bulgur|lavaş|dürüm|simit|yulaf|\btost\b/i, 'gluten'],
  [/fıstık/i, 'fistik'],
  [/ceviz|badem|fındık/i, 'kuruyemis'],
  [/balık|ton balığı/i, 'balik'],
  [/tofu|soya/i, 'soya'],
  [/tahin|susam|humus|simit/i, 'susam'],
];

export function validateNutritionGuide(d: GuideData = realData()): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  const reviewIds = new Set(d.reviewItems.map((r) => r.id));

  for (const s of d.sections) {
    if (seen.has(s.id)) errs.push(`${s.id}: yinelenen bölüm kimliği`);
    seen.add(s.id);
    if (!s.meta && s.sources.length === 0) errs.push(`${s.id}: bölüm hiçbir kaynağa dayanmıyor`);
    for (const id of s.sources) if (!d.sourceIds.has(id)) errs.push(`${s.id}: bilinmeyen kaynak kimliği "${id}"`);
  }
  const rids = new Set<string>();
  for (const r of d.reviewItems) {
    if (rids.has(r.id)) errs.push(`${r.id}: yinelenen inceleme kimliği`);
    rids.add(r.id);
    if (!r.what || !r.why || !r.reviewer) errs.push(`${r.id}: inceleme maddesi eksik alan içeriyor`);
  }
  for (const [topic, notes] of Object.entries(d.ageNotes)) {
    for (const b of AGE_BANDS) {
      const n = notes[b.id];
      if (!n || !n.text) errs.push(`${topic}/${b.id}: yaş notu eksik`);
      else if (n.review && !reviewIds.has(n.review)) errs.push(`${topic}/${b.id}: bilinmeyen inceleme kimliği "${n.review}"`);
    }
  }

  const mealById = new Map(d.meals.map((m) => [m.id, m]));
  for (const b of AGE_BANDS) {
    for (const day of DAY_TYPES) {
      const plan = d.dayPlans[b.id]?.[day];
      if (!plan) {
        errs.push(`${b.id}/${day}: plan yok`);
        continue;
      }
      for (const slot of SLOTS) {
        const id = plan.slots[slot];
        if (!id) continue;
        const m = mealById.get(id);
        if (!m) {
          errs.push(`${b.id}/${day}/${slot}: bilinmeyen öğün "${id}"`);
          continue;
        }
        if (!mealFitsSlot(m, slot)) errs.push(`${b.id}/${day}/${slot}: "${id}" bu dilime uygun değil`);
        if (!DAY_SLOTS[day].includes(slot)) errs.push(`${b.id}/${day}/${slot}: dilim bu gün tipinde kullanılmıyor`);
        if (b.minor) {
          const txt = [m.name, m.why, ...m.parts, ...m.foods.map((f) => FOOD_BY_ID[f]?.name ?? '')].join(' ');
          if (MINOR_FORBIDDEN.test(txt)) errs.push(`${b.id}/${day}/${slot}: "${id}" çocuk/ergen öğününde yasak içerik (${txt.match(MINOR_FORBIDDEN)?.[0]})`);
        }
      }
      if (!plan.slots.kahvalti) errs.push(`${b.id}/${day}: kahvaltı yok`);
      if (!plan.slots.aksam) errs.push(`${b.id}/${day}: akşam öğünü yok`);
      if (b.minor) {
        for (const t of plan.tips) {
          if (PRESCRIPTION.test(t)) errs.push(`${b.id}/${day}: ipucunda kalori/gram/kilo hedefi kalıbı: "${t}"`);
          if (MINOR_FORBIDDEN.test(t) && !CAUTION.test(t)) errs.push(`${b.id}/${day}: ipucunda yasak içerik uyarısız geçiyor: "${t}"`);
        }
      }
    }
  }

  // alerjen tutarlılığı: öğün adı/parçalarında geçen anahtar sözcük, besin tablosundan türeyen alerjenlerde bulunmalı
  for (const m of d.meals) {
    const derived = new Set(mealAllergens(m));
    for (const f of m.foods) if (!FOOD_BY_ID[f]) errs.push(`${m.id}: bilinmeyen besin "${f}"`);
    const txt = `${m.name} ${m.parts.join(' ')}`;
    for (const [re, al] of ALLERGEN_WORDS) {
      if (re.test(txt) && !derived.has(al)) errs.push(`${m.id}: metinde "${ALLERGEN_NAME[al]}" geçiyor ama alerjen etiketinde yok`);
    }
  }

  for (const row of SUPPLEMENT_ROWS) for (const id of row.src) if (!d.sourceIds.has(id)) errs.push(`takviye/${row.name}: bilinmeyen kaynak "${id}"`);
  void PLATES;
  void TOURNAMENT_POINTS;
  void FOODS;
  return errs;
}

/** Çocuk ve ergen (≤17) içeriğinde kalori / gram / kilo hedefi arar. Yalnızca bu yaşlara ait metinleri tarar. */
export function prescriptionsForMinors(d: GuideData = realData()): string[] {
  const bad: string[] = [];
  const minors: AgeBand[] = AGE_BANDS.filter((b) => b.minor).map((b) => b.id);
  const texts: [string, string][] = [];
  for (const [topic, notes] of Object.entries(d.ageNotes)) for (const b of minors) texts.push([`yaş notu ${topic}/${b}`, notes[b].text]);
  for (const b of minors) for (const day of DAY_TYPES) for (const t of d.dayPlans[b][day].tips) texts.push([`plan ${b}/${day}`, t]);
  for (const b of minors) for (const t of PORTION_GUIDE[b]) texts.push([`porsiyon kılavuzu ${b}`, t]);
  for (const m of d.meals) for (const t of collectStrings([m.name, m.parts, m.why, m.prep])) texts.push([`öğün ${m.id}`, t]);
  for (const [where, t] of texts) if (PRESCRIPTION.test(t)) bad.push(`${where}: "${t}"`);
  return bad;
}

export function assertNutritionGuide(): void {
  const errs = validateNutritionGuide();
  const pres = prescriptionsForMinors();
  const all = [...errs, ...pres];
  if (all.length) throw new Error('Beslenme rehberi verisi geçersiz:\n - ' + all.join('\n - '));
}

void MEAL_BY_ID;
