import type { Material } from "@/lib/ai/types";
import { getBook, resolveTopic } from "@/lib/catalog";
import { SUBJECT_BY_ID } from "@/lib/catalog/data";
import { AiError } from "@/lib/server/ai";
import { generateQuestions } from "@/lib/server/exam-gen";
import { guardAi } from "@/lib/server/guard";
import { jsonError, readJson } from "@/lib/server/http";
import type { Grade } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  grade: Grade;
  subjectId: string;
  topicId: string | null;
  query?: string;
  bookIds: number[];
  count: number;
  materials?: Material[];
}

/** Kısa "Beni test et" / video sonrası kontrol: 2-5 soru, çoktan seçmeli. */
export async function POST(req: Request) {
  const g = await guardAi(req, "quiz");
  if ("res" in g) return g.res;
  const p = await readJson<Body>(req, 60_000);
  if (!p.ok) return p.res;
  const b = p.data;
  const subjectId = SUBJECT_BY_ID.has(b.subjectId) ? b.subjectId : null;
  if (!subjectId) return jsonError(400, "bad_request", "Ders belirtilmedi.");
  const topic = resolveTopic(b.topicId);
  const bookIds = (b.bookIds ?? []).filter((x) => Number.isInteger(x) && getBook(x)).slice(0, 6);
  try {
    const r = await generateQuestions({
      grade: b.grade === 10 ? 10 : 9,
      subjectId,
      topicIds: topic ? [topic.id] : [],
      bookIds,
      count: Math.max(2, Math.min(5, Number(b.count) || 3)),
      difficulty: "orta",
      types: ["mcq"],
      materials: (b.materials ?? []).slice(0, 2),
      signal: req.signal,
    });
    if (!r.questions.length) return jsonError(422, "no_valid_questions", "Doğrulanmış soru üretilemedi. Biraz sonra tekrar dene.");
    return Response.json({ questions: r.questions, note: r.note, dropped: r.dropped.length });
  } catch (e) {
    if (e instanceof AiError) return jsonError(e.code === "rate_limited" ? 429 : e.code === "refusal" ? 422 : 502, e.code, e.message);
    return jsonError(500, "server", "Beklenmeyen bir sorun oluştu.");
  }
}
