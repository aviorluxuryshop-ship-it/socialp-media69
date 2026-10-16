import { EX_BY_ID, type Exercise } from '@/data/exercises';
import { POSITION_BY_ID } from '@/data/positions';
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

export const GOALS: { id: string; name: string; hint: string }[] = [
  { id: 'dengeli', name: 'Dengeli gelişim', hint: 'Teknik, kuvvet, sürat ve dayanıklılık birlikte' },
  { id: 'teknik', name: 'Teknik', hint: 'Topla çalışmaya ağırlık' },
  { id: 'hiz-cio', name: 'Hız ve çeviklik', hint: 'Sürat, ivmelenme, yön değiştirme' },
  { id: 'dayaniklilik', name: 'Dayanıklılık', hint: 'Maç temposuna dayanıklılık' },
  { id: 'kuvvet-guc', name: 'Kuvvet ve güç', hint: 'Bacak/gövde kuvveti, sıçrama gücü' },
];

export const PATTERNS: Record<string, string[][]> = {
  'alt-vucut': [
    ['sandalyeye-oturma', 'comelme', 'goblet-squat', 'bacak-pres', 'halter-squat'],
    ['kalca-kopru', 'tek-bacak-kalca-kopru', 'romen-deadlift', 'nordic'],
    ['geri-hamle', 'yuruyus-hamlesi', 'step-up', 'bulgar-split', 'tek-bacak-cokme'],
    ['baldir', 'tek-ayak-baldir'],
    ['yan-hamle', 'kopenhag'],
  ],
  'ust-vucut': [
    ['diz-ustu-sinav', 'sinav', 'omuz-press'],
    ['bant-acma', 'masa-alti-kurek', 'dambil-kurek', 'barfiks'],
    ['olu-bocek', 'kus-kopek', 'plank', 'yan-plank', 'pallof'],
    ['plank', 'yan-plank', 'dag-tirmanisi', 'bacak-kaldirma'],
  ],
  merkez: [
    ['olu-bocek', 'kus-kopek', 'plank'],
    ['yan-plank', 'pallof'],
    ['dag-tirmanisi', 'bacak-kaldirma'],
    ['kopenhag', 'yan-hamle'],
    ['nordic', 'kalca-kopru'],
    ['tek-ayak-denge', 'denge-top'],
  ],
  'hiz-ceviklik': [
    ['sprint-abc', 'duvar-ivme'],
    ['ivmelenme-10m', 'sprint-20-30', 'direncli-sprint'],
    ['ip-merdiven', 'zigzag-koni', 'tt-testi', 'mekik-5-10-5'],
    ['reaktif-ceviklik', 'zigzag-koni'],
    ['inis-calismasi', 'squat-jump', 'yan-sicrama', 'tek-ayak-hop', 'kutu-sicrama'],
  ],
  dayaniklilik: [['surekli-kosu', 'aralikli-kosu'], ['aralikli-kosu', 'mekik-kosusu'], ['tekrarli-sprint', 'mekik-kosusu']],
  toparlanma: [['soguma-yuruyus'], ['dunyanin-en-iyi', 'derin-comelme-durus'], ['statik-esneme'], ['kopuk-silindir', 'nefes-gevseme']],
};

interface Ctx {
  input: ProgramInput;
  used: Map<string, number>;
  cap: Level;
}

const ENV_OF: Record<string, 'ev' | 'salon' | 'saha'> = { ev: 'ev', salon: 'salon', saha: 'saha' };

function usable(ex: Exercise, ctx: Ctx, env: 'ev' | 'salon' | 'saha'): boolean {
  if (!allowedFor(ex, ctx.input.age)) return false;
  if (ex.lv > ctx.cap) return false;
  if (!ex.env.includes(env) && !(env !== 'saha' && ex.env.includes('ev'))) return false;
  const eq = new Set<string>(['yok', ...ctx.input.equipment]);
  if (env === 'salon') eq.add('salon');
  return ex.equip.every((e) => eq.has(e));
}

function pickFrom(list: string[], ctx: Ctx, env: 'ev' | 'salon' | 'saha', target: Level): Exercise | null {
  const cands = list
    .map((id) => EX_BY_ID[id])
    .filter((e): e is Exercise => !!e && usable(e, ctx, env));
  if (!cands.length) return null;
  cands.sort((a, b) => {
    const da = Math.abs(a.lv - target) + (a.lv > target ? 0.4 : 0);
    const db = Math.abs(b.lv - target) + (b.lv > target ? 0.4 : 0);
    const ua = ctx.used.get(a.id) ?? 0;
    const ub = ctx.used.get(b.id) ?? 0;
    return ua - ub || da - db;
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

function techniqueItems(ctx: Ctx, techs: DrillTech[], count: number, techLevel: (id: string) => Level): PlannedItem[] {
  const { input } = ctx;
  const age = input.age;
  let pool = techs.filter((t) => {
    if (age < 12 && (t.cat === 'kafa' || t.safe)) return false;
    if (age < 15 && (t.id === 'ucarak-kafa' || t.id === 'kayarak-mudahale')) return false;
    return true;
  });
  const fav = new Set<string>();
  for (const p of input.positions) for (const id of POSITION_BY_ID[p]?.keyTechs ?? []) fav.add(id);
  const gk = input.positions.includes('kaleci');
  if (fav.size) pool = pool.filter((t) => fav.has(t.id));
  else if (!gk) pool = pool.filter((t) => ['pas', 'kontrol', 'surme', 'sut', 'topsuz', 'bitiricilik'].includes(t.cat));
  if (!pool.length) pool = techs;
  const scored = pool
    .map((t) => ({ t, lv: techLevel(t.id), s: (ctx.used.get(t.id) ?? 0) * 2 + Math.abs(t.lv - techLevel(t.id)) }))
    .sort((a, b) => a.s - b.s || a.t.name.localeCompare(b.t.name, 'tr'));
  const out: PlannedItem[] = [];
  for (const { t, lv } of scored) {
    if (out.length >= count) break;
    const drill = [...t.drills].sort((a, b) => Math.abs(a.lvl - lv) - Math.abs(b.lvl - lv))[0];
    if (!drill) continue;
    ctx.used.set(t.id, (ctx.used.get(t.id) ?? 0) + 1);
    out.push({
      key: `${t.id}-${out.length}`,
      ref: t.id,
      kind: 'tech',
      name: `${t.name}: ${drill.name}`,
      sets: 1,
      dose: drill.dose,
      rest: '—',
      note: drill.how,
    });
  }
  return out;
}

function strengthItems(focus: string, ctx: Ctx, env: 'ev' | 'salon' | 'saha', count: number): PlannedItem[] {
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

function focusPlan(goal: string, perWeek: number, band: string, positions: PositionId[]): SessionFocus[] {
  const kids = band === 'u12';
  const base: Record<string, SessionFocus[][]> = {
    dengeli: [
      ['teknik', 'hiz-ceviklik'],
      ['teknik', 'alt-vucut', 'hiz-ceviklik'],
      ['teknik', 'alt-vucut', 'hiz-ceviklik', 'merkez'],
      ['teknik', 'alt-vucut', 'hiz-ceviklik', 'saha', 'merkez'],
      ['teknik', 'alt-vucut', 'hiz-ceviklik', 'saha', 'ust-vucut', 'toparlanma'],
    ],
    teknik: [
      ['teknik', 'teknik'],
      ['teknik', 'teknik', 'merkez'],
      ['teknik', 'saha', 'teknik', 'hiz-ceviklik'],
      ['teknik', 'saha', 'teknik', 'hiz-ceviklik', 'merkez'],
      ['teknik', 'saha', 'teknik', 'hiz-ceviklik', 'merkez', 'toparlanma'],
    ],
    'hiz-cio': [
      ['hiz-ceviklik', 'alt-vucut'],
      ['hiz-ceviklik', 'alt-vucut', 'teknik'],
      ['hiz-ceviklik', 'alt-vucut', 'teknik', 'hiz-ceviklik'],
      ['hiz-ceviklik', 'alt-vucut', 'teknik', 'hiz-ceviklik', 'merkez'],
      ['hiz-ceviklik', 'alt-vucut', 'teknik', 'hiz-ceviklik', 'merkez', 'toparlanma'],
    ],
    dayaniklilik: [
      ['dayaniklilik', 'teknik'],
      ['dayaniklilik', 'teknik', 'merkez'],
      ['dayaniklilik', 'teknik', 'merkez', 'dayaniklilik'],
      ['dayaniklilik', 'teknik', 'merkez', 'dayaniklilik', 'hiz-ceviklik'],
      ['dayaniklilik', 'teknik', 'merkez', 'dayaniklilik', 'hiz-ceviklik', 'toparlanma'],
    ],
    'kuvvet-guc': [
      ['alt-vucut', 'teknik'],
      ['alt-vucut', 'ust-vucut', 'teknik'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik', 'teknik'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik', 'teknik', 'merkez'],
      ['alt-vucut', 'ust-vucut', 'hiz-ceviklik', 'teknik', 'merkez', 'toparlanma'],
    ],
  };
  const row = (base[goal] ?? base.dengeli)[Math.min(4, Math.max(0, perWeek - 2))];
  let plan = [...row];
  // pozisyona özel vurgu: kanat/bek → hız; kaleci → çeviklik ve güç
  if (positions.some((p) => p === 'kanat' || p === 'bek') && !plan.includes('hiz-ceviklik')) plan[plan.length - 1] = 'hiz-ceviklik';
  if (kids) plan = plan.map((f) => (f === 'alt-vucut' || f === 'ust-vucut' ? 'hiz-ceviklik' : f)) as SessionFocus[];
  return plan;
}

function sessionTitle(focus: SessionFocus, n: number): string {
  const same = n > 1 ? ` ${n}` : '';
  return FOCUS_NAME[focus] + same;
}

export function generateProgram(input: ProgramInput, techs: DrillTech[], techLevel: (id: string) => Level): Program {
  const band = ageBand(input.age);
  const cap: Level = (input.age < 12 ? 2 : input.age < 15 ? 3 : Math.min(5, input.level + 1)) as Level;
  const ctx: Ctx = { input: { ...input, band }, used: new Map(), cap };
  const envs = input.envs.length ? input.envs : ['ev'];
  const hasEnv = (e: string) => envs.includes(e);
  const plan = focusPlan(input.goal, input.perWeek, band, input.positions);
  const counts: Record<string, number> = {};
  const days = DAY_PATTERN[Math.min(6, Math.max(2, input.perWeek))];

  const mainSlots = Math.max(2, Math.floor((input.minutes - 15) / 8));

  const sessions: PlannedSession[] = plan.map((focus, i) => {
    counts[focus] = (counts[focus] ?? 0) + 1;
    const env: 'ev' | 'salon' | 'saha' =
      focus === 'teknik' || focus === 'saha' || focus === 'hiz-ceviklik' || focus === 'dayaniklilik'
        ? hasEnv('saha') ? 'saha' : 'ev'
        : focus === 'alt-vucut' || focus === 'ust-vucut'
          ? hasEnv('salon') && input.age >= 15 ? 'salon' : hasEnv('ev') ? 'ev' : hasEnv('salon') && input.age >= 15 ? 'salon' : 'ev'
          : hasEnv('ev') ? 'ev' : (envs[0] as 'ev');
    let items: PlannedItem[] = [];
    const core = warmup(ctx);
    switch (focus) {
      case 'teknik':
        items = techniqueItems(ctx, techs, Math.max(2, Math.min(5, mainSlots - 1)), techLevel);
        break;
      case 'saha': {
        items = techniqueItems(ctx, techs, 2, techLevel);
        items.push({ key: `oyun-${i}`, ref: 'oyun', kind: 'drill', name: 'Küçük alan oyunu (4v4 ya da 5v5)', sets: 3, dose: '3 × 4 dk', rest: '90 sn', note: 'Eş ya da takım arkadaşlarıyla; her topta tara–al–karar döngüsünü uygulayın.' });
        const run = pickFrom(['aralikli-kosu', 'mekik-kosusu', 'surekli-kosu'], ctx, 'saha', Math.min(input.level, cap) as Level);
        if (run) items.push(exItem(run, ctx, 9));
        break;
      }
      case 'alt-vucut':
        items = strengthItems('alt-vucut', ctx, env, Math.max(3, Math.min(5, mainSlots)));
        break;
      case 'ust-vucut':
        items = strengthItems('ust-vucut', ctx, env, Math.max(3, Math.min(5, mainSlots)));
        break;
      case 'merkez':
        items = strengthItems('merkez', ctx, env, Math.max(4, Math.min(6, mainSlots + 1)));
        break;
      case 'hiz-ceviklik':
        items = strengthItems('hiz-ceviklik', ctx, env === 'saha' ? 'saha' : env, Math.max(3, Math.min(5, mainSlots)));
        break;
      case 'dayaniklilik':
        items = strengthItems('dayaniklilik', ctx, 'saha', 2);
        if (!items.length) items = strengthItems('dayaniklilik', ctx, 'ev', 2);
        break;
      case 'toparlanma':
        items = strengthItems('toparlanma', ctx, 'ev', 4);
        break;
    }
    const close = focus === 'toparlanma' ? [] : cooldown(ctx, 20);
    const all = [...(focus === 'toparlanma' ? [] : core), ...items, ...close].map((it, k) => ({ ...it, key: `${it.ref}-${k}` }));
    return {
      id: uid(),
      title: sessionTitle(focus, counts[focus]),
      focus,
      env,
      minutes: input.minutes,
      items: all,
      day: days[i] ?? null,
    };
  });

  const notes: string[] = [];
  notes.push(`${BAND_RULES[band].title}: ${BAND_RULES[band].rules[0]}`);
  notes.push('Haftalık plan esnektir: oturumları istediğiniz güne taşıyabilirsiniz. Arka arkaya iki yoğun alt vücut ya da sprint gününden kaçının.');
  if (input.positions.length) notes.push(`Pozisyon vurgusu: ${input.positions.map((p) => POSITION_BY_ID[p]?.name).filter(Boolean).join(', ')} için teknik seçimi buna göre yapıldı.`);
  if (sessions.some((s) => s.items.length <= 3)) notes.push('Seçtiğiniz ortam/ekipmana uygun daha az egzersiz bulunduğu için bazı oturumlar kısa kalmış olabilir. Profilinizden ekipman ya da ortam eklerseniz yeniden oluşturabilirsiniz.');

  return { id: uid(), createdAt: new Date().toISOString(), input: { ...input, band }, sessions, notes };
}
