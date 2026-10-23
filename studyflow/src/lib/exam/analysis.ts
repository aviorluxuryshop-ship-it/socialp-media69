// Sınav sonrası analiz: yalnızca gerçekten ölçülebilen şeyleri raporlar.
import { isCorrect, levelOf, topicStats, type TopicLevel, type TopicStat } from "@/lib/memory/insights";
import { uid } from "@/lib/ids";
import type { AttemptData, ExamData, Question } from "@/lib/types";

export interface TopicResult {
  topicId: string;
  subjectId: string;
  total: number;
  correct: number;
  /** Tüm denemelere bakarak durum (yeterli kanıt yoksa "insufficient") */
  level: TopicLevel;
  /** Kanıt eşiği için toplam çözülen soru ve deneme sayısı */
  evidence: { questions: number; attempts: number };
}

export interface AttemptSummary {
  auto: { total: number; correct: number; unanswered: number };
  manual: { total: number; rubricTotal: number; rubricHit: number; selfCorrect: number };
  byTopic: TopicResult[];
  wrong: Question[];
  /** Bu denemede en az iki kez görülen hata etiketleri (tek denemeyle kalıcı örüntü iddia edilmez) */
  tagsInAttempt: { tag: string; count: number }[];
}

export function summarizeAttempt(a: Pick<AttemptData, "questions" | "answers" | "rubricHits">, allStats?: Map<string, TopicStat>): AttemptSummary {
  const auto = { total: 0, correct: 0, unanswered: 0 };
  const manual = { total: 0, rubricTotal: 0, rubricHit: 0, selfCorrect: 0 };
  const topics = new Map<string, TopicResult>();
  const wrong: Question[] = [];
  const tags = new Map<string, number>();
  for (const q of a.questions) {
    const ans = a.answers[q.id];
    const r = isCorrect(q, ans);
    if (r === null) {
      manual.total++;
      const hits = a.rubricHits[q.id] ?? [];
      if (q.type === "written") {
        manual.rubricTotal += q.rubric?.length ?? 0;
        manual.rubricHit += hits.length;
      } else if (hits.length) manual.selfCorrect++;
      continue;
    }
    auto.total++;
    if (ans === null || ans === undefined || ans === "") auto.unanswered++;
    const t = topics.get(q.topicId) ?? {
      topicId: q.topicId,
      subjectId: q.subjectId,
      total: 0,
      correct: 0,
      level: "insufficient" as TopicLevel,
      evidence: { questions: 0, attempts: 0 },
    };
    t.total++;
    if (r) {
      auto.correct++;
      t.correct++;
    } else {
      wrong.push(q);
      if (typeof ans === "number") {
        const tag = q.choiceTags?.[ans];
        if (tag) tags.set(tag, (tags.get(tag) ?? 0) + 1);
      }
    }
    topics.set(q.topicId, t);
  }
  for (const t of topics.values()) {
    const s = allStats?.get(t.topicId);
    t.level = levelOf(s);
    t.evidence = { questions: s?.questions ?? t.total, attempts: s?.attempts ?? 1 };
  }
  return {
    auto,
    manual,
    byTopic: [...topics.values()].sort((x, y) => x.correct / x.total - y.correct / y.total),
    wrong,
    tagsInAttempt: [...tags.entries()].filter(([, n]) => n >= 2).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count),
  };
}

/** Önceki yanlışlardan hata-tekrarı sınavı (yapay zekâsız). Soru kimlikleri yenilenir, kaynak soru originId'de saklanır. */
export function makeRevisionExam(pool: Question[], n: number, title = "Hata tekrarı"): ExamData | null {
  if (!pool.length) return null;
  const qs = pool.slice(0, n).map((q) => ({ ...q, id: uid(), originId: q.originId ?? q.id, source: { ...q.source, basis: "previous-mistake" as const } }));
  const subjects = [...new Set(qs.map((q) => q.subjectId))];
  const topics = [...new Set(qs.map((q) => q.topicId))];
  return {
    title,
    examKind: "revision",
    subjectIds: subjects,
    topicIds: topics,
    bookIds: [...new Set(qs.map((q) => q.source.bookId).filter((x): x is number => typeof x === "number"))],
    difficulty: "karisik",
    timeLimitMin: null,
    questions: qs,
    generation: { requested: n, kept: qs.length, dropped: [], groundedPages: 0 },
  };
}

export function suggestedMinutes(count: number, kind: "mcq" | "mixed" = "mcq"): number {
  return Math.max(5, Math.round(count * (kind === "mcq" ? 1.5 : 3) / 5) * 5);
}

export { topicStats };
