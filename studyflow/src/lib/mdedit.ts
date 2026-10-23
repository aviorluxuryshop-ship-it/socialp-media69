// Not editörü için saf (test edilebilir) Markdown düzenleme yardımcıları.
export interface EditResult {
  value: string;
  start: number;
  end: number;
}

/** Seçimi önek/sonek ile sarar; seçim yoksa yer tutucuyu ekler ve seçili bırakır. Zaten sarılıysa kaldırır. */
export function wrapSelection(value: string, start: number, end: number, before: string, after = before, placeholder = "metin"): EditResult {
  const sel = value.slice(start, end);
  const hasWrap = value.slice(start - before.length, start) === before && value.slice(end, end + after.length) === after;
  if (hasWrap) {
    return { value: value.slice(0, start - before.length) + sel + value.slice(end + after.length), start: start - before.length, end: end - before.length };
  }
  const text = sel || placeholder;
  const out = value.slice(0, start) + before + text + after + value.slice(end);
  return { value: out, start: start + before.length, end: start + before.length + text.length };
}

/** Seçili satırların başına önek ekler (zaten varsa kaldırır). `numbered` ise 1. 2. 3. şeklinde numaralar. */
export function prefixLines(value: string, start: number, end: number, prefix: string, numbered = false): EditResult {
  const ls = value.lastIndexOf("\n", start - 1) + 1;
  let le = value.indexOf("\n", end);
  if (le === -1) le = value.length;
  const lines = value.slice(ls, le).split("\n");
  const all = lines.every((l) => (numbered ? /^\d+\.\s/.test(l) : l.startsWith(prefix)));
  const next = lines.map((l, i) => {
    if (all) return numbered ? l.replace(/^\d+\.\s/, "") : l.slice(prefix.length);
    return numbered ? `${i + 1}. ${l.replace(/^\d+\.\s/, "")}` : prefix + l;
  });
  const out = value.slice(0, ls) + next.join("\n") + value.slice(le);
  return { value: out, start: ls, end: ls + next.join("\n").length };
}

export function plainSnippet(md: string, n = 150): string {
  const t = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " [formül] ")
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…";
}

export function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}
