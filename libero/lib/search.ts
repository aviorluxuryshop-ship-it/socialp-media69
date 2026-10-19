import { norm } from './utils';

export type DocKind =
  | 'teknik'
  | 'egzersiz'
  | 'taktik'
  | 'test'
  | 'video'
  | 'pozisyon'
  | 'yiyecek'
  | 'oyuncu'
  | 'sayfa';

export const KIND_LABEL: Record<DocKind, string> = {
  teknik: 'Teknik',
  egzersiz: 'Egzersiz',
  taktik: 'Taktik',
  test: 'Futbol IQ',
  video: 'Video',
  pozisyon: 'Pozisyon',
  yiyecek: 'Beslenme',
  oyuncu: 'Oyuncu analizi',
  sayfa: 'Sayfa',
};

export interface SearchDoc {
  k: DocKind;
  t: string; // başlık
  d: string; // kısa açıklama
  u: string; // adres
  x?: string; // ek arama metni
  a?: string[]; // takma adlar / eş anlamlılar
  c?: string; // kategori etiketi
}

export interface Indexed extends SearchDoc {
  nt: string;
  na: string;
  nx: string;
  tw: string[];
  aw: string[];
}

export function buildIndex(docs: SearchDoc[]): Indexed[] {
  return docs.map((d) => {
    const nt = norm(d.t);
    const na = norm((d.a ?? []).join(' '));
    return {
      ...d,
      nt,
      na,
      nx: norm((d.x ?? '') + ' ' + d.d + ' ' + (d.c ?? '')),
      tw: nt.split(' ').filter(Boolean),
      aw: na.split(' ').filter(Boolean),
    };
  });
}

function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[n];
}

function tokenScore(tok: string, d: Indexed): number {
  let s = 0;
  if (d.tw.includes(tok)) s = Math.max(s, 12);
  else if (d.tw.some((w) => w.startsWith(tok))) s = Math.max(s, 9);
  else if (d.nt.includes(tok)) s = Math.max(s, 6);

  if (d.aw.includes(tok)) s = Math.max(s, 10);
  else if (d.aw.some((w) => w.startsWith(tok))) s = Math.max(s, 7);
  else if (d.na.includes(tok)) s = Math.max(s, 5);

  // Türkçe ekler: "pasları" → "pas"
  if (tok.length >= 5) {
    if (d.tw.some((w) => w.length >= 3 && tok.startsWith(w))) s = Math.max(s, 6);
    if (d.aw.some((w) => w.length >= 3 && tok.startsWith(w))) s = Math.max(s, 5);
  }

  if (s < 3 && d.nx.includes(tok)) s = Math.max(s, 2);

  if (s === 0 && tok.length >= 4) {
    const max = tok.length >= 7 ? 2 : 1;
    const words = d.tw.concat(d.aw);
    if (words.some((w) => w.length >= 3 && lev(tok, w.slice(0, tok.length + 1), max) <= max)) s = 3;
  }
  return s;
}

export function search(index: Indexed[], q: string, limit = 40): Indexed[] {
  const nq = norm(q);
  if (!nq) return [];
  const toks = nq.split(' ').filter(Boolean);
  const scored: { d: Indexed; s: number }[] = [];
  for (const d of index) {
    let total = 0;
    let all = true;
    for (const t of toks) {
      const s = tokenScore(t, d);
      if (s === 0) {
        all = false;
        break;
      }
      total += s;
    }
    if (!all) continue;
    if (d.nt === nq) total += 20;
    else if (d.nt.startsWith(nq)) total += 8;
    scored.push({ d, s: total });
  }
  scored.sort((a, b) => b.s - a.s || a.d.t.localeCompare(b.d.t, 'tr'));
  return scored.slice(0, limit).map((x) => x.d);
}
