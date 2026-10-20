import type { Routine } from "./types";

export type CustomKind = "yesno" | "number" | "time";

export interface Inferred {
  kind: CustomKind;
  unit?: string;
  goal?: number;
  goalDir: "min" | "max";
  emoji: string;
  label: string;
}

const FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
/** Küçük harfe çevirir ve Türkçe harfleri ASCII'ye indirir; \b sınırları böylece doğru çalışır. */
const fold = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (c) => FOLD[c]);
const norm = (s: string) => fold(s).replace(/\s+/g, " ").trim();
const A = (re: RegExp) => new RegExp(fold(re.source), re.flags);

/** Metindeki birim sözcüğü → gösterilecek birim. */
const UNITS_SRC: [RegExp, string][] = [
  [/\b(bardak|bardağ)\w*/, "bardak"],
  [/\b(litre|lt)\b/, "litre"],
  [/\bml\b|\bmililitre\w*/, "ml"],
  [/\b(dakika|dk|dak)\b/, "dk"],
  [/\b(saat|sa)\b/, "saat"],
  [/\bsaniye\w*|\bsn\b/, "sn"],
  [/\badım\w*/, "adım"],
  [/\b(kilometre|km)\b/, "km"],
  [/\bmetre\w*|\bmt\b/, "metre"],
  [/\bsayfa\w*/, "sayfa"],
  [/\b(kilogram|kg|kilo)\b/, "kg"],
  [/\b(gram|gr)\b/, "gram"],
  [/\b(kalori|kcal)\w*/, "kcal"],
  [/\bset\b|\bsetlik\b/, "set"],
  [/\btekrar\w*/, "tekrar"],
  [/\bşınav\w*/, "şınav"],
  [/\bders\w*/, "ders"],
  [/\bkitap\w*/, "kitap"],
  [/\bporsiyon\w*/, "porsiyon"],
  [/\bfincan\w*/, "fincan"],
  [/\böğün\w*/, "öğün"],
  [/\b(kez|defa|sefer|kere)\b/, "kez"],
  [/\b(adet|tane)\b/, "adet"],
];

const EMOJI_SRC: [RegExp, string][] = [
  [/\bsu\b|bardak|litre/, "💧"],
  [/kitap|okuma|oku\w*|sayfa/, "📖"],
  [/boks/, "🥊"],
  [/spor|antrenman|fitness|ağırlık|şınav|set\b/, "🏋️"],
  [/koş|koşu/, "🏃"],
  [/yürü|adım/, "🚶"],
  [/yüz(me|dün|dü)|havuz/, "🏊"],
  [/bisiklet/, "🚴"],
  [/meditasyon|nefes|yoga|esneme/, "🧘"],
  [/vitamin|ilaç|hap\b/, "💊"],
  [/kahve/, "☕"],
  [/çay/, "🍵"],
  [/şeker|tatlı|çikolata/, "🍬"],
  [/sigara/, "🚭"],
  [/uyku|uyu/, "😴"],
  [/ders|çalış|sınav|ödev/, "📚"],
  [/kod|yazılım|proje/, "💻"],
  [/günlük|journal|not al/, "📓"],
  [/diş/, "🪥"],
  [/duş|banyo/, "🚿"],
  [/temizlik|oda|çamaşır|bulaşık/, "🧹"],
  [/para|harcama|tasarruf|bütçe/, "💰"],
  [/ara(dın|ma)|arkadaş|aile|anne|baba/, "📞"],
  [/dua|namaz/, "🕌"],
  [/müzik|gitar|piyano|enstrüman/, "🎵"],
  [/ekran|telefon|sosyal medya/, "📱"],
  [/kalori|yemek|öğün|sebze|meyve|protein/, "🥗"],
  [/kilo|tartı/, "⚖️"],
];

const QUESTION_WORDS = A(/\b(m[ıiuü]|m[ıiuü]sın|m[ıiuü]sın[ıiuü]z)\b|\?/);
const HOW_MANY = A(/\bkaç\b|\bne kadar\b|\bne kadar süre\b|\bsüre(si|n)?\b|\bmiktar\w*|\bkaç tane\b|\btoplam\b/);
const MAX_WORDS = A(/en fazla|en çok|azami|maksimum|\bmaks\b|altinda|alti\b|gecme|asma|limit|sinir/);

const UNITS = UNITS_SRC.map(([re, n]) => [A(re), n] as [RegExp, string]);
const EMOJI = EMOJI_SRC.map(([re, e]) => [A(re), e] as [RegExp, string]);

function pickEmoji(t: string): string {
  for (const [re, e] of EMOJI) if (re.test(t)) return e;
  return "📌";
}

/** "Kitap okudun mu?" → "Kitap okudun"; kısa tablo adı üretir. */
export function autoLabel(text: string): string {
  let s = text.replace(/[?!.]+$/g, "").trim();
  s = s.replace(/\b(bugün|günde|gün içinde)\b/gi, "").replace(/\s+/g, " ").trim();
  s = s.replace(/\s+(m[ıiuü])$/i, "").trim();
  const drop = /^(kaç|kaçta|ne|kadar|en|az|fazla|çok|toplam|hedef|\d+([.,]\d+)?)$/i;
  const verb = /(tı|ti|tu|tü|dı|di|du|dü)n$/i; // içtin, okudun, yaptın…
  let parts = s.split(" ").filter((w) => w && !drop.test(w));
  if (parts.length > 1 && verb.test(parts[parts.length - 1])) parts = parts.slice(0, -1);
  const words = parts.slice(0, 3).join(" ");
  const out = (words || text).slice(0, 18).trim();
  return out.charAt(0).toLocaleUpperCase("tr-TR") + out.slice(1);
}

/**
 * Yazılan rutin metninden giriş türünü, birimi ve hedefi tahmin eder.
 *  - "Saat kaçta kalktın?"            → saat
 *  - "Kaç bardak su içtin?" / "Su (bardak)" → sayı, birim: bardak
 *  - "Günde en az 3 litre su içtin mi?"    → Evet/Hayır (soru "mı" ile bitiyor)
 *  - diğer her şey                          → Evet/Hayır
 * Sonuç yalnızca öneridir; kullanıcı formda değiştirebilir.
 */
export function inferRoutine(raw: string): Inferred {
  const t = norm(raw);
  const emoji = pickEmoji(t);
  const label = autoLabel(raw);
  const goalDir: "min" | "max" = MAX_WORDS.test(t) ? "max" : "min";

  if (/saat kacta|kacta|hangi saatte|kac bucukta/.test(t)) {
    const full = raw.replace(/[?!.]+$/g, "").trim().slice(0, 24);
    return { kind: "time", goalDir, emoji, label: full.charAt(0).toLocaleUpperCase("tr-TR") + full.slice(1) };
  }

  let unit: string | undefined;
  let goal: number | undefined;
  for (const [re, name] of UNITS) {
    const m = re.exec(t);
    if (m) {
      unit = name;
      // "8 bardak", "2,5 litre" gibi birimden önceki sayı hedef olur
      const before = t.slice(0, m.index).match(/(\d+(?:[.,]\d+)?)\s*$/);
      if (before) goal = Number(before[1].replace(",", "."));
      break;
    }
  }
  if (goal === undefined) {
    const g = /(?:hedef|gunde|en az|en fazla|en cok)\s*(\d+(?:[.,]\d+)?)/.exec(t);
    if (g) goal = Number(g[1].replace(",", "."));
  }

  const isQuestion = QUESTION_WORDS.test(t);
  const asksAmount = HOW_MANY.test(t);
  const numberLike = asksAmount || (!isQuestion && (unit !== undefined || /\(\s*\S+\s*\)/.test(t)));

  if (numberLike) {
    // "Su (bardak)" biçimi: parantez içi birim
    if (!unit) {
      const p = /\(\s*([^)\d][^)]*)\)/.exec(raw);
      if (p) unit = p[1].trim().slice(0, 12);
    }
    return { kind: "number", unit, goal: goal && goal > 0 ? goal : undefined, goalDir, emoji, label };
  }
  return { kind: "yesno", goalDir, emoji, label };
}

export const kindLabel = (r: Pick<Routine, "kind" | "unit">) =>
  r.kind === "yesno" ? "Evet / Hayır" : r.kind === "time" ? "Saat" : `Sayı${r.unit ? ` (${r.unit})` : ""}`;
