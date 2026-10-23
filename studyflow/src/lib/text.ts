// Türkçe metin yardımcıları.

const KEEP_UPPER = new Set(["DNA", "RNA", "ATP", "ADP", "NADH", "TYT", "AYT", "MEB", "TBMM", "BM", "AB", "ABD", "DNA'", "CO2", "UV", "LGS", "OGM", "AİHL", "TDE", "EBA", "SI", "SI'"]);

/** "GERÇEK SAYILARIN ÜSLÜ" → "Gerçek sayıların üslü" (cümle düzeni) */
export function sentenceCase(input: string): string {
  const s = input.replace(/\s+/g, " ").trim();
  if (!s) return s;
  const letters = s.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "");
  const upperRatio = letters ? letters.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length / letters.length : 0;
  if (upperRatio < 0.6) return s; // zaten karışık harfli
  const lower = s
    .split(" ")
    .map((w) => (KEEP_UPPER.has(w) ? w : w.toLocaleLowerCase("tr-TR")))
    .join(" ");
  return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
}

/** Arama için: küçük harf, aksan/Türkçe harf sadeleştirme */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  "ve veya ile bir bu şu o da de mi mı mu mü ne için gibi çok daha en olarak olan ya ki ama fakat ancak hem her bazı sonra önce kadar ise değil var yok nedir neden nasıl hangi kaç nelerdir midir mıdır".split(" "),
);
const STOP_FOLDED = new Set([...STOP].map(fold));

/** BM25 için kök-yaklaşık belirteçler: katlanmış ve ilk 6 harf (Türkçe ekleri törpüler) */
export function tokens(s: string): string[] {
  return fold(s)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_FOLDED.has(w))
    .map((w) => (w.length > 6 ? w.slice(0, 6) : w));
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

export function plural(n: number, one: string, many = one): string {
  return `${n} ${n === 1 ? one : many}`;
}
