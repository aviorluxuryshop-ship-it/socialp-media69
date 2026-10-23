import { describe, expect, it } from "vitest";
import { levelOf, MIN_ATTEMPTS, MIN_QUESTIONS, mistakePatterns, mistakePool, repeatedMistakes, suggest, topicStats } from "@/lib/memory/insights";
import { summarizeAttempt } from "@/lib/exam/analysis";
import type { AttemptRecord, Question } from "@/lib/types";

let n = 0;
const mq = (topicId: string, o: Partial<Question> = {}): Question => ({
  id: `q${++n}`,
  type: "mcq",
  stem: `Soru ${n}`,
  choices: ["A", "B", "C", "D"],
  answerIndex: 0,
  explanation: "açıklama açıklama açıklama",
  topicId,
  subjectId: "mat",
  difficulty: "orta",
  provenance: "ai-generated",
  source: { basis: "curriculum-topic" },
  checks: { structure: true, calc: "none", crossCheck: "skipped" },
  choiceTags: [null, "işlem hatası", "işaret hatası", "birim hatası"],
  ...o,
});
const attempt = (id: string, qs: Question[], answers: (number | null)[], at = 1_000): AttemptRecord => ({
  id,
  kind: "attempt",
  createdAt: at,
  updatedAt: at,
  examId: "e",
  examTitle: "t",
  startedAt: at,
  finishedAt: at,
  durationSec: 60,
  timed: false,
  answers: Object.fromEntries(qs.map((q, i) => [q.id, answers[i]])),
  rubricHits: {},
  questions: qs,
});

describe("kanıt eşiği", () => {
  it("tek bir yanlış konuyu zayıf yapmaz", () => {
    const q = mq("t1");
    const a = attempt("a1", [q], [1]);
    const s = topicStats([a]).get("t1");
    expect(levelOf(s)).toBe("insufficient");
  });
  it(`en az ${MIN_QUESTIONS} soru ve ${MIN_ATTEMPTS} deneme olmadan seviye vermez`, () => {
    const qs = Array.from({ length: 6 }, () => mq("t1"));
    const one = topicStats([attempt("a1", qs, qs.map(() => 1))]).get("t1");
    expect(levelOf(one)).toBe("insufficient"); // 6 soru ama tek deneme
    const two = topicStats([attempt("a1", qs.slice(0, 3), [1, 1, 1]), attempt("a2", qs.slice(3), [1, 1, 1])]).get("t1");
    expect(levelOf(two)).toBe("review");
  });
  it("başarı oranına göre güçlü/gelişen/tekrar seviyeleri", () => {
    const mk = (correct: number) => {
      const qs = Array.from({ length: 10 }, () => mq("t1"));
      const ans = qs.map((_, i) => (i < correct ? 0 : 1));
      return topicStats([attempt("a1", qs.slice(0, 5), ans.slice(0, 5)), attempt("a2", qs.slice(5), ans.slice(5))]).get("t1");
    };
    expect(levelOf(mk(9))).toBe("strong");
    expect(levelOf(mk(6))).toBe("steady");
    expect(levelOf(mk(3))).toBe("review");
  });
  it("yazılı/kısa cevap sorularını otomatik puana katmaz", () => {
    const w = mq("t1", { type: "written", choices: undefined, answerIndex: undefined });
    expect(topicStats([attempt("a1", [w], [null])]).size).toBe(0);
  });
});

describe("tekrarlanan hata ve örüntüler", () => {
  it("aynı soru iki farklı denemede yanlışsa tekrarlanan hatadır", () => {
    const q = mq("t1");
    expect(repeatedMistakes([attempt("a1", [q], [1])])).toHaveLength(0);
    expect(repeatedMistakes([attempt("a1", [q], [1]), attempt("a2", [{ ...q, id: "copy", originId: q.id }], [2])])).toHaveLength(1);
  });
  it("hata havuzu, sonradan doğru yapılan soruyu çıkarır", () => {
    const q = mq("t1");
    const a1 = attempt("a1", [q], [1], 1);
    const a2 = attempt("a2", [q], [0], 2);
    expect(mistakePool([a1])).toHaveLength(1);
    expect(mistakePool([a1, a2])).toHaveLength(0);
  });
  it("hata etiketi örüntüsü için en az 3 tekrar ve 2 deneme ister", () => {
    const qs = Array.from({ length: 3 }, () => mq("t1"));
    const one = attempt("a1", qs, [1, 1, 1]);
    expect(mistakePatterns([one])).toEqual([]); // 3 kez ama tek deneme
    const two = [attempt("a1", qs.slice(0, 2), [1, 1]), attempt("a2", qs.slice(2), [1])];
    expect(mistakePatterns(two)).toEqual([{ tag: "işlem hatası", count: 3, topics: 1 }]);
  });
});

describe("summarizeAttempt", () => {
  it("cevapsızı yanlış sayar ve kanıt yetersizse konu seviyesi vermez", () => {
    const qs = [mq("t1"), mq("t1")];
    const a = attempt("a1", qs, [0, null]);
    const s = summarizeAttempt(a, topicStats([a]));
    expect(s.auto).toEqual({ total: 2, correct: 1, unanswered: 1 });
    expect(s.byTopic[0].level).toBe("insufficient");
  });
});

describe("suggest", () => {
  it("hiç etkinlik yoksa yalnızca başlangıç önerir", () => {
    const r = suggest({ attempts: [], events: [], cards: [] });
    expect(r.map((x) => x.id)).toEqual(["start"]);
  });
  it("zamanı gelen kart varsa öneri çıkar", () => {
    const now = 10_000;
    const r = suggest({ attempts: [], events: [{ id: "e", kind: "event", createdAt: 0, updatedAt: 0, type: "tutor", at: now, subjectId: null, topicId: null }], cards: [{ id: "c", kind: "card", createdAt: 0, updatedAt: 0, front: "a", back: "b", subjectId: null, topicId: null, box: 1, due: now - 1, reps: 0, lapses: 0 }], now });
    expect(r.some((x) => x.id === "cards")).toBe(true);
  });
  it("en fazla 3 öneri döndürür", () => {
    expect(suggest({ attempts: [], events: [], cards: [] }).length).toBeLessThanOrEqual(3);
  });
});
