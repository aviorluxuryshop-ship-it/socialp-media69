// Antrenman ortamları (ev / spor salonu / saha) ve her ortamda bulunabilecek ekipman.
// Bu dosya hiçbir şey içe aktarmaz (saf veri + küçük yardımcılar): hem veri katmanı
// (data/exercises.ts) hem program üretici hem arayüz buradan okur.
//
// İlke: Bir egzersiz yalnızca (a) o ortam için işaretliyse ve (b) gerektirdiği ekipmanın
// TAMAMI o ortamda kullanıcı tarafından seçilmişse (ya da ortamda her zaman vardır)
// programa girer. Seçilmemiş ekipman gerektiren hareket asla önerilmez.

export type Env = 'ev' | 'salon' | 'saha';

export type Equip =
  | 'yok'
  | 'top'
  | 'koni'
  | 'bant'
  | 'dambil'
  | 'barfiks'
  | 'merdiven'
  | 'kutu'
  | 'sandalye'
  | 'silindir'
  | 'ip'
  | 'kardiyo'
  | 'bench'
  | 'kablo'
  | 'makine'
  | 'halter'
  | 'es';

/** Kullanıcının seçebildiği (yok ve her zaman bulunanlar hariç) ekipman */
export type EquipId = Exclude<Equip, 'yok'>;

export const ENV_ORDER: Env[] = ['ev', 'salon', 'saha'];

export const ENV_NAME: Record<Env, string> = { ev: 'Ev', salon: 'Spor salonu', saha: 'Saha' };

export const EQUIP_NAME: Record<Equip, string> = {
  yok: 'Ekipman gerekmez',
  top: 'Futbol topu',
  koni: 'Koni / işaret',
  bant: 'Direnç bandı',
  dambil: 'Dambıl',
  barfiks: 'Barfiks barı',
  merdiven: 'Çeviklik (ip) merdiveni',
  kutu: 'Kutu / sağlam basamak',
  sandalye: 'Sağlam sandalye',
  silindir: 'Köpük silindir',
  ip: 'Atlama ipi',
  kardiyo: 'Koşu bandı / bisiklet / kürek',
  bench: 'Bench',
  kablo: 'Kablo (makara) istasyonu',
  makine: 'Direnç makineleri (bacak presi, çekiş vb.)',
  halter: 'Halter ve squat rafı',
  es: 'Antrenman arkadaşı ya da antrenör',
};

/** Yaşa göre en erken kullanılabilecek ekipman (güvenlik: NSCA 2009, AAP 2020) */
export const EQUIP_MIN_AGE: Record<Equip, number> = {
  yok: 0,
  top: 0,
  koni: 0,
  bant: 8,
  dambil: 12,
  barfiks: 12,
  merdiven: 0,
  kutu: 12,
  sandalye: 0,
  silindir: 12,
  ip: 0,
  kardiyo: 12,
  bench: 15,
  kablo: 15,
  makine: 15,
  halter: 15,
  es: 0,
};

/** Yüklü (dış ağırlıklı / makineli) ekipman: 18 yaş altında yalnızca gözetimle (antrenör ya da yetişkin) kullanılır. */
export const LOADED_EQUIP: Equip[] = ['dambil', 'halter', 'makine', 'kablo', 'bench'];

/** Evde dış ağırlık (dambıl) yalnızca yetişkinler için: gözetimsiz ev ekipmanı yaralanma nedenidir (NSCA 2009). */
export const HOME_LOAD_MIN_AGE = 18;

export interface EnvMeta {
  id: Env;
  name: string;
  blurb: string;
  /** kullanıcının seçtiği ekipman listesi (bu ortama özgü) */
  options: EquipId[];
  /** seçim gerekmeyen, ortamda her zaman bulunan ekipman */
  always: Equip[];
  /** ortam ilk kez seçildiğinde varsayılan seçili ekipman */
  defaults: EquipId[];
  /** kısa açıklamalar (arayüzde ekipmanın altında) */
  hints: Partial<Record<EquipId, string>>;
}

export const ENV_META: Record<Env, EnvMeta> = {
  ev: {
    id: 'ev',
    name: 'Ev',
    blurb: 'Evde yapılabilen vücut ağırlığı ve hafif ekipmanlı çalışmalar. Gözetimsiz ağır ya da yüklü çalışma yoktur.',
    options: ['bant', 'dambil', 'merdiven', 'koni', 'ip', 'kutu', 'silindir', 'top', 'es'],
    always: ['yok', 'sandalye'],
    defaults: [],
    hints: {
      es: 'Eş ya da yetişkin gözetimi gerektiren hareketler için',
      bant: 'Hafif–orta direnç bandı',
      dambil: `Yalnızca ${HOME_LOAD_MIN_AGE} yaş ve üstü; gençler için ev dışında, gözetimli ortam önerilir`,
      kutu: 'Alçak, sağlam ve kaymayan basamak ya da kutu',
      ip: 'Atlama ipi',
      top: 'Yumuşak zeminli, güvenli alan',
    },
  },
  salon: {
    id: 'salon',
    name: 'Spor salonu',
    blurb: 'Salondaki makineler ve serbest ağırlıklar. Genç sporcular için antrenör ya da uzman gözetiminde, hafif–orta yükle.',
    options: ['dambil', 'halter', 'makine', 'kablo', 'bench', 'barfiks', 'kutu', 'bant', 'kardiyo', 'silindir', 'es'],
    always: ['yok', 'sandalye'],
    defaults: ['dambil', 'halter', 'makine', 'kablo', 'bench', 'barfiks', 'kutu', 'bant', 'kardiyo', 'silindir'],
    hints: {
      es: '18 yaş altında yüklü çalışma (dambıl, halter, makine, kablo, bench) için gereklidir',
      halter: '15 yaş altı için kullanılmaz',
      makine: '15 yaş altı için kullanılmaz',
      kablo: '15 yaş altı için kullanılmaz',
      bench: '15 yaş altı için kullanılmaz',
    },
  },
  saha: {
    id: 'saha',
    name: 'Saha',
    blurb: 'Açık saha: sürat, çeviklik, dayanıklılık, bireysel top çalışması ve vücut ağırlığıyla kuvvet.',
    options: ['top', 'koni', 'merdiven', 'bant', 'ip', 'es'],
    always: ['yok'],
    defaults: ['top', 'koni'],
    hints: {
      es: 'Eş ya da antrenör gerektiren hareketler için',
      ip: 'Atlama ipi',
      top: 'Bireysel top çalışması için',
      koni: 'Çeviklik ve yön değiştirme için',
    },
  },
};

export type EquipByEnv = Record<Env, EquipId[]>;

export function defaultEquipByEnv(): EquipByEnv {
  return { ev: [...ENV_META.ev.defaults], salon: [...ENV_META.salon.defaults], saha: [...ENV_META.saha.defaults] };
}

const isEnv = (v: unknown): v is Env => v === 'ev' || v === 'salon' || v === 'saha';

/** Bir ortamda, verilen yaş için fiilen kullanılabilir ekipman kümesi. */
export function availableEquip(env: Env, selected: readonly string[], age: number | null): Set<Equip> {
  const meta = ENV_META[env];
  const out = new Set<Equip>(meta.always);
  const a = age ?? 18;
  // 18 yaş altında yüklü ekipman yalnızca "antrenman arkadaşı ya da antrenör" seçiliyse (gözetim) kullanılabilir
  const supervised = a >= 18 || selected.includes('es');
  for (const id of selected) {
    if (!meta.options.includes(id as EquipId)) continue;
    if (a < EQUIP_MIN_AGE[id as EquipId]) continue;
    if (env === 'ev' && id === 'dambil' && a < HOME_LOAD_MIN_AGE) continue;
    if (!supervised && LOADED_EQUIP.includes(id as EquipId)) continue;
    out.add(id as EquipId);
  }
  return out;
}

/** Bir ekipman, bu ortamda ve bu yaşta seçilebilir mi? (arayüzde devre dışı bırakma için) */
/** 18 yaş altında, gözetim seçilmediği için yüklü ekipmanın devre dışı kalıp kalmadığı */
export function supervisionMissing(env: Env, selected: readonly string[], age: number | null): boolean {
  const a = age ?? 18;
  return a < 18 && !selected.includes('es') && selected.some((id) => LOADED_EQUIP.includes(id as Equip) && !(env === 'ev' && id === 'dambil'));
}

export function equipBlockedReason(env: Env, id: EquipId, age: number | null): string | null {
  const a = age ?? 18;
  if (env === 'ev' && id === 'dambil' && a < HOME_LOAD_MIN_AGE) return `Evde dambıl ${HOME_LOAD_MIN_AGE} yaş ve üstü için`;
  if (a < EQUIP_MIN_AGE[id]) return `${EQUIP_MIN_AGE[id]} yaş ve üstü için`;
  return null;
}

export function equipUnion(by: EquipByEnv, envs: readonly Env[]): EquipId[] {
  const s = new Set<EquipId>();
  for (const e of envs) for (const x of by[e] ?? []) s.add(x);
  return [...s];
}

/**
 * Eski (v1) profilde tek bir düz ekipman listesi vardı. Ortam başına seçime dönüştürür:
 * her ortam yalnızca kendisinde bulunabilen ekipmanı alır; salon seçildiyse salon varsayılanları
 * (eski "salon" seçeneği tam donanımlı salon anlamına geliyordu).
 */
export function migrateEquipment(legacy: unknown, envs: readonly string[]): EquipByEnv {
  const list = Array.isArray(legacy) ? legacy.filter((x): x is string => typeof x === 'string') : [];
  const by = defaultEquipByEnv();
  by.ev = ENV_META.ev.options.filter((o) => list.includes(o));
  by.saha = ENV_META.saha.options.filter((o) => list.includes(o));
  return by;
}

/** Depodan okunan ortam-ekipman alanını güvenli biçime getirir. */
export function sanitizeEquipByEnv(raw: unknown, fallback: EquipByEnv): EquipByEnv {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  const out = defaultEquipByEnv();
  for (const e of ENV_ORDER) {
    const v = r[e];
    out[e] = Array.isArray(v) ? (v.filter((x) => typeof x === 'string' && ENV_META[e].options.includes(x as EquipId)) as EquipId[]) : fallback[e];
  }
  return out;
}

export function sanitizeEnvs(raw: unknown, fallback: Env[]): Env[] {
  if (!Array.isArray(raw)) return fallback;
  const out = raw.filter(isEnv);
  return out.length ? [...new Set(out)] : fallback;
}
