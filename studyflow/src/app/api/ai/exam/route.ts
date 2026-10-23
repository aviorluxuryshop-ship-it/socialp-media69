import { getBook, resolveTopic } from "@/lib/catalog";
import { SUBJECT_BY_ID } from "@/lib/catalog/data";
import type { Material } from "@/lib/ai/types";
import { AiError } from "@/lib/server/ai";
import { generateQuestions } from "@/lib/server/exam-gen";
import { guardAi } from "@/lib/server/guard";
import { jsonError, readJson } from "@/lib/server/http";
import type { Difficulty, ExamKind, Grade, Question, QuestionType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Body {
  grade: Grade;
  examKind: ExamKind;
  /** ders -> konu kimlikleri; konu yoksa boş dizi (genel müfredat) */
  plan: { subjectId: string; topicIds: string[] }[];
  bookIds: number[];
  count: number;
  difficulty: Difficulty | "karisik";
  types: QuestionType[];
  materials?: Material[];
}

export async function POST(req: Request) {
  const g = await guardAi(req, "exam");
  if ("res" in g) return g.res;
  const p = await readJson<Body>(req, 120_000);
  if (!p.ok) return p.res;
  const b = p.data;
  const plan = (Array.isArray(b.plan) ? b.plan : [])
    .filter((x) => SUBJECT_BY_ID.has(x.subjectId))
    .slice(0, 4)
    .map((x) => ({ subjectId: x.subjectId, topicIds: (x.topicIds ?? []).filter((id) => resolveTopic(id)).slice(0, 8) }));
  if (!plan.length) return jsonError(400, "bad_request", "En az bir ders seç.");
  if (plan.some((x) => x.topicIds.length === 0)) return jsonError(400, "topic_required", "Soru üretmek için her ders için en az bir konu seç.");
  const count = Math.max(3, Math.min(30, Number(b.count) || 10));
  const types = (b.types ?? ["mcq"]).filter((t): t is QuestionType => ["mcq", "truefalse", "short", "written"].includes(t));
  if (!types.length) return jsonError(400, "bad_request", "Soru türü seçilmedi.");
  const bookIds = (b.bookIds ?? []).filter((x) => Number.isInteger(x) && getBook(x));
  const difficulty = (["kolay", "orta", "zor", "karisik"] as const).includes(b.difficulty) ? b.difficulty : "karisik";
  const grade: Grade = b.grade === 10 ? 10 : 9;

  try {
    // Dersler arasında soru sayısını paylaştır
    const shares = plan.map((_, i) => Math.floor(count / plan.length) + (i < count % plan.length ? 1 : 0));
    const results = await Promise.all(
      plan.map((pl, i) =>
        generateQuestions({ grade, subjectId: pl.subjectId, topicIds: pl.topicIds, bookIds, count: shares[i], difficulty, types, materials: b.materials, signal: req.signal }),
      ),
    );
    const questions: Question[] = results.flatMap((r) => r.questions);
    if (!questions.length) return jsonError(422, "no_valid_questions", "Doğrulanmış soru üretilemedi. Konuları daraltıp veya sayıyı azaltıp tekrar dene.");
    return Response.json({
      questions,
      generation: {
        requested: count,
        kept: questions.length,
        dropped: results.flatMap((r) => r.dropped),
        groundedPages: results.reduce((n, r) => n + r.groundedPages, 0),
      },
      note: results.find((r) => r.note)?.note ?? null,
    });
  } catch (e) {
    if (e instanceof AiError) return jsonError(e.code === "rate_limited" ? 429 : e.code === "refusal" ? 422 : 502, e.code, e.message);
    return jsonError(500, "server", "Beklenmeyen bir sorun oluştu.");
  }
}
