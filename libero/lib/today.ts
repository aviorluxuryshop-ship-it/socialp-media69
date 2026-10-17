/* ───────────────────────────────────────────────────────────
   "Bugün ne çalışayım?" — akıllı giriş. Saf mantık (DOM/React yok), bozuk veriye karşı dayanıklı.
   Girdi libero:v1 durumundan (lib/store.ts → sanitize) gelir; ama bu fonksiyon yine de her alanı
   tür-denetimiyle okur: eksik/bozuk alan sessizce atlanır, hiçbir koşulda istisna fırlatmaz.

   Öncelik sırası (her adım gerçek veriye dayanır; uydurma sayı/başarı yok):
     1. Yarım kalan antrenman (status: 'active')           → devam et
     2. Programda bugüne atanmış, bugün bitirilmemiş oturum → bugünün antrenmanı
     3. Programda sıradaki gün                               → sıradaki antrenman
     4. Son ziyaret edilen sayfa                             → kaldığın yerden
     5. Seviyeye/pozisyona uygun, az çalışılmış teknik       → günün tekniği (güne göre sabit)
     6. Hiçbiri yoksa                                        → kütüphaneden başla
   ─────────────────────────────────────────────────────────── */

export interface TodayTech {
  id: string;
  name: string;
  /** kategori adı (görünen) */
  cat: string;
  /** tekniğin zorluk derecesi 1–5 */
  lv: number;
  /** uygun pozisyon kimlikleri */
  pos: string[];
  /** temas yüzeyi / uygulama biçimi (kısa) */
  contact?: string;
}

export interface TodayInput {
  level: unknown;
  positions: unknown;
  program: unknown;
  logs: unknown;
  lastVisit: unknown;
  practiced: unknown;
  /** 0 = Pazartesi … 6 = Pazar */
  dayIndex: number;
  /** YYYY-MM-DD (yerel) */
  dateKey: string;
  techs: TodayTech[];
}

export type TodayKind = 'continue-session' | 'todays-session' | 'next-session' | 'continue-visit' | 'technique' | 'start';

export interface TodayPick {
  kind: TodayKind;
  /** küçük üst başlık */
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
  chips: string[];
  /** 0–1: yalnızca "continue-session" için set/ilerleme oranı */
  progress?: number;
}

export const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const LEVEL_TITLES: Record<number, string> = { 1: 'Başlangıç', 2: 'Gelişen', 3: 'Orta', 4: 'İleri', 5: 'Uzman' };
const ENV_NAMES: Record<string, string> = { ev: 'Ev', salon: 'Salon', saha: 'Saha' };
const FOCUS_NAMES: Record<string, string> = {
  teknik: 'Teknik',
  'alt-vucut': 'Alt vücut',
  'ust-vucut': 'Üst vücut',
  merkez: 'Merkez bölge',
  'hiz-ceviklik': 'Sürat ve çeviklik',
  saha: 'Saha çalışması',
  dayaniklilik: 'Dayanıklılık',
  toparlanma: 'Toparlanma',
  serbest: 'Serbest antrenman',
};

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function safeLevel(v: unknown): number {
  const n = Math.round(num(v, 2));
  return Math.min(5, Math.max(1, n));
}

/** Gün anahtarından sabit sözde-rastgele sayı (aynı gün aynı sonuç). */
export function hashKey(key: string): number {
  let h = 7;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** JS getDay() (0 = Pazar) → 0 = Pazartesi */
export function mondayIndex(jsDay: number): number {
  return (((jsDay + 6) % 7) + 7) % 7;
}

interface SessionLite {
  id: string;
  title: string;
  focus: string;
  env: string;
  minutes: number;
  day: number | null;
}

function readSessions(program: unknown): SessionLite[] {
  if (!isObj(program) || !Array.isArray(program.sessions)) return [];
  const out: SessionLite[] = [];
  for (const s of program.sessions) {
    if (!isObj(s)) continue;
    const id = str(s.id);
    const title = str(s.title);
    if (!id || !title) continue;
    const day = typeof s.day === 'number' && Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 ? s.day : null;
    out.push({ id, title, focus: str(s.focus), env: str(s.env), minutes: Math.max(0, Math.round(num(s.minutes))), day });
  }
  return out;
}

interface LogLite {
  sessionId: string;
  status: string;
  date: string;
  startedAt: string;
  title: string;
  done: number;
  total: number;
}

function readLogs(logs: unknown): LogLite[] {
  if (!Array.isArray(logs)) return [];
  const out: LogLite[] = [];
  for (const l of logs) {
    if (!isObj(l)) continue;
    const items = Array.isArray(l.items) ? l.items : [];
    const progress = isObj(l.progress) ? l.progress : {};
    let done = 0;
    let total = 0;
    for (const it of items) {
      if (!isObj(it)) continue;
      const sets = Math.max(0, Math.round(num(it.sets, 0)));
      total += sets;
      done += Math.min(sets, Math.max(0, Math.round(num(progress[str(it.key)], 0))));
    }
    out.push({
      sessionId: str(l.sessionId),
      status: str(l.status),
      date: str(l.date),
      startedAt: str(l.startedAt),
      title: str(l.title, 'Antrenman'),
      done,
      total,
    });
  }
  return out;
}

function sessionLine(s: SessionLite): string {
  const parts = [`${s.minutes || '—'} dk`, ENV_NAMES[s.env] ?? '', FOCUS_NAMES[s.focus] ?? ''].filter(Boolean);
  return parts.join(' · ');
}

export function pickToday(input: TodayInput): TodayPick {
  const level = safeLevel(input.level);
  const positions = Array.isArray(input.positions) ? input.positions.filter((p): p is string => typeof p === 'string') : [];
  const logs = readLogs(input.logs);
  const sessions = readSessions(input.program);
  const dayIndex = Number.isInteger(input.dayIndex) ? Math.min(6, Math.max(0, input.dayIndex)) : 0;

  // 1) yarım kalan antrenman
  const active = logs.filter((l) => l.status === 'active').sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
  if (active) {
    return {
      kind: 'continue-session',
      eyebrow: 'Yarım kalan antrenman',
      title: active.title,
      detail: active.total ? `${active.done}/${active.total} set tamamlandı. Kaldığın yerden devam edebilirsin.` : 'Kaldığın yerden devam edebilirsin.',
      href: '/program/',
      cta: 'Antrenmana devam et',
      chips: [],
      progress: active.total ? Math.min(1, active.done / active.total) : 0,
    };
  }

  // 2–3) program
  if (sessions.length) {
    const doneToday = new Set(logs.filter((l) => l.status === 'done' && l.date === input.dateKey).map((l) => l.sessionId));
    const planned = sessions.filter((s) => s.day !== null);
    const todays = planned.find((s) => s.day === dayIndex && !doneToday.has(s.id));
    if (todays) {
      return {
        kind: 'todays-session',
        eyebrow: 'Bugünün antrenmanı',
        title: todays.title,
        detail: 'Programında bugüne yerleştirilmiş oturum. Hareketleri ayrıntısıyla görüp başlayabilirsin.',
        href: '/program/',
        cta: 'Antrenmanı aç',
        chips: sessionLine(todays).split(' · ').filter(Boolean),
      };
    }
    if (planned.length) {
      let best: SessionLite | null = null;
      let bestGap = 8;
      for (const s of planned) {
        const gap = (((s.day as number) - dayIndex - 1 + 7) % 7) + 1; // 1..7 (bugün 7)
        if (gap < bestGap) {
          bestGap = gap;
          best = s;
        }
      }
      if (best) {
        return {
          kind: 'next-session',
          eyebrow: 'Sıradaki antrenman',
          title: best.title,
          detail:
            bestGap === 1
              ? 'Yarın planlı. Bugün hafif bir teknik çalışmasıyla hazırlanabilirsin.'
              : bestGap === 7
                ? 'Bugünkü oturumu bitirdin. Sıradaki oturum haftaya aynı gün.'
                : `${DAY_NAMES[best.day as number]} günü planlı. Programını görmek için aç.`,
          href: '/program/',
          cta: 'Programı aç',
          chips: [DAY_NAMES[best.day as number], ...sessionLine(best).split(' · ').filter(Boolean)],
        };
      }
    }
  }

  // 4) son ziyaret
  if (isObj(input.lastVisit)) {
    const path = str(input.lastVisit.path);
    const title = str(input.lastVisit.title);
    if (path.startsWith('/') && path !== '/' && title) {
      return {
        kind: 'continue-visit',
        eyebrow: 'Kaldığın yerden',
        title,
        detail: 'En son baktığın sayfa. Kaldığın yerden devam et.',
        href: path,
        cta: 'Devam et',
        chips: [],
      };
    }
  }

  // 5) günün tekniği
  const practiced = isObj(input.practiced) ? input.practiced : {};
  const count = (id: string): number => {
    const p = practiced[id];
    return isObj(p) ? Math.max(0, Math.round(num(p.count))) : 0;
  };
  const pool = input.techs.filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string' && Math.abs(t.lv - level) <= 1);
  if (pool.length) {
    const matchPos = positions.length ? pool.filter((t) => t.pos.some((p) => positions.includes(p))) : [];
    const base = matchPos.length >= 3 ? matchPos : pool;
    const fewest = Math.min(...base.map((t) => count(t.id)));
    const cand = base.filter((t) => count(t.id) === fewest);
    const t = cand[hashKey(input.dateKey) % cand.length];
    const personal = positions.length > 0 && matchPos.length >= 3;
    return {
      kind: 'technique',
      eyebrow: 'Günün tekniği',
      title: t.name,
      detail: personal
        ? 'Seviyene ve pozisyonuna uygun, en az çalıştığın tekniklerden biri.'
        : 'Seviyene uygun bir teknik. Profilinde pozisyon seçersen öneriler pozisyonuna göre daralır.',
      href: `/teknikler/${t.id}/`,
      cta: 'Tekniği aç',
      chips: [t.cat, `Zorluk ${t.lv}/5`, ...(t.contact ? [t.contact] : [])].slice(0, 3),
    };
  }

  // 6) başla
  return {
    kind: 'start',
    eyebrow: 'Başlamak için',
    title: 'Teknik kütüphanesinden bir hareket seç',
    detail: 'Her tekniği saha diyagramıyla izle, seviyene göre çalış.',
    href: '/teknikler/',
    cta: 'Kütüphaneyi aç',
    chips: [],
  };
}
