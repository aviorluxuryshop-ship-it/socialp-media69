import type { Level } from '@/lib/types';
import type { Env, Equip } from '@/lib/environments';

export type { Env, Equip };

export type MuscleId =
  | 'quad'
  | 'hamstring'
  | 'glute'
  | 'calf'
  | 'adductor'
  | 'hipflex'
  | 'core'
  | 'back'
  | 'chest'
  | 'shoulder'
  | 'arm'
  | 'neck';

export const MUSCLE_NAME: Record<string, string> = {
  quad: 'Ön bacak (kuadriseps)',
  hamstring: 'Arka bacak (hamstring)',
  glute: 'Kalça (gluteus)',
  calf: 'Baldır',
  adductor: 'İç bacak',
  hipflex: 'Kalça önü (fleksör)',
  core: 'Merkez bölge (karın–bel)',
  back: 'Sırt',
  chest: 'Göğüs',
  shoulder: 'Omuz',
  arm: 'Kol',
  neck: 'Boyun',
};

export type ExCat = 'kuvvet' | 'hiz' | 'ceviklik' | 'guc' | 'denge' | 'dayaniklilik' | 'mobilite' | 'onleme' | 'toparlanma' | 'top';

export const EXCAT_NAME: Record<ExCat, string> = {
  kuvvet: 'Kuvvet',
  hiz: 'Sürat',
  ceviklik: 'Çeviklik',
  guc: 'Patlayıcı güç',
  denge: 'Denge ve koordinasyon',
  dayaniklilik: 'Dayanıklılık',
  mobilite: 'Hareketlilik ve ısınma',
  onleme: 'Sakatlık önleme',
  toparlanma: 'Toparlanma',
  top: 'Bireysel top çalışması',
};


export interface Exercise {
  id: string;
  name: string;
  cat: ExCat;
  muscles: MuscleId[];
  secondary: MuscleId[];
  env: Env[];
  equip: Equip[];
  /** önerilen en erken yaş (kontrollü, yaşa uygun doz ile) */
  minAge: number;
  lv: Level;
  steps: string[];
  cues: string[];
  /** sık yapılan hatalar */
  mistakes: string[];
  why: string;
  alt: string[];
  /** 18+ için taban doz: set, tekrar ya da süre */
  sets: number;
  reps: number;
  unit: 'tekrar' | 'sn' | 'm' | 'dk';
  rest: string;
  caution?: string;
  /** tek taraflı (her taraf ayrı) */
  perSide?: boolean;
}

export interface ExerciseInput {
  id: string;
  name: string;
  cat: ExCat;
  m: MuscleId[];
  m2?: MuscleId[];
  env: Env[];
  eq?: Equip[];
  age: number;
  lv: Level;
  steps: string[];
  cues: string[];
  err?: string[];
  why: string;
  alt: string[];
  d: [sets: number, reps: number, unit: Exercise['unit'], rest: string];
  caution?: string;
  side?: boolean;
}

export const E = (i: ExerciseInput): Exercise => ({
  id: i.id,
  name: i.name,
  cat: i.cat,
  muscles: i.m,
  secondary: i.m2 ?? [],
  env: i.env,
  equip: i.eq ?? ['yok'],
  minAge: i.age,
  lv: i.lv,
  steps: i.steps,
  cues: i.cues,
  mistakes: i.err ?? [],
  why: i.why,
  alt: i.alt,
  sets: i.d[0],
  reps: i.d[1],
  unit: i.d[2],
  rest: i.d[3],
  caution: i.caution,
  perSide: i.side,
});

export const HOME: Env[] = ['ev', 'salon', 'saha'];
