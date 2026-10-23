import { BadgeCheck, Bot, Calculator, FileSearch } from "lucide-react";
import { SUBJECT_BY_ID } from "@/lib/catalog/data";
import { getBook } from "@/lib/catalog";
import type { Question } from "@/lib/types";

const PROVENANCE: Record<Question["provenance"], { label: string; cls: string }> = {
  official: { label: "Resmî MEB sorusu", cls: "badge-ok" },
  "official-example": { label: "Resmî örnek", cls: "badge-ok" },
  "ai-generated": { label: "Yapay zekâ üretimi soru", cls: "badge-brass" },
};

/** Sorunun kökenini ve gerçekten yapılmış kontrolleri açıkça gösterir. Yapay zekâ sorusu asla "resmî" diye sunulmaz. */
export function QuestionMeta({ q, compact }: { q: Question; compact?: boolean }) {
  const p = PROVENANCE[q.provenance];
  const book = q.source.bookId ? getBook(q.source.bookId) : null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`badge ${p.cls}`}>
        <Bot size={12} /> {p.label}
      </span>
      {q.checks.calc === "passed" && (
        <span className="badge badge-ok" title="Cevap, ayrı bir hesapla doğrulandı">
          <Calculator size={12} /> Hesap doğrulandı
        </span>
      )}
      {q.checks.crossCheck === "passed" && (
        <span className="badge badge-ok" title="Bağımsız bir çözüm aynı cevaba ulaştı">
          <BadgeCheck size={12} /> Bağımsız çözümle uyuştu
        </span>
      )}
      {q.checks.crossCheck === "skipped" && (q.type === "mcq" || q.type === "truefalse") && (
        <span className="badge" title="Bağımsız çözüm kontrolü bu soruda çalışmadı">
          Çapraz kontrol yapılmadı
        </span>
      )}
      {!compact && (
        <span className="badge">
          <FileSearch size={12} />
          {q.source.basis === "textbook-excerpt" ? "Kitap sayfalarına dayalı" : q.source.basis === "user-material" ? "Kendi materyaline dayalı" : q.source.basis === "previous-mistake" ? "Önceki hatandan" : "Konu başlığına dayalı"}
        </span>
      )}
      {!compact && book && q.source.topicTitle && (
        <span className="badge max-w-[260px] truncate" title={`${book.title} · ${q.source.topicTitle}`}>
          {SUBJECT_BY_ID.get(q.subjectId)?.short ?? ""} · {q.source.topicTitle}
        </span>
      )}
    </div>
  );
}
