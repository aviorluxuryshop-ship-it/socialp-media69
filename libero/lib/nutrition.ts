// Beslenme rehberi: saf (tarayıcısız) mantık. Maç günü çizelgesi, su takibi, haftalık plan ve alışveriş listesi.
// Depolama anahtarları libero:v1 DIŞINDADIR (yedek dosyası şemasına dokunulmaz):
//   libero:su        → su takibi ve hatırlatıcı
//   libero:beslenme  → yaş grubu, haftalık plan, alışveriş listesi işaretleri
import { FOODS, FOOD_BY_ID, MEALS, MEAL_BY_ID, mealAllergens, mealVegan, mealVegetarian, ROLE_NAME, type Allergen, type FoodRole, type Meal, type MealWhen } from '@/data/nutrition';

export const WATER_KEY = 'libero:su';
export const PLAN_KEY = 'libero:beslenme';

// ── Yaş grupları ────────────────────────────────────────

export type AgeBand = 'u11' | 'u14' | 'u17' | 'a18';
export const AGE_BANDS: { id: AgeBand; label: string; short: string; minor: boolean }[] = [
  { id: 'u11', label: '11 yaş ve altı', short: '≤11', minor: true },
  { id: 'u14', label: '12–14 yaş', short: '12–14', minor: true },
  { id: 'u17', label: '15–17 yaş', short: '15–17', minor: true },
  { id: 'a18', label: '18 yaş ve üstü', short: '18+', minor: false },
];
export const DEFAULT_BAND: AgeBand = 'u14';
export const isBand = (v: unknown): v is AgeBand => AGE_BANDS.some((b) => b.id === v);
export const isMinor = (b: AgeBand) => b !== 'a18';

// ── Öğün dilimleri ──────────────────────────────────────

export type SlotKey = 'kahvalti' | 'ara' | 'ogle' | 'once3' | 'once1' | 'sonra' | 'aksam';
export const SLOTS: SlotKey[] = ['kahvalti', 'ara', 'ogle', 'once3', 'once1', 'sonra', 'aksam'];
export const SLOT_LABEL: Record<SlotKey, string> = {
  kahvalti: 'Kahvaltı',
  ara: 'Ara öğün',
  ogle: 'Öğle',
  once3: 'Antrenman/maçtan 3–4 saat önce',
  once1: 'Antrenman/maçtan 30–60 dk önce (hafif)',
  sonra: 'Antrenman/maç sonrası',
  aksam: 'Akşam',
};
/** hangi öğün etiketleri hangi dilime girebilir */
export const SLOT_WHEN: Record<SlotKey, MealWhen[]> = {
  kahvalti: ['kahvalti'],
  ara: ['once-hafif', 'sonra'],
  ogle: ['gunluk'],
  once3: ['once-3sa'],
  once1: ['once-hafif'],
  sonra: ['sonra'],
  aksam: ['gunluk', 'mac-sonrasi-gece'],
};
export const mealFitsSlot = (m: Meal, slot: SlotKey) => m.when.some((w) => SLOT_WHEN[slot].includes(w));
export const mealsForSlot = (slot: SlotKey) => MEALS.filter((m) => mealFitsSlot(m, slot));

export type DayType = 'antrenman' | 'mac' | 'dinlenme';
export const DAY_TYPES: DayType[] = ['antrenman', 'mac', 'dinlenme'];
/** Gün tipine göre görünen öğün dilimleri (haftalık planlayıcı) */
export const DAY_SLOTS: Record<DayType, SlotKey[]> = {
  antrenman: ['kahvalti', 'ara', 'ogle', 'once1', 'sonra', 'aksam'],
  mac: ['kahvalti', 'ara', 'once3', 'once1', 'sonra', 'aksam'],
  dinlenme: ['kahvalti', 'ara', 'ogle', 'aksam'],
};
export const DAY_TYPE_LABEL: Record<DayType, string> = { antrenman: 'Antrenman günü', mac: 'Maç günü', dinlenme: 'Dinlenme günü' };

// ── Zaman yardımcıları ──────────────────────────────────

/** "15:30" → 930; geçersizse null */
export function timeToMin(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
export function minToTime(min: number): string {
  const t = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

// ── Maç günü çizelgesi ──────────────────────────────────

export type StepKind = 'yemek' | 'sivi' | 'mac' | 'dinlenme' | 'kontrol';
export interface TimelineStep {
  /** gün içi dakika (0–1439); null: "önceki akşam" gibi saatsiz adım */
  at: number | null;
  /** sıralama için mutlak dakika (gece yarısını aşabilir) */
  abs: number | null;
  /** saat metni ya da etiket */
  label: string;
  kind: StepKind;
  title: string;
  detail: string;
  /** uzman incelemesi kimliği */
  review?: string;
}

export interface TimelineInput {
  kickoff: string;
  band: AgeBand;
  /** maç süresi (dk); varsayılan 70 */
  duration?: number;
  /** aynı gün ikinci maç başlangıcı (isteğe bağlı) */
  second?: string;
}

/** İki maç arası en çok bu kadar dakika olursa ikinci maç aynı günün çizelgesine alınır */
export const MAX_MATCH_GAP = 600;
/** İlk maçın bitişi ile ikinci maçın başlangıcı arasında en az bu kadar dakika olmalı */
export const MIN_MATCH_GAP = 20;
const clampDur = (d?: number) => Math.min(120, Math.max(30, Math.round(d ?? 70)));

export type SecondStatus = 'yok' | 'tamam' | 'gecersiz' | 'cakisiyor' | 'uzak';
/**
 * İkinci maçın çizelgeye girip girmediği. `uzak`: ilk maçtan önce ya da bitişinden 10 saatten sonra;
 * `cakisiyor`: ilk maç bitmeden ya da bitişinden 20 dakikadan önce başlıyor.
 */
export function secondMatchStatus(inp: Pick<TimelineInput, 'kickoff' | 'duration' | 'second'>): { status: SecondStatus; gap: number | null } {
  if (inp.second === undefined || inp.second === null) return { status: 'yok', gap: null };
  const k1 = timeToMin(inp.kickoff);
  const k2 = timeToMin(inp.second);
  if (k1 === null || k2 === null) return { status: 'gecersiz', gap: null };
  const dur = clampDur(inp.duration);
  const sinceStart = (((k2 - k1) % 1440) + 1440) % 1440; // ilk maçın başlangıcından ikincisine
  if (sinceStart < dur + MIN_MATCH_GAP) return { status: 'cakisiyor', gap: sinceStart - dur };
  const gap = sinceStart - dur;
  if (gap >= MAX_MATCH_GAP) return { status: 'uzak', gap };
  return { status: 'tamam', gap };
}

/** Gün içi dakika (0–1439) gece geç saat mi (22:30–05:59)? Büyük bir öğün için uygun olmayan saat. */
const isLateHour = (abs: number) => {
  const t = ((abs % 1440) + 1440) % 1440;
  return t >= 1350 || t < 360;
};

export function buildMatchTimeline(inp: TimelineInput): TimelineStep[] | null {
  const k1 = timeToMin(inp.kickoff);
  if (k1 === null) return null;
  const minor = isMinor(inp.band);
  const dur = clampDur(inp.duration);
  const second = secondMatchStatus(inp);
  const k2 = second.status === 'tamam' && inp.second ? timeToMin(inp.second) : null;
  const steps: TimelineStep[] = [];
  const push = (at: number | null, kind: StepKind, title: string, detail: string, review?: string, label?: string) =>
    steps.push({ at: at === null ? null : ((at % 1440) + 1440) % 1440, abs: at, label: label ?? (at === null ? 'Önceki akşam' : minToTime(at)), kind, title, detail, review });

  const night = k1 < 360; // 00:00–05:59'da başlayan maç: gece yarısını aşan çizelge
  const early = k1 >= 360 && k1 < 540; // 06:00–08:59 arası sabah maçı

  if (night) {
    push(null, 'yemek', 'Gün boyu düzenli öğünler ve su', 'Maç gece geç saatte olduğu için gün içinde öğün atlamayın, suyu düzenli için. Maç öncesi yeni ya da ağır bir yemek denemeyin.', 'zamanlama', 'Gün boyu');
    push(
      null,
      'dinlenme',
      'Gündüz dinlen, uykuyu koru',
      minor
        ? 'Çok geç saatte oynanan maçlar uyku düzenini bozabilir. Gün içinde dinlenmeye ve uyku süreni korumaya çalış (bkz. Uyku bölümü); mümkünse bir yetişkinle maç saatini konuş.'
        : 'Gece geç saatteki maç uyku düzenini bozabilir. Gün içinde dinlenmeye ve uyku süreni korumaya çalış (bkz. Uyku bölümü).',
      undefined,
      'Gün boyu',
    );
  } else {
    push(
      null,
      'yemek',
      'Tanıdık, dengeli akşam yemeği',
      'Pilav, makarna ya da patates gibi karbonhidrat ağırlıklı; yanında protein ve sebze. Maç öncesi yeni ya da ağır bir yemek denemeyin.',
      'zamanlama',
    );
    push(null, 'dinlenme', 'Erken yat', 'Uyku toparlanmanın parçasıdır. Ekranları yatmadan önce bırakın.');
  }

  if (early) {
    push(k1 - 120, 'yemek', 'Hafif kahvaltı', 'Sabah erken maçta mideyi yormayan, tanıdık bir kahvaltı: ekmek-bal, yoğurt-muz ya da yulaf. Uyanır uyanmaz yemek zorunda değilsiniz ama aç da başlamayın.', 'zamanlama');
  } else {
    push(k1 - 180, 'yemek', 'Ana öğün', 'Karbonhidrat ağırlıklı, tanıdık bir öğün (pilav, makarna, bulgur, patates + orta miktarda protein + sebze). Yağlı, kızartma ve çok lifli yiyecekler mideyi yorabilir.', 'zamanlama');
  }
  if (!minor) {
    push(k1 - 240, 'sivi', 'Sıvı hazırlığı', 'Gün boyu düzenli su için. TÜBER, sporcular için egzersizden yaklaşık 4 saat önce yaklaşık 500 mL sıvıyı örnek verir; kişiye göre değişir.', 'sivi-sayilari');
  }
  push(k1 - 120, 'kontrol', 'İdrar rengi ve sıvı', 'İdrar rengi açık sarıysa yolundasınız; koyuysa suyu yudum yudum artırın. Birden çok miktarda içmek yerine düzenli yudumlar daha rahattır.');
  push(k1 - 60, 'yemek', 'İsteğe bağlı hafif atıştırmalık', 'Mide hassassa atlayın ya da küçük bir porsiyon yeterlidir: muz, yoğurt-meyve, ekmek-bal. Yeni bir şey denemeyin.', 'zamanlama');
  push(k1 - 30, 'kontrol', 'Isınma başlar', 'Birkaç yudum su için. Çantada su, yedek forma ve maç sonrası atıştırmalığı hazır olsun.');
  push(k1, 'mac', 'Maç başlar', 'Duran oyun ve değişikliklerde birkaç yudum su için; sıcak havada gölgeye geçip kısa molayı değerlendirin.');
  if (dur >= 40) {
    push(
      k1 + Math.round(dur / 2),
      'sivi',
      'Devre arası',
      minor
        ? 'Birkaç yudum su. Canınız istiyorsa muz gibi küçük bir meyve parçası. Enerji içeceği ve kafein çocuk ve ergenler için uygun değildir.'
        : 'Birkaç yudum su; etkinlik 1 saatten uzunsa karbonhidrat/elektrolit içeren içecek faydalı olabilir (TÜBER). Enerji içeceğinden kaçının.',
      minor ? undefined : 'sivi-sayilari',
    );
  }
  const end1 = k1 + dur;
  push(end1, 'mac', 'Maç biter', 'Soğuma yürüyüşü yapın, serin bir yerde dinlenin.');

  /** Son maçtan sonra: toparlanma atıştırmalığı; saat uygunsa ana öğün, geç saatse büyük öğün yerine sakin kapanış */
  const closing = (endAbs: number, snackTitle: string, withFluidStep: boolean, snackReview?: string): number => {
    push(endAbs + 20, 'yemek', snackTitle, 'Karbonhidrat + protein + sıvı: ayran-simit, süt-muz, yoğurt-meyve, tavuklu dürüm.', snackReview);
    if (withFluidStep && !minor) {
      push(endAbs + 30, 'sivi', 'Sıvı açığını kapatın', 'Maç sonrası tartı farkını (varsa) ve idrar rengini izleyin. TÜBER, sporcular için kaybedilen her yarım kg için yaklaşık 450–675 mL sıvıyı örnek verir.', 'sivi-sayilari');
    }
    if (isLateHour(endAbs + 120)) {
      push(endAbs + 60, 'dinlenme', 'Geç saat: büyük öğün yerine sakin kapanış', 'Gece geç saatte büyük bir öğün yerine toparlanma atıştırmalığı ve sıvıyla yetinmek daha rahat olabilir; yatmadan hemen önce ağır ve yağlı yemekten kaçının. Uykuya öncelik verin.', 'zamanlama');
      return endAbs + 105;
    }
    push(endAbs + 120, 'yemek', 'Ana öğün', 'Tabak modeli: her gruptan bir besin; maç günü karbonhidrat dilimi büyük, yanında protein, sebze-meyve ve süt grubu.', 'menuler');
    return endAbs + 120;
  };

  let lastEnd: number;
  let lateClose = false;
  if (k2 !== null) {
    const gap = second.gap as number;
    // iki maç arası
    push(end1 + 5, 'sivi', 'Maçlar arası: önce sıvı', 'Hemen su içmeye başlayın, yudum yudum. Aynı gün birden çok maçta yetersiz toparlanma ve sıvı eksikliği ısı sorunlarının riskini artıran etkenlerdir (AAP).', 'turnuva');
    if (gap < 90) {
      push(end1 + 15, 'yemek', 'Kolay sindirilen karbonhidrat', 'Muz, ekmek-bal, yoğurt gibi hafif seçenekler; yağlı ve lifli yiyeceklerden kaçının. Büyük bir öğün için zaman kısa.', 'turnuva');
    } else {
      push(end1 + 20, 'yemek', 'Hafif öğün', 'Karbonhidrat ve biraz protein: ayran-simit, peynirli tost, süt-muz. Sonraki maça yaklaşırken küçük porsiyonlara geçin.', 'turnuva');
    }
    if (k2 - 60 >= end1 + 30) push(k2 - 60, 'yemek', 'İsteğe bağlı hafif atıştırmalık', 'Sadece mideniz rahatsa ve zamanınız varsa; yeni bir şey denemeyin.', 'turnuva');
    if (k2 - 30 >= end1 + 10) push(k2 - 30, 'kontrol', 'Isınma ve sıvı', 'Birkaç yudum su; idrar rengiyle kendinizi kontrol edin.');
    push(k2, 'mac', 'İkinci maç başlar', 'İlk maçtaki gibi: düzenli yudumlar ve gölgede mola.');
    const end2 = k2 + dur;
    push(end2, 'mac', 'İkinci maç biter', 'Soğuma ve sıvı.');
    lateClose = isLateHour(end2 + 120);
    lastEnd = closing(end2, 'Toparlanma atıştırmalığı', false);
  } else {
    lateClose = isLateHour(end1 + 120);
    lastEnd = closing(end1, 'Toparlanma atıştırmalığı', true, 'zamanlama');
  }
  const last = steps.reduce((m, s) => Math.max(m, s.abs ?? 0), 0);
  if (lateClose || night) {
    push(Math.max(lastEnd, last) + (lateClose ? 0 : 60), 'dinlenme', 'Sakin ol ve uyu', 'Ekranı azaltın; sıvıyı düzenli tutun. Uyku süresi yaşa göre değişir (bkz. Uyku bölümü).');
  } else {
    push(Math.max(last + 90, 1260), 'dinlenme', 'Sakin akşam ve uyku', 'Ekranı azaltın; sıvıyı düzenli tutun. Uyku süresi yaşa göre değişir (bkz. Uyku bölümü).');
  }

  // saat sırasına diz; saatsiz adımlar (önceki akşam / gün boyu) ilk sırada kalır
  const timed = steps.filter((s) => s.abs !== null).sort((a, b) => (a.abs as number) - (b.abs as number));
  return [...steps.filter((s) => s.abs === null), ...timed];
}

// ── Su takibi ───────────────────────────────────────────

export interface WaterState {
  v: 1;
  /** kullanıcının kendi belirlediği bardak sayacı hedefi (kişisel gereksinim değildir) */
  goal: number;
  days: Record<string, number>;
  reminder: { on: boolean; everyMin: number };
  /** son içme ya da hatırlatıcının açıldığı an (ms) */
  lastAt: number | null;
}

export const DEFAULT_WATER: WaterState = { v: 1, goal: 8, days: {}, reminder: { on: false, everyMin: 60 }, lastAt: null };
export const REMINDER_CHOICES = [30, 45, 60, 90, 120];
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function normalizeWater(raw: unknown): WaterState {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const goalN = Number(o.goal);
  const goal = Number.isFinite(goalN) ? Math.min(30, Math.max(1, Math.round(goalN))) : DEFAULT_WATER.goal;
  const days: Record<string, number> = {};
  if (o.days && typeof o.days === 'object') {
    const entries = Object.entries(o.days as Record<string, unknown>)
      .filter(([k, v]) => KEY_RE.test(k) && typeof v === 'number' && Number.isFinite(v))
      .map(([k, v]) => [k, Math.min(60, Math.max(0, Math.round(v as number)))] as const)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 60);
    for (const [k, v] of entries) days[k] = v;
  }
  const r = (o.reminder && typeof o.reminder === 'object' ? o.reminder : {}) as Record<string, unknown>;
  const ev = Number(r.everyMin);
  const everyMin = REMINDER_CHOICES.includes(ev) ? ev : DEFAULT_WATER.reminder.everyMin;
  const lastAt = typeof o.lastAt === 'number' && Number.isFinite(o.lastAt) ? o.lastAt : null;
  return { v: 1, goal, days, reminder: { on: r.on === true, everyMin }, lastAt };
}

export function glassesOn(s: WaterState, key: string): number {
  return s.days[key] ?? 0;
}
export function addGlass(s: WaterState, key: string, delta: number, now: number): WaterState {
  const next = Math.min(60, Math.max(0, glassesOn(s, key) + delta));
  return { ...s, days: { ...s.days, [key]: next }, lastAt: delta > 0 ? now : s.lastAt };
}
/** bitiş gününden geriye n gün: eskiden yeniye */
export function lastDays(s: WaterState, endKey: string, n: number): { key: string; n: number }[] {
  const [y, m, d] = endKey.split('-').map(Number);
  const out: { key: string; n: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = dayKey(new Date(y, m - 1, d - i));
    out.push({ key: k, n: glassesOn(s, k) });
  }
  return out;
}
export function reminderDue(s: WaterState, now: number): boolean {
  if (!s.reminder.on || s.lastAt === null) return false;
  return now - s.lastAt >= s.reminder.everyMin * 60_000;
}

// ── Haftalık plan ───────────────────────────────────────

export type Diet = 'hepsi' | 'vejetaryen' | 'vegan';
export const DAY_KEYS = ['pzt', 'sal', 'car', 'per', 'cum', 'cmt', 'paz'] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export const DAY_NAME: Record<DayKey, string> = { pzt: 'Pazartesi', sal: 'Salı', car: 'Çarşamba', per: 'Perşembe', cum: 'Cuma', cmt: 'Cumartesi', paz: 'Pazar' };
/** Örnek hafta düzeni: kullanıcı değiştirebilir */
export const DEFAULT_WEEK: Record<DayKey, DayType> = { pzt: 'antrenman', sal: 'dinlenme', car: 'antrenman', per: 'antrenman', cum: 'dinlenme', cmt: 'mac', paz: 'dinlenme' };

export interface PlanDay {
  type: DayType;
  slots: Partial<Record<SlotKey, string>>;
}
export interface PlanState {
  v: 1;
  band: AgeBand;
  diet: Diet;
  avoid: Allergen[];
  days: Record<DayKey, PlanDay>;
  ticked: string[];
}

const ALLERGENS: Allergen[] = ['sut', 'yumurta', 'gluten', 'fistik', 'kuruyemis', 'balik', 'soya', 'susam'];

export function emptyPlan(band: AgeBand = DEFAULT_BAND): PlanState {
  const days = {} as Record<DayKey, PlanDay>;
  for (const k of DAY_KEYS) days[k] = { type: DEFAULT_WEEK[k], slots: {} };
  return { v: 1, band, diet: 'hepsi', avoid: [], days, ticked: [] };
}

export function normalizePlan(raw: unknown): PlanState {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const p = emptyPlan(isBand(o.band) ? o.band : DEFAULT_BAND);
  if (o.diet === 'vejetaryen' || o.diet === 'vegan' || o.diet === 'hepsi') p.diet = o.diet;
  if (Array.isArray(o.avoid)) p.avoid = o.avoid.filter((a): a is Allergen => ALLERGENS.includes(a as Allergen));
  if (o.days && typeof o.days === 'object') {
    for (const k of DAY_KEYS) {
      const d = (o.days as Record<string, unknown>)[k] as { type?: unknown; slots?: unknown } | undefined;
      if (!d || typeof d !== 'object') continue;
      if (DAY_TYPES.includes(d.type as DayType)) p.days[k].type = d.type as DayType;
      if (d.slots && typeof d.slots === 'object') {
        for (const s of DAY_SLOTS[p.days[k].type]) {
          const id = (d.slots as Record<string, unknown>)[s];
          if (typeof id === 'string' && MEAL_BY_ID[id] && mealFitsSlot(MEAL_BY_ID[id], s)) p.days[k].slots[s] = id;
        }
      }
    }
  }
  if (Array.isArray(o.ticked)) p.ticked = o.ticked.filter((t): t is string => typeof t === 'string' && !!FOOD_BY_ID[t]).slice(0, 200);
  return p;
}

/** Öğün, seçilen alerji ve beslenme tercihine uygun mu? */
export function mealAllowed(m: Meal, avoid: Allergen[], diet: Diet): boolean {
  if (mealAllergens(m).some((a) => avoid.includes(a))) return false;
  if (diet === 'vegan') return mealVegan(m);
  if (diet === 'vejetaryen') return mealVegetarian(m);
  return true;
}

/** Bir günün öğünleri; uygun değilse aynı dilimden uygun bir alternatif seçilir */
export function fillDay(type: DayType, template: Partial<Record<SlotKey, string>>, avoid: Allergen[], diet: Diet): Partial<Record<SlotKey, string>> {
  const out: Partial<Record<SlotKey, string>> = {};
  for (const slot of SLOTS) {
    const id = template[slot];
    if (!id) continue;
    const m = MEAL_BY_ID[id];
    if (m && mealAllowed(m, avoid, diet)) {
      out[slot] = id;
      continue;
    }
    const alt = mealsForSlot(slot).find((x) => mealAllowed(x, avoid, diet));
    if (alt) out[slot] = alt.id;
  }
  void type;
  return out;
}

export interface ShopItem {
  id: string;
  name: string;
  /** kaç öğünde geçiyor */
  count: number;
  role: FoodRole;
}
export interface ShopGroup {
  title: string;
  items: ShopItem[];
}

const GROUP_OF: Record<FoodRole, string> = {
  sebze: 'Sebze ve meyve',
  meyve: 'Sebze ve meyve',
  karbonhidrat: 'Tahıl, ekmek ve patates',
  protein: 'Et, balık, yumurta ve baklagil',
  sut: 'Süt ve süt ürünleri',
  yag: 'Yağ, kuruyemiş ve ezmeler',
  sivi: 'İçecekler',
};
const GROUP_ORDER = ['Sebze ve meyve', 'Tahıl, ekmek ve patates', 'Et, balık, yumurta ve baklagil', 'Süt ve süt ürünleri', 'Yağ, kuruyemiş ve ezmeler', 'İçecekler'];

export function shoppingList(p: PlanState): ShopGroup[] {
  const count = new Map<string, number>();
  for (const k of DAY_KEYS) {
    for (const slot of SLOTS) {
      const id = p.days[k].slots[slot];
      const m = id ? MEAL_BY_ID[id] : undefined;
      if (!m) continue;
      for (const f of new Set(m.foods)) count.set(f, (count.get(f) ?? 0) + 1);
    }
  }
  const groups = new Map<string, ShopItem[]>();
  for (const [id, n] of count) {
    const f = FOOD_BY_ID[id];
    if (!f) continue;
    const g = GROUP_OF[f.role];
    // protein grubunda süt ürünleri (lor) ayrı grupta gösterilir
    const title = f.role === 'protein' && f.sub === 'sut-proteini' ? GROUP_OF.sut : g;
    const list = groups.get(title) ?? [];
    list.push({ id, name: f.name, count: n, role: f.role });
    groups.set(title, list);
  }
  return GROUP_ORDER.filter((t) => groups.has(t)).map((title) => ({
    title,
    items: (groups.get(title) as ShopItem[]).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr')),
  }));
}

export const ROLE_LABEL = ROLE_NAME;
export const ALL_FOODS = FOODS;
