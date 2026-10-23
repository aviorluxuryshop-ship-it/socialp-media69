// Üretilen soruların yapısal ve deterministik doğrulaması. Model güvenine dayanmaz.
import { fold } from "@/lib/text";
import { uid } from "@/lib/ids";
import { resolveTopic } from "@/lib/catalog";
import type { Difficulty, Question, QuestionType } from "@/lib/types";
import { checkCalc } from "./calc";

export interface GenQuestion {
  type: QuestionType;
  stem: string;
  choices: string[];
  answerIndex: number;
  answerText: string;
  rubric: string[];
  explanation: string;
  commonMistake: string;
  choiceTags: string[];
  topicId: string;
  difficulty: Difficulty;
  calcExpr: string;
  sourcePage: number;
}

export interface ValidateCtx {
  allowedTopicIds: string[];
  subjectId: string;
  allowedTypes: QuestionType[];
  basis: Question["source"]["basis"];
  /** Metin kaynağı sayfa aralıkları (atıf için) */
  pagesByTopic?: Record<string, [number, number]>;
}

const BAD_CHOICE = /(yukarıdakilerin\s+(hepsi|tümü)|hepsi\s+doğru|hiçbiri|seçeneklerin\s+hepsi|a\s+ve\s+b\b|b\s+ve\s+c\b|all of the above|none of the above)/i;

function jaccard(a: string, b: string) {
  const A = new Set(fold(a).split(" ").filter((w) => w.length > 2));
  const B = new Set(fold(b).split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / (A.size + B.size - n);
}

export type Drop = { reason: string };

export function validateGenerated(raw: GenQuestion[], ctx: ValidateCtx): { kept: Question[]; dropped: Drop[] } {
  const kept: Question[] = [];
  const dropped: Drop[] = [];
  for (const g of raw) {
    const drop = (reason: string) => dropped.push({ reason });
    if (!g || typeof g.stem !== "string") {
      drop("Biçim geçersiz");
      continue;
    }
    if (!ctx.allowedTypes.includes(g.type)) {
      drop("İstenmeyen soru türü");
      continue;
    }
    const stem = g.stem.trim();
    if (stem.length < 15 || stem.length > 1400) {
      drop("Soru metni uygun uzunlukta değil");
      continue;
    }
    if (!g.explanation || g.explanation.trim().length < 20) {
      drop("Açıklama yetersiz");
      continue;
    }
    let topicId = g.topicId;
    if (!ctx.allowedTopicIds.includes(topicId)) {
      if (ctx.allowedTopicIds.length === 1) topicId = ctx.allowedTopicIds[0];
      else {
        drop("Konu eşleşmedi");
        continue;
      }
    }
    const diff: Difficulty = g.difficulty === "kolay" || g.difficulty === "zor" ? g.difficulty : "orta";

    const base = {
      id: uid(),
      stem,
      explanation: g.explanation.trim(),
      commonMistake: g.commonMistake?.trim() || undefined,
      topicId,
      subjectId: ctx.subjectId,
      difficulty: diff,
      provenance: "ai-generated" as const,
      source: { bookId: resolveTopic(topicId)?.book.id, topicTitle: resolveTopic(topicId)?.title, pages: ctx.pagesByTopic?.[topicId], basis: ctx.basis },
    };

    if (g.type === "mcq" || g.type === "truefalse") {
      const choices = (g.choices ?? []).map((c) => String(c).trim());
      const expected = g.type === "truefalse" ? 2 : undefined;
      if (g.type === "mcq" && (choices.length < 4 || choices.length > 5)) {
        drop("Seçenek sayısı 4-5 değil");
        continue;
      }
      if (expected && choices.length !== 2) {
        drop("Doğru/yanlış için 2 seçenek gerekir");
        continue;
      }
      if (choices.some((c) => !c || c.length > 300)) {
        drop("Boş veya aşırı uzun seçenek");
        continue;
      }
      if (new Set(choices.map((c) => fold(c))).size !== choices.length) {
        drop("Tekrarlanan seçenek");
        continue;
      }
      if (g.type === "mcq" && choices.some((c) => BAD_CHOICE.test(c))) {
        drop("Belirsiz seçenek ('hepsi', 'hiçbiri', 'A ve B')");
        continue;
      }
      if (!Number.isInteger(g.answerIndex) || g.answerIndex < 0 || g.answerIndex >= choices.length) {
        drop("Doğru cevap indeksi geçersiz");
        continue;
      }
      let calc: "passed" | "none" = "none";
      if (g.calcExpr && g.calcExpr.trim()) {
        const r = checkCalc(g.calcExpr.trim(), choices[g.answerIndex]);
        if (r === "failed") {
          drop("Hesap kontrolü uyuşmadı");
          continue;
        }
        if (r === "passed") calc = "passed";
      }
      const tags = Array.isArray(g.choiceTags) && g.choiceTags.length === choices.length ? g.choiceTags.map((t, i) => (i === g.answerIndex || !String(t).trim() ? null : String(t).trim().slice(0, 48))) : undefined;
      if (kept.some((k) => jaccard(k.stem, stem) >= 0.8)) {
        drop("Benzer soru tekrarı");
        continue;
      }
      kept.push({ ...base, type: g.type, choices, answerIndex: g.answerIndex, choiceTags: tags, checks: { structure: true, calc, crossCheck: "skipped" } });
      continue;
    }

    if (g.type === "short") {
      const ans = (g.answerText ?? "").trim();
      if (!ans || ans.length > 400) {
        drop("Kısa cevap anahtarı geçersiz");
        continue;
      }
      if (kept.some((k) => jaccard(k.stem, stem) >= 0.8)) {
        drop("Benzer soru tekrarı");
        continue;
      }
      kept.push({ ...base, type: "short", answerText: ans, checks: { structure: true, calc: "none", crossCheck: "skipped" } });
      continue;
    }

    if (g.type === "written") {
      const rubric = (g.rubric ?? []).map((r) => String(r).trim()).filter(Boolean);
      const ans = (g.answerText ?? "").trim();
      if (rubric.length < 2 || rubric.length > 7 || !ans) {
        drop("Puanlama anahtarı geçersiz");
        continue;
      }
      if (kept.some((k) => jaccard(k.stem, stem) >= 0.8)) {
        drop("Benzer soru tekrarı");
        continue;
      }
      kept.push({ ...base, type: "written", answerText: ans, rubric, checks: { structure: true, calc: "none", crossCheck: "skipped" } });
      continue;
    }
    drop("Bilinmeyen soru türü");
  }
  return { kept, dropped };
}

/** Konulara dengeli dağıtarak ilk n soruyu seçer. */
export function pickBalanced(questions: Question[], n: number): Question[] {
  if (questions.length <= n) return questions;
  const byTopic = new Map<string, Question[]>();
  for (const q of questions) byTopic.set(q.topicId, [...(byTopic.get(q.topicId) ?? []), q]);
  const out: Question[] = [];
  const lists = [...byTopic.values()];
  for (let i = 0; out.length < n; i++) {
    let any = false;
    for (const l of lists) {
      if (l[i]) {
        out.push(l[i]);
        any = true;
        if (out.length >= n) break;
      }
    }
    if (!any) break;
  }
  return out;
}
