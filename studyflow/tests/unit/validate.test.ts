import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/catalog";
import { type GenQuestion, pickBalanced, validateGenerated } from "@/lib/exam/validate";

const book = BOOKS.find((b) => b.units.some((u) => u.topics.length >= 2))!;
const [t1, t2] = book.units.find((u) => u.topics.length >= 2)!.topics;
const ctx = (extra: Partial<Parameters<typeof validateGenerated>[1]> = {}) => ({
  allowedTopicIds: [t1.id, t2.id],
  subjectId: book.subjectId,
  allowedTypes: ["mcq" as const],
  basis: "curriculum-topic" as const,
  ...extra,
});
const q = (o: Partial<GenQuestion> = {}): GenQuestion => ({
  type: "mcq",
  stem: "Bir cismin hızı 3 m/s ise 4 saniyede aldığı yol kaç metredir?",
  choices: ["7", "10", "12", "16"],
  answerIndex: 2,
  answerText: "",
  rubric: [],
  explanation: "Yol = hız × zaman olduğundan 3 × 4 = 12 metre bulunur.",
  commonMistake: "Hız ile zamanı toplamak",
  choiceTags: ["toplama", "yanlış formül", "", "çarpma hatası"],
  topicId: t1.id,
  difficulty: "kolay",
  calcExpr: "3*4",
  sourcePage: 0,
  ...o,
});

describe("validateGenerated", () => {
  it("geçerli soruyu kabul eder ve hesap kontrolünü işaretler", () => {
    const r = validateGenerated([q()], ctx());
    expect(r.dropped).toEqual([]);
    expect(r.kept).toHaveLength(1);
    expect(r.kept[0].provenance).toBe("ai-generated");
    expect(r.kept[0].checks.calc).toBe("passed");
    expect(r.kept[0].choiceTags?.[2]).toBeNull(); // doğru seçenek etiketsiz
  });
  it("hesap kontrolü uyuşmayan soruyu eler", () => {
    const r = validateGenerated([q({ answerIndex: 1 })], ctx());
    expect(r.kept).toHaveLength(0);
    expect(r.dropped[0].reason).toMatch(/Hesap/);
  });
  it("belirsiz ve tekrarlı seçenekleri eler", () => {
    expect(validateGenerated([q({ choices: ["7", "10", "12", "Hepsi doğru"], calcExpr: "" })], ctx()).kept).toHaveLength(0);
    expect(validateGenerated([q({ choices: ["7", "10", "12", "12"], calcExpr: "" })], ctx()).kept).toHaveLength(0);
    expect(validateGenerated([q({ choices: ["7", "10", "12"], calcExpr: "" })], ctx()).kept).toHaveLength(0);
  });
  it("geçersiz cevap indeksini, kısa metni ve zayıf açıklamayı eler", () => {
    expect(validateGenerated([q({ answerIndex: 9, calcExpr: "" })], ctx()).kept).toHaveLength(0);
    expect(validateGenerated([q({ stem: "Kısa?" })], ctx()).kept).toHaveLength(0);
    expect(validateGenerated([q({ explanation: "Çünkü." })], ctx()).kept).toHaveLength(0);
  });
  it("izin verilmeyen tür ve konuyu eler; tek konuysa konuyu düzeltir", () => {
    expect(validateGenerated([q({ type: "short", answerText: "12" })], ctx()).kept).toHaveLength(0);
    expect(validateGenerated([q({ topicId: "b0-t0" })], ctx()).dropped[0].reason).toMatch(/Konu/);
    const one = validateGenerated([q({ topicId: "b0-t0" })], ctx({ allowedTopicIds: [t1.id] }));
    expect(one.kept[0].topicId).toBe(t1.id);
  });
  it("benzer soruyu tekrar saymaz", () => {
    const r = validateGenerated([q(), q()], ctx());
    expect(r.kept).toHaveLength(1);
    expect(r.dropped[0].reason).toMatch(/Benzer/);
  });
  it("yazılı soruda puanlama anahtarı ister", () => {
    const w = q({ type: "written", choices: [], rubric: ["Formülü yazar"], answerText: "12 m", calcExpr: "" });
    expect(validateGenerated([w], ctx({ allowedTypes: ["written"] })).kept).toHaveLength(0);
    const ok = { ...w, rubric: ["Formülü yazar", "Sonucu birimiyle verir"] };
    expect(validateGenerated([ok], ctx({ allowedTypes: ["written"] })).kept).toHaveLength(1);
  });
  it("bozuk girdiye dayanıklıdır", () => {
    const r = validateGenerated([null as unknown as GenQuestion, {} as GenQuestion], ctx());
    expect(r.kept).toHaveLength(0);
    expect(r.dropped).toHaveLength(2);
  });
});

describe("pickBalanced", () => {
  it("konulara dengeli dağıtır", () => {
    const mk = (topicId: string, i: number) => ({ ...validateGenerated([q({ topicId, stem: `Soru ${i} için yeterince uzun bir metin ${topicId} ${i * 7}` })], ctx()).kept[0] });
    const list = [mk(t1.id, 1), mk(t1.id, 2), mk(t1.id, 3), mk(t2.id, 4)];
    const out = pickBalanced(list, 2);
    expect(new Set(out.map((x) => x.topicId)).size).toBe(2);
  });
});
