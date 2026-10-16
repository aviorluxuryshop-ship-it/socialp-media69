import type { Level, PositionId } from './types';

export type AgeBand = 'u12' | '12-14' | '15-17' | '18+';
export type SessionFocus =
  | 'teknik'
  | 'alt-vucut'
  | 'ust-vucut'
  | 'merkez'
  | 'hiz-ceviklik'
  | 'saha'
  | 'dayaniklilik'
  | 'toparlanma';

export interface PlannedItem {
  /** oturum içinde benzersiz anahtar */
  key: string;
  /** egzersiz ya da teknik kimliği */
  ref: string;
  kind: 'ex' | 'tech' | 'drill';
  name: string;
  sets: number;
  /** "8–10 tekrar", "30 sn", "2 dk" gibi */
  dose: string;
  rest: string;
  note?: string;
}

export interface PlannedSession {
  id: string;
  title: string;
  focus: SessionFocus;
  env: 'ev' | 'salon' | 'saha';
  minutes: number;
  items: PlannedItem[];
  /** 0 = Pazartesi … 6 = Pazar; null = takvime yerleştirilmedi */
  day: number | null;
}

export interface ProgramInput {
  age: number;
  band: AgeBand;
  level: Level;
  goal: string;
  positions: PositionId[];
  equipment: string[];
  envs: string[];
  perWeek: number;
  minutes: number;
}

export interface Program {
  id: string;
  createdAt: string;
  input: ProgramInput;
  sessions: PlannedSession[];
  notes: string[];
}

export interface SessionLog {
  id: string;
  programId: string | null;
  sessionId: string | null;
  title: string;
  focus: SessionFocus | 'serbest';
  date: string; // YYYY-MM-DD (başlangıç günü)
  startedAt: string;
  finishedAt?: string;
  /** active: devam ediyor, partial: yarım bırakıldı, done: tamamlandı */
  status: 'active' | 'partial' | 'done';
  /** item.key → tamamlanan set sayısı */
  progress: Record<string, number>;
  items: PlannedItem[];
  rpe?: number;
  note?: string;
  /** planlanan ya da girilen süre (dk) */
  minutes?: number;
}
