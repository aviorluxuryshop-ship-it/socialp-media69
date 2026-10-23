// StudyFlow — paylaşılan veri tipleri.
// Kalıcı her şey tek bir kayıt biçimine sığar: { id, kind, createdAt, updatedAt, ...veri }.

export type Grade = 9 | 10;
export type ThemeMode = "system" | "light" | "dark";

export type RecordKind =
  | "profile"
  | "note"
  | "upload"
  | "summary"
  | "card"
  | "exam"
  | "attempt"
  | "task"
  | "session"
  | "chat"
  | "event"
  | "video";

export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// --- Profil -------------------------------------------------------------

export type SchoolTypeId = "anadolu" | "fen" | "sosyal-bilimler" | "mtal" | "aihl" | "diger";
export type InterestId = "fen-mat" | "sosyal" | "dil" | "kararsiz";

export interface DayWindow {
  /** 0 = Pazartesi … 6 = Pazar */
  day: number;
  /** "HH:MM" */
  from: string;
  to: string;
}

export interface ProfileData {
  name: string;
  grade: Grade;
  province: string;
  schoolType: SchoolTypeId;
  interest: InterestId;
  subjectIds: string[];
  /** Öğrencinin seçtiği tam ders kitabı sürümleri (MEB portal kimlikleri). */
  bookIds: number[];
  availability: DayWindow[];
  sound: boolean;
  theme: ThemeMode;
  reduceMotion: boolean;
  onboardedAt: number;
}
export type ProfileRecord = BaseRecord & { kind: "profile" } & ProfileData;

// --- Kaynak başvurusu ------------------------------------------------------

/** Doğrulanabilir bir kaynağa işaret eder; hiçbir alanı uydurulmaz. */
export interface SourceRef {
  type: "textbook" | "note" | "upload" | "program";
  label: string;
  bookId?: number;
  topicId?: string;
  /** Kitabın basılı sayfa numarası aralığı */
  pages?: [number, number];
  /** Resmî PDF veya sayfa bağlantısı */
  url?: string;
  recordId?: string;
}

// --- Not / yükleme -------------------------------------------------------

export interface NoteData {
  title: string;
  body: string;
  subjectId: string | null;
  topicId: string | null;
  tags: string[];
  pinned: boolean;
}
export type NoteRecord = BaseRecord & { kind: "note" } & NoteData;

export type ExtractionStatus = "ok" | "partial" | "none" | "ocr" | "pending";
export interface UploadData {
  name: string;
  mime: string;
  size: number;
  pageCount: number;
  extraction: { status: ExtractionStatus; chars: number; message?: string };
  pages: { n: number; text: string }[];
  subjectId: string | null;
  topicId: string | null;
  /** Bulut deposundaki yol (oturum açıksa) */
  storagePath?: string;
  /** Yerel depodaki dosya anahtarı (oturumsuzsa) */
  localFileKey?: string;
}
export type UploadRecord = BaseRecord & { kind: "upload" } & UploadData;

// --- Özet / kart --------------------------------------------------------------

export interface SummaryContent {
  quick?: string[];
  detailed?: string;
  keyConcepts?: { term: string; meaning: string }[];
  formulas?: { name: string; latex: string; note: string }[];
  comparisons?: { title: string; columns: string[]; rows: { label: string; cells: string[] }[] }[];
  flashcards?: { front: string; back: string }[];
  examSheet?: { point: string; tip: string }[];
}
export type SummarySection = keyof SummaryContent;

export interface SummaryData {
  title: string;
  subjectId: string | null;
  topicIds: string[];
  sources: SourceRef[];
  content: SummaryContent;
  /** İçeriğin neye dayandığı: kitap metni, kullanıcı materyali veya yalnızca genel bilgi */
  grounding: "textbook" | "user-material" | "mixed" | "general";
}
export type SummaryRecord = BaseRecord & { kind: "summary" } & SummaryData;

export interface CardData {
  front: string;
  back: string;
  subjectId: string | null;
  topicId: string | null;
  /** Leitner kutusu 1–5 */
  box: number;
  due: number;
  reps: number;
  lapses: number;
  summaryId?: string;
}
export type CardRecord = BaseRecord & { kind: "card" } & CardData;

// --- Sınav ---------------------------------------------------------------

export type QuestionType = "mcq" | "truefalse" | "short" | "written";
export type Difficulty = "kolay" | "orta" | "zor";
export type Provenance = "official" | "official-example" | "ai-generated";

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  choices?: string[];
  answerIndex?: number;
  /** short/written: örnek doğru yanıt */
  answerText?: string;
  /** written: puanlama anahtarı (öğrenci kendini işaretler) */
  rubric?: string[];
  explanation: string;
  commonMistake?: string;
  /** Her seçenek için hata etiketi (doğru seçenek null) */
  choiceTags?: (string | null)[];
  topicId: string;
  subjectId: string;
  difficulty: Difficulty;
  provenance: Provenance;
  source: {
    bookId?: number;
    topicTitle?: string;
    pages?: [number, number];
    basis: "textbook-excerpt" | "curriculum-topic" | "user-material" | "previous-mistake";
  };
  /** Gerçekten yapılan kontroller */
  checks: { structure: true; calc: "passed" | "none"; crossCheck: "passed" | "skipped" };
  /** Hata tekrarı testlerinde: asıl sorunun kimliği */
  originId?: string;
}

export type ExamKind = "topic" | "mixed" | "written" | "mock" | "revision";
export interface ExamData {
  title: string;
  examKind: ExamKind;
  subjectIds: string[];
  topicIds: string[];
  bookIds: number[];
  difficulty: Difficulty | "karisik";
  timeLimitMin: number | null;
  questions: Question[];
  /** Üretim sırasında elenen soru sayısı ve nedenleri (şeffaflık) */
  generation: { requested: number; kept: number; dropped: { reason: string }[]; groundedPages: number };
}
export type ExamRecord = BaseRecord & { kind: "exam" } & ExamData;

export interface AttemptData {
  examId: string;
  examTitle: string;
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  timed: boolean;
  /** mcq/truefalse: seçilen indeks; short/written: metin; boş bırakılan: null */
  answers: Record<string, number | string | null>;
  /** written: kullanıcının işaretlediği rubric maddeleri */
  rubricHits: Record<string, number[]>;
  /** Bu denemede çözülen soruların anlık kopyası (sınav silinse bile analiz yaşasın) */
  questions: Question[];
}
export type AttemptRecord = BaseRecord & { kind: "attempt" } & AttemptData;

// --- Planlayıcı ----------------------------------------------------------

export type TaskType = "class" | "exam" | "homework" | "study" | "revision";
export type TaskStatus = "todo" | "done" | "missed" | "skipped";

export interface TaskData {
  type: TaskType;
  title: string;
  subjectId: string | null;
  topicId: string | null;
  /** YYYY-MM-DD (class için: haftalık tekrar, bu alan başlangıç tarihi) */
  date: string;
  start: string | null; // "HH:MM"
  end: string | null;
  /** class: haftanın günü 0=Pzt…6=Paz */
  weekday?: number;
  weekly?: boolean;
  status: TaskStatus;
  auto: boolean;
  note?: string;
  /** exam: sınavın kapsadığı konular */
  topicIds?: string[];
  /** Otomatik plan kümesi (yeniden planlamada birlikte ele alınır) */
  planId?: string;
}
export type TaskRecord = BaseRecord & { kind: "task" } & TaskData;

// --- Hafıza ---------------------------------------------------------------

export type EventType = "tutor" | "note" | "upload" | "summary" | "video" | "exam" | "study" | "cards";
export interface EventData {
  type: EventType;
  at: number;
  subjectId: string | null;
  topicId: string | null;
  refId?: string;
  minutes?: number;
  /** sınav olayları için */
  correct?: number;
  total?: number;
}
export type EventRecord = BaseRecord & { kind: "event" } & EventData;

export interface SessionData {
  startedAt: number;
  minutes: number;
  subjectId: string | null;
  topicId: string | null;
  label: string;
}
export type SessionRecord = BaseRecord & { kind: "session" } & SessionData;

// --- Sohbet ----------------------------------------------------------------

export type TutorMode = "hizli" | "konu" | "derin";
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  mode?: TutorMode;
  sources?: SourceRef[];
  /** Yanıtın dayandığı gerçek durum */
  grounding?: "textbook" | "user-material" | "mixed" | "general";
  groundingNote?: string;
  quiz?: MiniQuiz;
}
export interface MiniQuiz {
  items: { stem: string; choices: string[]; answerIndex: number; explanation: string }[];
  picked: (number | null)[];
}
export interface ChatData {
  title: string;
  subjectId: string | null;
  topicId: string | null;
  mode: TutorMode;
  messages: ChatMessage[];
}
export type ChatRecord = BaseRecord & { kind: "chat" } & ChatData;

// --- Video ---------------------------------------------------------------

export interface VideoStateData {
  videoId: string;
  watched: boolean;
  quizScore?: { correct: number; total: number };
  lastOpenedAt: number;
}
export type VideoStateRecord = BaseRecord & { kind: "video" } & VideoStateData;

export type AnyRecord =
  | ProfileRecord
  | NoteRecord
  | UploadRecord
  | SummaryRecord
  | CardRecord
  | ExamRecord
  | AttemptRecord
  | TaskRecord
  | SessionRecord
  | ChatRecord
  | EventRecord
  | VideoStateRecord;

export type RecordOf<K extends RecordKind> = Extract<AnyRecord, { kind: K }>;
export type DataOf<K extends RecordKind> = Omit<RecordOf<K>, "id" | "kind" | "createdAt" | "updatedAt">;
