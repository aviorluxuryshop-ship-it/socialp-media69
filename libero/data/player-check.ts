import type { VideoTopic } from './video-topics';
import { PLAYER_KIND_NAME, type PlayerAnalysis } from './player-types';

/**
 * Oyuncu verisi denetimi — saf işlev (derleme sırasında ve mantık testinde çalışır).
 * Bölüm eksikliği, geçersiz kaynak/teknik/video, yinelenen kimlik ve istatistik/ödül/transfer dili yakalanır.
 */

export interface PlayerCheckCtx {
  techIds: Set<string>;
  /** Kütüphanedeki doğrulanmış (ok: true, gömülebilir) videoların kimliği → konusu */
  videoTopics: Record<string, VideoTopic>;
}

/** Sayı/istatistik/ödül/transfer/maaş dili: bu sayfalarda bulunmaz */
export const FORBIDDEN_RE =
  /%|\b\d{2,}\s*(gol|asist|maç|kupa|milyon|milyar|€|euro|avro|sterlin|dolar|yıl)|ballon|altın top|transfer|maaş|bonservis|ücret|rekor|şampiyonluk|sezonunda\s+\d/i;

const SECTION_ARRAYS = ['onBall', 'offBall', 'defending', 'lessons', 'watch', 'positioning', 'passing', 'control', 'decisions', 'strengths', 'limits'] as const;

function textOf(p: PlayerAnalysis): string[] {
  const out: string[] = [p.role, p.tagline, p.style];
  for (const k of SECTION_ARRAYS) out.push(...p[k]);
  out.push(...Object.values(p.videoLooks).filter((x): x is string => !!x));
  for (const e of p.extra ?? []) out.push(e.title, ...e.items);
  for (const s of p.sources) out.push(s.note);
  return out;
}

export function validatePlayers(players: PlayerAnalysis[], ctx: PlayerCheckCtx): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const p of players) ids.add(p.id);
  const seen = new Set<string>();
  for (const p of players) {
    const e = (m: string) => errs.push(`${p.id}: ${m}`);
    if (!/^[a-z0-9-]+$/.test(p.id)) e('kimlik yalnızca küçük harf, rakam ve tire içermeli');
    if (seen.has(p.id)) e('yinelenen kimlik');
    seen.add(p.id);
    if (!p.name.trim() || !p.role.trim() || p.tagline.trim().length < 20 || p.style.trim().length < 80) e('ad/rol/slogan/özet eksik ya da çok kısa');
    if (!(p.kind in PLAYER_KIND_NAME)) e(`geçersiz tür: ${p.kind}`);
    for (const k of SECTION_ARRAYS) {
      const arr = p[k];
      if (!Array.isArray(arr) || arr.length === 0) e(`"${k}" bölümü boş`);
      else if (arr.some((s) => typeof s !== 'string' || s.trim().length < 12)) e(`"${k}" içinde boş/çok kısa madde var`);
    }
    if (p.techs.length < 3) e('en az 3 teknik bağlantısı olmalı');
    for (const t of p.techs) if (!ctx.techIds.has(t)) e(`bilinmeyen teknik kimliği: ${t}`);
    if (new Set(p.techs).size !== p.techs.length) e('yinelenen teknik');
    if (p.similar.length < 1) e('benzer oyuncu yok');
    for (const s of p.similar) {
      if (s === p.id) e('kendini benzer oyuncu olarak gösteriyor');
      else if (!ids.has(s)) e(`benzer oyuncu bulunamadı: ${s}`);
    }
    if (new Set(p.similar).size !== p.similar.length) e('yinelenen benzer oyuncu');
    // kaynaklar
    if (p.sources.length < 1) e('en az 1 kaynak (gerçekten açılmış sayfa) olmalı');
    const urls = new Set<string>();
    for (const s of p.sources) {
      let u: URL | null = null;
      try { u = new URL(s.url); } catch { /* aşağıda raporlanır */ }
      if (!u || u.protocol !== 'https:') e(`kaynak adresi geçersiz: ${s.url}`);
      if (urls.has(s.url)) e(`yinelenen kaynak: ${s.url}`);
      urls.add(s.url);
      if (!s.title.trim() || s.note.trim().length < 12) e(`kaynak başlığı/notu eksik: ${s.url}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.accessed) || Number.isNaN(Date.parse(s.accessed))) e(`kaynak erişim tarihi geçersiz: ${s.url}`);
    }
    // videolar
    if (p.videos.length < 3 || p.videos.length > 6) e(`3–6 video olmalı (${p.videos.length})`);
    if (new Set(p.videos).size !== p.videos.length) e('yinelenen video');
    for (const v of p.videos) {
      const topic = ctx.videoTopics[v];
      if (!topic) e(`video kütüphanede doğrulanmış değil: ${v}`);
      else if (!p.videoLooks[topic]) e(`"${topic}" konulu video için "Bu videoda bak" metni yok (${v})`);
    }
    for (const [t, txt] of Object.entries(p.videoLooks)) {
      if (!txt || txt.trim().length < 30) e(`videoLooks.${t} çok kısa`);
      if (!p.videos.some((v) => ctx.videoTopics[v] === t)) e(`videoLooks.${t} hiçbir videonun konusu değil`);
    }
    // en kapsamlı analiz
    if (p.deep) {
      if ((p.extra ?? []).length < 2) e('en kapsamlı analizde en az 2 ek blok olmalı');
      for (const k of ['positioning', 'passing', 'control', 'decisions', 'strengths', 'limits'] as const) if (p[k].length < 4) e(`en kapsamlı analizde "${k}" en az 4 madde içermeli`);
      if (p.sources.length < 2) e('en kapsamlı analizde en az 2 kaynak olmalı');
    }
    for (const x of p.extra ?? []) if (!x.title.trim() || x.items.length < 3) e(`ek blok eksik: ${x.title}`);
    // dil: istatistik/ödül/transfer yok
    for (const t of textOf(p)) {
      const m = FORBIDDEN_RE.exec(t);
      if (m) e(`yasak dil (“${m[0]}”): ${t.slice(0, 60)}…`);
    }
  }
  return errs;
}
