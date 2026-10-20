/** Rutin gruplarının görünen adı (tablo, analiz ve kategori özetlerinde kullanılır). */
export type GroupId = "yazilim" | "egitim" | "okul" | "saglik" | "uyku" | "dijital" | "bakim" | "duzen" | "aktivite" | "beslenme";

export type RoutineKind =
  | "yesno" // Evet / Hayır
  | "yesno_min" // Evet / Hayır + isteğe bağlı süre (dk)
  | "count" // Sayı (bardak)
  | "time" // Saat (HH:MM)
  | "sleep" // Yatış ve uyanıştan otomatik hesaplanır
  | "duration" // Saat + dakika
  | "nap" // Gün içi uyku süresi (0 = uyumadım)
  | "walk" // Adım veya dakika
  | "meals"; // Öğün listesi

export interface Routine {
  id: string;
  emoji: string;
  group: GroupId;
  /** Tabloda görünen kısa ad. */
  label: string;
  /** Günlük girişte sorulan tam soru. */
  question: string;
  kind: RoutineKind;
}

export interface Meal {
  id: string;
  type: string;
  items: string;
  note?: string;
}

export interface YesNoMin {
  done: boolean;
  minutes?: number;
}

export type WalkUnit = "steps" | "min";
export interface WalkValue {
  unit: WalkUnit;
  value: number;
}

export type RoutineValue = boolean | number | string | YesNoMin | WalkValue | Meal[];

/** Bir güne ait kayıtlar. Anahtarın olmaması = "kaydedilmedi" (başarısızlık değil). */
export type DayEntry = Record<string, RoutineValue>;

export interface Goals {
  /** Günlük su hedefi (bardak). */
  waterGlasses: number;
  /** Uyku hedefi (saat). */
  sleepHours: number;
  /** Günlük ekran süresi üst sınırı (saat). */
  screenMaxHours: number;
  /** Günlük adım hedefi. */
  steps: number;
  /** Günlük yürüyüş süresi hedefi (dk). */
  walkMinutes: number;
}

export interface Profile {
  name: string;
  onboarded: boolean;
  walkUnit: WalkUnit;
  /** Ses efektleri açık mı. */
  soundOn: boolean;
  /** 0–1 arası ses seviyesi. */
  volume: number;
}

export interface Plan {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  /** İsteğe bağlı saat (HH:MM). */
  time?: string;
  note?: string;
  done: boolean;
}

export interface Course {
  id: string;
  name: string;
  color: string;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string; // YYYY-MM-DD
  expected: number | null; // 0-100
  actual: number | null; // 0-100
}

export interface AppData {
  profile: Profile;
  goals: Goals;
  /** tarih (YYYY-MM-DD) → o günün kayıtları. */
  entries: Record<string, DayEntry>;
  courses: Course[];
  exams: Exam[];
  plans: Plan[];
  /** Eski sürümden (v1) taşınan ve yeni rutinlerle eşleşmeyen ham kayıtlar — silinmez. */
  legacy?: unknown;
}
