// Özet bölümleri: hem istemci (seçenekler) hem sunucu (şema/talimat) tarafından kullanılır.
import type { SummarySection } from "@/lib/types";

export const SECTION_META: { id: SummarySection; label: string; hint: string; instruction: string }[] = [
  { id: "quick", label: "Hızlı tekrar özeti", hint: "5-8 madde", instruction: "quick: 5-8 madde; her biri tek, kendi içinde anlaşılır cümle. En önemli bilgileri seç." },
  { id: "detailed", label: "Ayrıntılı özet", hint: "Başlıklı anlatım", instruction: "detailed: Markdown; ## ara başlıklarla 350-700 kelimelik düzenli özet. Matematiksel ifadeleri $...$ ile yaz." },
  { id: "keyConcepts", label: "Anahtar kavramlar", hint: "Terim + tek cümle", instruction: "keyConcepts: 6-12 öğe; term kısa, meaning tek cümle ve öğrencinin diliyle." },
  { id: "formulas", label: "Formül kâğıdı", hint: "Matematik, fizik, kimya", instruction: "formulas: Yalnızca materyalde/kaynakta geçen formüller. name, latex ($ işaretleri olmadan saf LaTeX), note (değişkenlerin anlamı ve ne zaman kullanılacağı). Formül yoksa boş dizi." },
  { id: "comparisons", label: "Kavram karşılaştırması", hint: "Karıştırılan kavramlar", instruction: "comparisons: 1-3 tablo; sık karıştırılan kavramları karşılaştır. title, columns (kavram adları), rows (label: ölçüt, cells: her kavram için kısa hücre). Karşılaştırılacak kavram yoksa boş dizi." },
  { id: "flashcards", label: "Bilgi kartları", hint: "8-16 kart", instruction: "flashcards: 8-16 kart; front kısa soru/terim, back kısa ve kesin cevap." },
  { id: "examSheet", label: "Sınav odaklı tekrar kâğıdı", hint: "Dikkat edilecekler", instruction: "examSheet: 6-10 madde; point = sınavda sık sorulan/önemli nokta, tip = o noktada yapılan yaygın hata veya hatırlatma." },
];

export function buildSummarySchema(sections: SummarySection[]) {
  const props: Record<string, unknown> = {};
  const str = { type: "string" };
  const defs: Record<SummarySection, unknown> = {
    quick: { type: "array", items: str },
    detailed: str,
    keyConcepts: { type: "array", items: { type: "object", additionalProperties: false, required: ["term", "meaning"], properties: { term: str, meaning: str } } },
    formulas: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "latex", "note"], properties: { name: str, latex: str, note: str } } },
    comparisons: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "columns", "rows"],
        properties: {
          title: str,
          columns: { type: "array", items: str },
          rows: { type: "array", items: { type: "object", additionalProperties: false, required: ["label", "cells"], properties: { label: str, cells: { type: "array", items: str } } } },
        },
      },
    },
    flashcards: { type: "array", items: { type: "object", additionalProperties: false, required: ["front", "back"], properties: { front: str, back: str } } },
    examSheet: { type: "array", items: { type: "object", additionalProperties: false, required: ["point", "tip"], properties: { point: str, tip: str } } },
  };
  for (const s of sections) props[s] = defs[s];
  return { type: "object", additionalProperties: false, required: sections, properties: props };
}
