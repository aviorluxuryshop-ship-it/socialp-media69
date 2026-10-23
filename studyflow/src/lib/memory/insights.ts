// Öğrenme hafızası: yalnızca gerçek etkinliklerden türeyen, yeterli kanıt arayan öneriler.
// Tek bir yanlış cevap bir konuyu asla "zayıf" yapmaz; baskı yaratan seri/sıralama yoktur.
import { diffDays, toDay } from "@/lib/dates";
import { resolveTopic, topicLabel } from "@/lib/catalog";
import type { AttemptRecord, CardRecord, EventRecord, Question } from "@/lib/types";

/** Bir konuda "zayıf/güçlü" demek için gereken asgari kanıt */
export const MIN_QUESTIONS = 5;
export const MIN_ATTEMPTS = 2;

export interface TopicStat {
  topicId: string;
  subjectId: string;
  questions: number;
  correct: number;
  attempts: number;
  lastAt: number;
}
export type TopicLevel = "insufficient" | "strong" | "steady" | "review";

export function isCorrect(q: Question, answer: number | string | null | undefined): boolean | null {
  if (q.type !== "mcq" && q.type !== "truefalse") return null; // short/written: otomatik değerlendirilmez
  if (answer === null || answer === undefined || answer === "") return false; // boş bırakılan çoktan seçmeli yanlış sayılır
  return typeof answer === "number" && answer === q.answerIndex;
}

/** Otomatik puanlanabilen (çoktan seçmeli / doğru-yanlış) sorular üzerinden konu istatistiği */
export function topicStats(attempts: AttemptRecord[]): Map<string, TopicStat> {
  const m = new Map<string, TopicStat & { seen: Set<string> }>();
  for (const a of attempts) {
    for (const q of a.questions) {
      const r = isCorrect(q, a.answers[q.id]);
      if (r === null) continue;
      let s = m.get(q.topicId);
      if (!s) {
        s = { topicId: q.topicId, subjectId: q.subjectId, questions: 0, correct: 0, attempts: 0, lastAt: 0, seen: new Set() };
        m.set(q.topicId, s);
      }
      s.questions++;
      if (r) s.correct++;
      s.seen.add(a.id);
      s.lastAt = Math.max(s.lastAt, a.finishedAt);
    }
  }
  for (const s of m.values()) s.attempts = s.seen.size;
  return m;
}

export function levelOf(s: TopicStat | undefined): TopicLevel {
  if (!s || s.questions < MIN_QUESTIONS || s.attempts < MIN_ATTEMPTS) return "insufficient";
  const acc = s.correct / s.questions;
  if (acc >= 0.8) return "strong";
  if (acc >= 0.55) return "steady";
  return "review";
}

export interface RepeatedMistake {
  originId: string;
  question: Question;
  wrongCount: number;
  attempts: number;
}

/** Aynı soru (veya onun hata-tekrarı kopyası) en az iki farklı denemede yanlış yapıldıysa tekrarlanan hatadır. */
export function repeatedMistakes(attempts: AttemptRecord[], min = 2): RepeatedMistake[] {
  const m = new Map<string, RepeatedMistake>();
  for (const a of attempts) {
    for (const q of a.questions) {
      const r = isCorrect(q, a.answers[q.id]);
      if (r !== false) continue;
      const key = q.originId ?? q.id;
      const cur = m.get(key) ?? { originId: key, question: q, wrongCount: 0, attempts: 0 };
      cur.wrongCount++;
      cur.attempts++;
      m.set(key, cur);
    }
  }
  return [...m.values()].filter((x) => x.wrongCount >= min).sort((a, b) => b.wrongCount - a.wrongCount);
}

/** Çözülmüş ama henüz doğru yapılmamış tüm yanlışlar (hata tekrarı testi havuzu) */
export function mistakePool(attempts: AttemptRecord[]): Question[] {
  const latest = new Map<string, { q: Question; ok: boolean; at: number }>();
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
    for (const q of a.questions) {
      const r = isCorrect(q, a.answers[q.id]);
      if (r === null) continue;
      latest.set(q.originId ?? q.id, { q: { ...q, originId: q.originId ?? q.id }, ok: r, at: a.finishedAt });
    }
  }
  return [...latest.values()].filter((x) => !x.ok).map((x) => x.q);
}

export interface MistakePattern {
  tag: string;
  count: number;
  topics: number;
}
/** Seçilen yanlış şıkların hata etiketlerinden örüntü: en az 3 kez ve en az 2 farklı denemede */
export function mistakePatterns(attempts: AttemptRecord[]): MistakePattern[] {
  const tags = new Map<string, { count: number; topics: Set<string>; attempts: Set<string> }>();
  for (const a of attempts) {
    for (const q of a.questions) {
      const ans = a.answers[q.id];
      if (typeof ans !== "number" || ans === q.answerIndex) continue;
      const tag = q.choiceTags?.[ans];
      if (!tag) continue;
      const cur = tags.get(tag) ?? { count: 0, topics: new Set(), attempts: new Set() };
      cur.count++;
      cur.topics.add(q.topicId);
      cur.attempts.add(a.id);
      tags.set(tag, cur);
    }
  }
  return [...tags.entries()]
    .filter(([, v]) => v.count >= 3 && v.attempts.size >= 2)
    .map(([tag, v]) => ({ tag, count: v.count, topics: v.topics.size }))
    .sort((a, b) => b.count - a.count);
}

export interface Suggestion {
  id: string;
  title: string;
  reason: string;
  href: string;
}

export function studiedTopics(events: EventRecord[]): Map<string, { topicId: string; subjectId: string | null; lastAt: number; count: number }> {
  const m = new Map<string, { topicId: string; subjectId: string | null; lastAt: number; count: number }>();
  for (const e of events) {
    if (!e.topicId || e.type === "exam" || e.type === "cards") continue;
    const cur = m.get(e.topicId) ?? { topicId: e.topicId, subjectId: e.subjectId, lastAt: 0, count: 0 };
    cur.lastAt = Math.max(cur.lastAt, e.at);
    cur.count++;
    m.set(e.topicId, cur);
  }
  return m;
}

export function suggest(opts: { attempts: AttemptRecord[]; events: EventRecord[]; cards: CardRecord[]; now?: number }): Suggestion[] {
  const now = opts.now ?? Date.now();
  const out: Suggestion[] = [];

  const dueCards = opts.cards.filter((c) => c.due <= now).length;
  const repeats = repeatedMistakes(opts.attempts);
  if (repeats.length >= 2) {
    out.push({
      id: "mistakes",
      title: "Tekrarlanan hatalarına bir daha bak",
      reason: `${repeats.length} soruyu birden fazla denemede yanlış yaptın. Kısa bir hata tekrarı testi bunları pekiştirir.`,
      href: "/sinav?tur=revision",
    });
  }

  const stats = topicStats(opts.attempts);
  const weak = [...stats.values()].filter((s) => levelOf(s) === "review").sort((a, b) => a.correct / a.questions - b.correct / b.questions);
  if (weak[0]) {
    const w = weak[0];
    out.push({
      id: `weak-${w.topicId}`,
      title: `${topicLabel(w.topicId) || "Bir konu"} üzerine dön`,
      reason: `${w.attempts} denemede ${w.questions} sorunun ${w.correct}'ini doğru yaptın. Konuyu bir kez daha anlatmamı ister misin?`,
      href: `/ogren?konu=${encodeURIComponent(w.topicId)}`,
    });
  }

  const studied = [...studiedTopics(opts.events).values()].sort((a, b) => a.lastAt - b.lastAt);
  const stale = studied.find((s) => resolveTopic(s.topicId) && diffDays(toDay(new Date(now)), toDay(new Date(s.lastAt))) >= 6);
  if (stale) {
    out.push({
      id: `spaced-${stale.topicId}`,
      title: `Kısa tekrar: ${topicLabel(stale.topicId)}`,
      reason: "Bu konuya bir haftaya yakındır dönmedin. Kısa bir tekrar kalıcı öğrenmeyi güçlendirir.",
      href: `/sinav?konu=${encodeURIComponent(stale.topicId)}`,
    });
  }

  if (dueCards > 0) {
    out.push({
      id: "cards",
      title: `${dueCards} bilgi kartı tekrar zamanı`,
      reason: "Kartlar kısa aralıklarla tekrar edildiğinde en iyi çalışır. Birkaç dakikan yeter.",
      href: "/ozet/kartlar",
    });
  }

  if (out.length === 0) {
    if (opts.events.length === 0 && opts.attempts.length === 0) {
      out.push({
        id: "start",
        title: "İlk konunu seç",
        reason: "Bir dersin bir konusunu yapay zekâ ile anlat, sonra istersen kısa bir test çöz. Öneriler çalıştıkça dolar.",
        href: "/ogren",
      });
    } else {
      out.push({
        id: "keep",
        title: "Güzel gidiyorsun",
        reason: "Şu an için acil bir öneri yok. İstersen yeni bir konu aç veya kısa bir test çöz.",
        href: "/sinav",
      });
    }
  }
  return out.slice(0, 3);
}
