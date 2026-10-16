import { EX_BY_ID, type Exercise } from '@/data/exercises';
import {
  ENV_NAME,
  EQUIP_NAME,
  availableEquip,
  equipUnion,
  supervisionMissing,
  migrateEquipment,
  type Env,
  type EquipByEnv,
  type EquipId,
} from './environments';
import { allowedFor, ageBand, BAND_RULES, doseFor } from './training';
import type { PlannedItem, PlannedSession, Program, ProgramInput, SessionFocus } from './program-types';
import type { Level, PositionId } from './types';
import { uid } from './utils';

/** İstemciye giden hafif teknik/alıştırma dizini (/drills.json) */
export interface DrillTech {
  id: string;
  name: string;
  cat: string;
  lv: number;
  pos: PositionId[];
  safe: boolean;
  drills: { lvl: number; name: string; how: string; dose: string }[];
}

/**
 * Oturum odakları. `teknik` ve `saha` eski (v1) programlarda kayıtlıdır ve görüntülenmeye
 * devam eder; yeni program üreticisi yalnızca fiziksel odakları üretir.
 */
export const FOCUS_NAME: Record<SessionFocus | 'serbest', string> = {
  teknik: 'Teknik çalışma',
  'alt-vucut': 'Alt vücut kuvveti',
  'ust-vucut': 'Üst vücut ve gövde',
  merkez: 'Merkez bölge ve sakatlık önleme',
  'hiz-ceviklik': 'Sürat ve çeviklik',
  saha: 'Saha çalışması',
  dayaniklilik: 'Dayanıklılık',
  toparlanma: 'Toparlanma',
  serbest: 'Serbest antrenman',
};

/** Program hedefleri: hepsi fiziksel gelişim odaklıdır (taktik ve teknik ayrı bölümlerdedir). */
export const GOALS: { id: string; name: string; hint: string }[] = [
  { id: 'dengeli', name: 'Dengeli fiziksel gelişim', hint: 'Kuvvet, sürat, çeviklik ve dayanıklılık birlikte' },
  { id: 'hiz-cio', name: 'Hız ve çeviklik', hint: 'Sürat, ivmelenme, yön değiştirme' },
  { id: 'dayaniklilik', name: 'Dayanıklılık', hint: 'Maç temposuna dayanıklılık' },
  { id: 'kuvvet-guc', name: 'Kuvvet ve güç', hint: 'Bacak/gövde kuvveti, sıçrama gücü' },
];

export const PATTERNS: Record<string, string[][]> = {
  'alt-vucut': [
    ['sandalyeye-oturma', 'comelme', 'goblet-squat', 'bacak-pres', 'halter-squat'],
    ['kalca-kopru', 'tek-bacak-kalca-kopru', 'hip-thrust', 'bacak-curl-makine', 'romen-deadlift', 'nordic'],
    ['geri-hamle', 'yuruyus-hamlesi', 'dambil-yuruyus-hamle', 'step-up', 'bulgar-split', 'tek-bacak-cokme'],
    ['baldir', 'tek-ayak-baldir'],
    ['yan-hamle', 'bant-yan-yuruyus', 'kopenhag'],
  ],
  'ust-vucut': [
    ['diz-ustu-sinav', 'sinav', 'gogus-press-makine', 'dambil-bench-press', 'omuz-press'],
    ['bant-kurek', 'masa-alti-kurek', 'dambil-kurek', 'lat-cekis', 'oturarak-kurek', 'barfiks'],
    ['olu-bocek', 'kus-kopek', 'plank', 'yan-plank', 'pallof'],
    ['plank', 'yan-plank', 'dag-tirmanisi', 'bacak-kaldirma', 'kablo-odun-kesme'],
    ['bant-acma', 'kablo-yuz-cekis'],
  ],
  merkez: [
    ['olu-bocek', 'kus-kopek', 'plank'],
    ['yan-plank', 'pallof', 'kablo-odun-kesme'],
    ['dag-tirmanisi', 'bacak-kaldirma'],
    ['kopenhag', 'yan-hamle', 'bant-yan-yuruyus'],
    ['nordic', 'kalca-kopru'],
    ['tek-ayak-denge', 'denge-top'],
  ],
  'hiz-ceviklik': [
    ['sprint-abc', 'duvar-ivme', 'yerinde-yuksek-diz'],
    ['ivmelenme-10m', 'sprint-20-30', 'direncli-sprint'],
    ['ip-merdiven', 'zigzag-koni', 'tt-testi', 'mekik-5-10-5', 'hizli-ayak'],
    ['reaktif-ceviklik', 'zigzag-koni', 'top-yon-degistirme'],
    ['inis-calismasi', 'squat-jump'],
    ['yan-sicrama', 'tek-ayak-hop', 'kutu-sicrama'],
  ],
  dayaniklilik: [
    ['surekli-kosu', 'kardiyo-surekli', 'ip-atlama', 'yerinde-yuksek-diz'],
    ['aralikli-kosu', 'kardiyo-aralikli', 'mekik-kosusu', 'merdiven-cikma'],
    ['tekrarli-sprint', 'mekik-kosusu', 'ip-atlama'],
  ],
  toparlanma: [['soguma-yuruyus'], ['dunyanin-en-iyi', 'derin-comelme-durus'], ['statik-esneme'], ['kopuk-silindir', 'nefes-gevseme']],
  /** sahada tek başına yapılan top çalışmaları (en fazla bir tanesi sürat/dayanıklılık oturumlarına eklenir) */
  top: [['top-slalom', 'top-yon-degistirme', 'topla-sprint', 'top-sektirme']],
};

interface Ctx {
  input: ProgramInput;
  by: EquipByEnv;
  used: Map<string, number>;
  cap: Level;
}

/** Salon ortamında "gerçek salon" hareketlerini öne almak için: salona özgü ya da yüklü ekipman */
const GYM_TOKENS = new Set(['halter', 'makine', 'kablo', 'bench', 'dambil', 'barfiks', 'kutu', 'kardiyo']);

/**
 * Egzersiz bu ortamda, bu kullanıcı için yapılabilir mi?
 * (1) yaşa uygun, (2) seviye sınırı içinde, (3) ortam için işaretli,
 * (4) gerektirdiği TÜM ekipman o ortamda kullanıcı tarafından seçilmiş ya da her zaman var.
 */
export function usable(ex: Exercise, input: { age: number; band?: string }, by: EquipByEnv, cap: Level, env: Env): boolean {
  if (!allowedFor(ex, input.age)) return false;
  if (ex.lv > cap) return false;
  if (!ex.env.includes(env)) return false;
  const avail = availableEquip(env, by[env] ?? [], input.age);
  return ex.equip.every((e) => e === 'yok' || avail.has(e));
}

function pickFrom(list: string[], ctx: Ctx, env: Env, target: Level): Exercise | null {
  const cands = list
    .map((id) => EX_BY_ID[id])
    .filter((e): e is Exercise => !!e && usable(e, ctx.input, ctx.by, ctx.cap, env));
  if (!cands.length) return null;
  const gym = (e: Exercise) => (env === 'salon' && e.equip.some((q) => GYM_TOKENS.has(q)) ? 0 : 1);
  cands.sort((a, b) => {
    const da = Math.abs(a.lv - target) + (a.lv > target ? 0.4 : 0);
    const db = Math.abs(b.lv - target) + (b.lv > target ? 0.4 : 0);
    const ua = ctx.used.get(a.id) ?? 0;
    const ub = ctx.used.get(b.id) ?? 0;
    return gym(a) - gym(b) || ua - ub || da - db;
  });
  return cands[0];
}

function exItem(ex: Exercise, ctx: Ctx, idx: number, note?: string): PlannedItem {
  const d = doseFor(ex, ageBand(ctx.input.age), ctx.input.level);
  ctx.used.set(ex.id, (ctx.used.get(ex.id) ?? 0) + 1);
  return { key: `${ex.id}-${idx}`, ref: ex.id, kind: 'ex', name: ex.name, sets: d.sets, dose: d.text, rest: d.rest, note: note ?? d.note };
}

function warmup(ctx: Ctx): PlannedItem[] {
  const w = EX_BY_ID['dinamik-isinma'];
  return [exItem(w, ctx, 0, 'Her çalışmanın başında; soğuk kasla yoğun çalışmayın.')];
}

function cooldown(ctx: Ctx, base: number): PlannedItem[] {
  const out: PlannedItem[] = [];
  for (const id of ['soguma-yuruyus', 'statik-esneme']) {
    const e = EX_BY_ID[id];
    if (allowedFor(e, ctx.input.age)) out.push(exItem(e, ctx, base + out.length));
  }
  return out;
}

function patternItems(focus: string, ctx: Ctx, env: Env, count: number): PlannedItem[] {
  const target = Math.min(ctx.input.level, ctx.cap) as Level;
  const out: PlannedItem[] = [];
  for (const pat of PATTERNS[focus]) {
    if (out.length >= count) break;
    const ex = pickFrom(pat, ctx, env, target);
    if (ex && !out.some((o) => o.ref === ex.id)) out.push(exItem(ex, ctx, out.length));
  }
  return out;
}

const DAY_PATTERN: Record<number, number[]> = { 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 3, 4, 5], 6: [0, 1, 2, 3, 4, 5] };

type Phys = Exclude<SessionFocus, 'teknik' | 'saha'>;

function focusPlan(goal: string, perWeek: number, band: string, positions: PositionId[]): Phys[] {
  const kids = band === 'u12';
  const base: Record<string, Phys[][]> = {
    dengeli: [
      ['alt-vucut', 'hiz-ceviklik'],
      ['alt-vucut', 'hiz-ceviklik', 'merkez'],
      ['alt-vucut', 'hiz-ceviklik', 'ust-vucut', 'dayaniklilik'],
      ['alt-vucut', 'hiz-ceviklik', 'ust-vucut', 'dayaniklilik', 'merkez'],
      ['alt-vucut', 'hiz-ceviklik', 'ust-vucut', 'dayaniklilik', 'merkez', 'toparlanma'],
    ],
    'hiz-cio': [
      ['hiz-ceviklik', 'alt-vucut'],
      ['hiz-ceviklik', 'alt-vucut', 'merkez'],
      ['hiz-ceviklik', 'alt-vucut', 'hiz-ceviklik', 'merkez'],
      ['hiz-ceviklik', 'alt-vucut', 'hiz-ceviklik', 'merkez', 'ust-vucut'],
      ['hiz-ceviklik', 'alt-vucut', 'hiz-ceviklik', 'merkez', 'ust-vucut', 'toparlanma'],
    ],
    dayaniklilik: [
      ['dayaniklilik', 'merkez'],
      ['dayaniklilik', 'merkez', 'alt-vucut'],
      ['dayaniklilik', 'merkez', 'dayaniklilik', 'hiz-ceviklik'],
      ['dayaniklilik', 'alt-vucut', 'dayaniklilik', 'hiz-ceviklik', 'merkez'],
      ['dayaniklilik', 'alt-vucut', 'dayaniklilik', 'hiz-ceviklik', 'merkez', 'toparlanma'],
    ],
    'kuvvet-guc': [
      ['alt-vucut', 'ust-vucut'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik', 'merkez'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik', 'merkez', 'dayaniklilik'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik', 'merkez', 'dayaniklilik', 'toparlanma'],
    ],
  };
  const row = (base[goal] ?? base.dengeli)[Math.min(4, Math.max(0, perWeek - 2))];
  let plan = [...row];
  // pozisyona özel vurgu: kanat/bek → sürat oturumu mutlaka bulunur
  if (positions.some((p) => p === 'kanat' || p === 'bek') && !plan.includes('hiz-ceviklik')) plan[plan.length - 1] = 'hiz-ceviklik';
  // çocuklarda yüklü kuvvet yok: oyunsal sürat/çeviklik ve gövde çalışmaları
  if (kids) plan = plan.map((f) => (f === 'alt-vucut' ? 'hiz-ceviklik' : f === 'ust-vucut' ? 'merkez' : f));
  return plan;
}

function sessionTitle(focus: SessionFocus, n: number): string {
  const same = n > 1 ? ` ${n}` : '';
  return FOCUS_NAME[focus] + same;
}

/** Odak için ortam tercih sırası (kullanıcının seçtikleri arasından) */
function envOrder(focus: Phys, envs: Env[], age: number): Env[] {
  const pref: Record<Phys, Env[]> = {
    // yüklü kuvvet: salon (12 yaş ve üstü), sonra ev, sonra saha
    'alt-vucut': age >= 12 ? ['salon', 'ev', 'saha'] : ['ev', 'saha', 'salon'],
    'ust-vucut': age >= 12 ? ['salon', 'ev', 'saha'] : ['ev', 'saha', 'salon'],
    // gövde: evde de rahat yapılır
    merkez: ['ev', 'salon', 'saha'],
    'hiz-ceviklik': ['saha', 'ev', 'salon'],
    dayaniklilik: ['saha', 'salon', 'ev'],
    toparlanma: ['ev', 'saha', 'salon'],
  };
  return pref[focus].filter((e) => envs.includes(e));
}

function itemsFor(focus: Phys, ctx: Ctx, env: Env, mainSlots: number): PlannedItem[] {
  switch (focus) {
    case 'alt-vucut':
    case 'ust-vucut':
      return patternItems(focus, ctx, env, Math.max(3, Math.min(5, mainSlots)));
    case 'merkez':
      return patternItems('merkez', ctx, env, Math.max(4, Math.min(6, mainSlots + 1)));
    case 'hiz-ceviklik': {
      const items = patternItems('hiz-ceviklik', ctx, env, Math.max(3, Math.min(5, mainSlots)));
      return env === 'saha' ? withSoloBall(items, ctx) : items;
    }
    case 'dayaniklilik': {
      const items = patternItems('dayaniklilik', ctx, env, 2);
      return env === 'saha' ? withSoloBall(items, ctx) : items;
    }
    case 'toparlanma':
      return patternItems('toparlanma', ctx, env, 4);
  }
}

/** Sahada, seçilmiş top/koni ile tek başına yapılabilen bir top çalışması ekler (varsa). */
function withSoloBall(items: PlannedItem[], ctx: Ctx): PlannedItem[] {
  const ex = pickFrom(PATTERNS.top[0], ctx, 'saha', Math.min(ctx.input.level, ctx.cap) as Level);
  if (!ex) return items;
  return [...items, exItem(ex, ctx, 90, 'Bireysel top çalışması: tek başınıza, kısa ve kaliteli tekrarlarla.')];
}

/** Yaş ve seviyeye göre egzersiz zorluk sınırı */
export function levelCap(age: number, level: Level): Level {
  return (age < 12 ? 2 : age < 15 ? 3 : Math.min(5, level + 1)) as Level;
}

/** Programın ekipman seçimi (eski programlarda yalnızca düz liste olabilir) */
export function equipByEnvOf(input: ProgramInput): EquipByEnv {
  const envs = (input.envs.length ? input.envs : ['ev']) as Env[];
  return input.equipByEnv ? ({ ev: [], salon: [], saha: [], ...input.equipByEnv } as EquipByEnv) : migrateEquipment(input.equipment, envs);
}

/**
 * Bir oturumdaki egzersiz için GEÇERLİ alternatifler: aynı oturum ortamında, seçilmiş ekipmanla,
 * yaşa ve seviyeye uygun, oturumda zaten bulunmayan hareketler. Hiçbir geçerli alternatif yoksa boş döner.
 */
export function alternativesFor(exId: string, session: PlannedSession, program: Program): Exercise[] {
  const ex = EX_BY_ID[exId];
  if (!ex) return [];
  const input = program.input;
  const by = equipByEnvOf(input);
  const cap = levelCap(input.age, input.level);
  const inSession = new Set(session.items.map((i) => i.ref));
  return ex.alt
    .map((id) => EX_BY_ID[id])
    .filter((a): a is Exercise => !!a && a.id !== ex.id && !inSession.has(a.id) && usable(a, input, by, cap, session.env));
}

export function generateProgram(input: ProgramInput): Program {
  const band = ageBand(input.age);
  const cap: Level = levelCap(input.age, input.level);
  const envs = (input.envs.length ? input.envs : ['ev']) as Env[];
  const by: EquipByEnv = equipByEnvOf(input);
  const ctx: Ctx = { input: { ...input, band }, by, used: new Map(), cap };
  const plan = focusPlan(input.goal, input.perWeek, band, input.positions);
  const counts: Record<string, number> = {};
  const days = DAY_PATTERN[Math.min(6, Math.max(2, input.perWeek))];
  const mainSlots = Math.max(2, Math.floor((input.minutes - 15) / 8));
  let shortSessions = 0;

  const needFor = (f: Phys) => (f === 'toparlanma' || f === 'dayaniklilik' ? 2 : 3);

  /** Odak için tercih sırasındaki ortamları dene; yeterli (≥3) egzersiz bulunan ilkini, yoksa en çok bulunanı al. */
  const build = (focus: Phys): { env: Env; items: PlannedItem[] } => {
    const candidates = envOrder(focus, envs, input.age);
    const order = candidates.length ? candidates : envs;
    const attempts: { env: Env; items: PlannedItem[]; used: Map<string, number> }[] = [];
    for (const env of order) {
      const before = new Map(ctx.used);
      ctx.used = new Map(before);
      const items = itemsFor(focus, ctx, env, mainSlots);
      attempts.push({ env, items, used: ctx.used });
      ctx.used = before;
      if (items.length >= needFor(focus)) break;
    }
    const best = attempts.reduce<(typeof attempts)[number] | null>((m, a) => (!m || a.items.length > m.items.length ? a : m), null);
    if (best) ctx.used = best.used;
    return { env: best?.env ?? order[0] ?? 'ev', items: best?.items ?? [] };
  };

  let swapped = 0;
  const sessions: PlannedSession[] = plan.map((planned, i) => {
    let focus: Phys = planned;
    const usedBefore = new Map(ctx.used);
    let res = build(focus);
    // Seçilen ortam/ekipman/yaşla bu odak için yeterli hareket yoksa gövde ve denge çalışmasına çevir
    if (res.items.length < needFor(focus) && focus !== 'merkez' && focus !== 'toparlanma') {
      const usedAfterFirst = ctx.used;
      ctx.used = new Map(usedBefore); // vazgeçilen denemenin sayaçları kalmasın
      const alt = build('merkez');
      if (alt.items.length >= needFor('merkez')) {
        focus = 'merkez';
        res = alt;
        swapped++;
      } else {
        ctx.used = usedAfterFirst; // alternatif de yetersiz: ilk denemeyi koru
      }
    }
    counts[focus] = (counts[focus] ?? 0) + 1;
    if (res.items.length < needFor(focus)) shortSessions++;
    const core = focus === 'toparlanma' ? [] : warmup(ctx);
    const close = focus === 'toparlanma' ? [] : cooldown(ctx, 20);
    const all = [...core, ...res.items, ...close].map((it, k) => ({ ...it, key: `${it.ref}-${k}` }));
    return {
      id: uid(),
      title: sessionTitle(focus, counts[focus]),
      focus,
      env: res.env,
      minutes: input.minutes,
      items: all,
      day: days[i] ?? null,
    };
  });

  const notes: string[] = [];
  notes.push(`${BAND_RULES[band].title}: ${BAND_RULES[band].rules[0]}`);
  notes.push('Bu program fiziksel gelişim içindir: kuvvet, denge, çeviklik, sürat ve dayanıklılık. Taktik ve topsuz oyun çalışmaları Taktik bölümündedir; teknik alıştırmalar Teknikler bölümünde, her tekniğin sayfasındadır.');
  for (const e of envs) {
    const sel = by[e] ?? [];
    const names = sel.map((id) => EQUIP_NAME[id]).filter(Boolean);
    const avail = availableEquip(e, sel, input.age);
    const dropped = sel.filter((id) => !avail.has(id));
    notes.push(
      `${ENV_NAME[e]}: ${names.length ? names.join(', ') : 'ekipmansız'}.` +
        (dropped.length ? ` Yaşınıza uygun olmadığı için kullanılmayan: ${dropped.map((id) => EQUIP_NAME[id]).join(', ')}.` : ''),
    );
  }
  if (input.age < 18 && envs.some((e) => supervisionMissing(e, by[e] ?? [], input.age))) notes.push('18 yaş altında yüklü çalışma (dambıl, halter, makine, kablo, bench) yalnızca gözetim altında yapılır. "Antrenman arkadaşı ya da antrenör" seçilmediği için bu hareketler programa alınmadı; seçip programı yeniden oluşturabilirsiniz.');
  notes.push('Haftalık plan esnektir: oturumları istediğiniz güne taşıyabilirsiniz. Arka arkaya iki yoğun alt vücut ya da sprint gününden kaçının.');
  if (input.positions.some((p) => p === 'kanat' || p === 'bek')) notes.push('Pozisyon vurgusu: kanat/bek için sürat ve çeviklik oturumu programda yer alır.');
  if (swapped > 0) notes.push('Seçtiğiniz ortam, ekipman ve yaşla yapılabilen uygun hareket bulunmayan oturumlar gövde ve denge çalışmasına çevrildi.');
  if (shortSessions > 0) notes.push('Seçtiğiniz ortam ve ekipmana uygun daha az egzersiz bulunduğu için bazı oturumlar kısa kalmış olabilir. Profilinizden ortam ya da ekipman ekleyip programı yeniden oluşturabilirsiniz; hiçbir oturumda seçmediğiniz ekipman gerektiren hareket yer almaz.');

  const equipment = equipUnion(by, envs) as EquipId[];
  return { id: uid(), createdAt: new Date().toISOString(), input: { ...input, band, equipment, equipByEnv: by }, sessions, notes };
}

