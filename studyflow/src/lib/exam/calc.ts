// Güvenli aritmetik ifade değerlendirici (eval yok). Sayısal soru cevaplarını belirleyici olarak doğrulamak için.
// Desteklenen: + - * / ^ ( ), ondalık (nokta), sqrt, cbrt, abs, sin/cos/tan (radyan), sind/cosd/tand (derece),
// log (10 tabanı), ln, pi, e. "2sqrt(3)" gibi örtük çarpma yoktur; yalnızca parantez önü: 2(3+1).

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      if (/[eE]/.test(src[j] ?? "") && /[+-]?\d/.test(src.slice(j + 1, j + 3))) {
        j++;
        if (/[+-]/.test(src[j])) j++;
        while (j < src.length && /[0-9]/.test(src[j])) j++;
      }
      const n = Number(src.slice(i, j));
      if (!Number.isFinite(n)) throw new Error("bad-number");
      out.push({ t: "num", v: n });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9]/.test(src[j])) j++;
      out.push({ t: "id", v: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^(),".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error("bad-char");
  }
  return out;
}

const FN: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sind: (x) => Math.sin((x * Math.PI) / 180),
  cosd: (x) => Math.cos((x * Math.PI) / 180),
  tand: (x) => Math.tan((x * Math.PI) / 180),
  log: Math.log10,
  ln: Math.log,
};
const CONST: Record<string, number> = { pi: Math.PI, e: Math.E };

export function evalExpr(src: string): number {
  if (src.length > 200) throw new Error("too-long");
  const toks = lex(src);
  let p = 0;
  let depth = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v && !(t.t === "op" && t.v === v))) throw new Error("syntax");
    p++;
    return t;
  };
  function expr(): number {
    let v = term();
    while (peek()?.t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = (eat() as { v: string }).v;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function term(): number {
    let v = unary();
    while (peek()?.t === "op" && (peek().v === "*" || peek().v === "/")) {
      const op = (eat() as { v: string }).v;
      const r = unary();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function unary(): number {
    const t = peek();
    if (t?.t === "op" && (t.v === "-" || t.v === "+")) {
      eat();
      const v = unary();
      return t.v === "-" ? -v : v;
    }
    return power();
  }
  function power(): number {
    const base = atom();
    if (peek()?.t === "op" && peek().v === "^") {
      eat();
      const ex = unary(); // sağdan birleşimli
      return Math.pow(base, ex);
    }
    return base;
  }
  function atom(): number {
    const t = toks[p];
    if (!t) throw new Error("syntax");
    if (t.t === "num") {
      p++;
      // 2(3+1) örtük çarpma
      if (peek()?.t === "op" && peek().v === "(") return t.v * group();
      return t.v;
    }
    if (t.t === "id") {
      p++;
      if (FN[t.v]) {
        const x = group();
        return FN[t.v](x);
      }
      if (t.v in CONST) return CONST[t.v];
      throw new Error("unknown-id");
    }
    if (t.t === "op" && t.v === "(") return group();
    throw new Error("syntax");
  }
  function group(): number {
    eat("(");
    if (++depth > 20) throw new Error("deep");
    const v = expr();
    eat(")");
    depth--;
    return v;
  }
  const v = expr();
  if (p !== toks.length) throw new Error("trailing");
  if (!Number.isFinite(v)) throw new Error("not-finite");
  return v;
}

/** Seçenek metninden sayısal değeri çıkarır; çıkaramazsa null. Birim ve açıklama sözcükleri yok sayılır. */
export function parseAnswerNumber(text: string): { value: number; decimals: number } | null {
  let s = text
    .replace(/\$/g, "")
    .replace(/\\left|\\right|\\,|\;|\\!/g, "")
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\cdot|\\times|[×·]/g, "*")
    .replace(/\\div|÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/√\s*\(([^()]+)\)/g, "sqrt($1)")
    .replace(/√\s*(\d+(?:[.,]\d+)?)/g, "sqrt($1)")
    .replace(/\^\{([^{}]+)\}/g, "^($1)")
    .replace(/(\d)\s*sqrt/g, "$1*sqrt")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d)\s+(\d{3})(?!\d)/g, "$1$2") // 1 000 → 1000
    .trim();
  const pct = /%/.test(s);
  s = s.replace(/%/g, "");
  // sondaki birim/açıklama sözcüklerini at (yalnızca harf/° ve boşluk)
  s = s.replace(/\s*[°]?\s*[A-Za-zÇĞİÖŞÜçğıöşü/²³]+(?:\s*[A-Za-zÇĞİÖŞÜçğıöşü/²³]+)*\.?\s*$/u, (m) => (/^\s*(sqrt|sin|cos|tan|log|ln|pi|e)\b/i.test(m) ? m : ""));
  s = s.replace(/²/g, "^2").replace(/³/g, "^3");
  if (!s || !/[0-9]|pi|sqrt/.test(s)) return null;
  try {
    let v = evalExpr(s);
    if (pct) v /= 100;
    const dec = /\d\.(\d+)/.exec(s);
    return { value: v, decimals: dec ? dec[1].length : 0 };
  } catch {
    return null;
  }
}

/** Sayısal doğrulama: ifade, doğru seçeneğin değeriyle (yuvarlama payıyla) uyuşuyor mu? */
export function checkCalc(expr: string, correctChoice: string): "passed" | "failed" | "unverifiable" {
  const want = parseAnswerNumber(correctChoice);
  if (!want) return "unverifiable";
  let got: number;
  try {
    got = evalExpr(expr);
  } catch {
    return "unverifiable";
  }
  const tol = want.decimals > 0 ? 0.6 * Math.pow(10, -want.decimals) : Math.max(1e-9, Math.abs(want.value) * 1e-9);
  return Math.abs(got - want.value) <= tol + 1e-12 ? "passed" : "failed";
}
