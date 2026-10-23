import { sourcesBlock, tutorContextBlock, TUTOR_SYSTEM } from "@/lib/ai/prompts";
import type { Grounding, TutorEvent, TutorRequest } from "@/lib/ai/types";
import { getBook, topicLabel } from "@/lib/catalog";
import { SUBJECT_BY_ID } from "@/lib/catalog/data";
import { AiError, MODELS, streamText } from "@/lib/server/ai";
import { guardAi } from "@/lib/server/guard";
import { jsonError, readJson } from "@/lib/server/http";
import { retrieve, type Retrieval } from "@/lib/server/retrieve";
import type { SourceRef, TutorMode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODES: TutorMode[] = ["hizli", "konu", "derin"];
const BUDGET: Record<TutorMode, { chars: number; pages: number; tokens: number }> = {
  hizli: { chars: 3500, pages: 8, tokens: 2500 },
  konu: { chars: 6500, pages: 10, tokens: 5000 },
  derin: { chars: 10000, pages: 12, tokens: 8000 },
};

export async function POST(req: Request) {
  const g = await guardAi(req, "tutor");
  if ("res" in g) return g.res;
  const parsed = await readJson<TutorRequest>(req, 160_000);
  if (!parsed.ok) return parsed.res;
  const b = parsed.data;

  // --- Girdi doğrulama ---------------------------------------------------
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > 24) return jsonError(400, "bad_request", "Mesajlar geçersiz.");
  const messages = b.messages
    .slice(-10)
    .map((m) => ({ role: m.role === "assistant" ? ("assistant" as const) : ("user" as const), content: String(m.content ?? "").slice(0, 8000) }))
    .filter((m) => m.content.trim());
  if (!messages.length || messages[0].role !== "user" || messages[messages.length - 1].role !== "user") return jsonError(400, "bad_request", "Mesajlar geçersiz.");
  const mode = MODES.includes(b.mode) ? b.mode : "konu";
  const grade = b.grade === 10 ? 10 : 9;
  const subjectId = b.subjectId && SUBJECT_BY_ID.has(b.subjectId) ? b.subjectId : null;
  const bookIds = (Array.isArray(b.bookIds) ? b.bookIds : []).filter((x) => Number.isInteger(x) && getBook(x)).slice(0, 8);
  const materials = (Array.isArray(b.materials) ? b.materials : [])
    .slice(0, 3)
    .map((m, i) => ({ id: `M${i + 1}`, title: String(m.title ?? "Materyal").slice(0, 120), text: String(m.text ?? "").slice(0, 6000), recordId: m.recordId, type: m.type }))
    .filter((m) => m.text.trim().length > 20);
  const action = b.action && ["simple", "example", "steps", "compare", "other"].includes(b.action) ? b.action : null;
  const query = String(b.query || messages.filter((m) => m.role === "user").at(0)?.content || "").slice(0, 600);

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: TutorEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        const budget = BUDGET[mode];
        let r: Retrieval = { passages: [], refs: {}, topic: null, note: null, grounded: false };
        // Kullanıcı kendi materyalini verdiyse onu temel al; yine de konu seçiliyse kitaptan da getir
        if (bookIds.length && (b.topicId || !materials.length)) {
          send({ t: "status", x: "Kitaptan ilgili bölümler okunuyor…" });
          r = await retrieve({ bookIds, topicId: b.topicId, query, budgetChars: budget.chars, maxPages: budget.pages, signal: req.signal });
        } else if (!bookIds.length && !materials.length) {
          r.note = "Bir ders kitabı seçilmediği için genel müfredat bilgisiyle anlatıyorum.";
        }
        const labels: Record<string, SourceRef> = { ...r.refs };
        materials.forEach((m) => {
          labels[m.id] = { type: m.type === "upload" ? "upload" : "note", label: m.title, recordId: m.recordId };
        });
        const hasBook = r.grounded;
        const hasMat = materials.length > 0;
        const grounding: Grounding = hasBook && hasMat ? "mixed" : hasBook ? "textbook" : hasMat ? "user-material" : "general";
        send({ t: "meta", grounding, note: r.note, labels, topicId: r.topic?.id ?? b.topicId ?? null });

        const topicName = r.topic ? topicLabel(r.topic.id) : b.topicId ? topicLabel(b.topicId) : null;
        const ctx = tutorContextBlock({ grade, subjectId, topicLabel: topicName, mode, action });
        const src = sourcesBlock({
          passages: r.passages.map((p) => ({ id: p.id, label: r.refs[p.id]?.label ?? "", text: p.text })),
          materials: materials.map((m) => ({ id: m.id, title: m.title, text: m.text })),
        });
        const history = messages.slice(-9);
        // Kaynak ve bağlam, son kullanıcı mesajının başına eklenir; sistem istemi kararlı kalır (önbellek)
        const last = history[history.length - 1];
        const augmented = [...history.slice(0, -1), { role: "user" as const, content: `${ctx}\n\n${src ? src + "\n\n" : ""}ÖĞRENCİ MESAJI:\n${last.content}` }];

        const gen = streamText({
          model: MODELS.tutor,
          system: [{ text: TUTOR_SYSTEM, cache: true }],
          messages: augmented,
          maxTokens: budget.tokens,
          effort: mode === "hizli" && action !== "steps" ? "low" : "medium",
          signal: req.signal,
        });
        let truncated = false;
        for (;;) {
          const n = await gen.next();
          if (n.done) {
            truncated = n.value.truncated;
            break;
          }
          send({ t: "delta", x: n.value });
        }
        send({ t: "done", truncated });
      } catch (e) {
        const ai = e instanceof AiError ? e : null;
        send({ t: "error", code: ai?.code ?? "upstream", message: ai?.message ?? "Beklenmeyen bir sorun oluştu. Tekrar dene." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
}
