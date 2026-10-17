/**
 * Videolara kişisel zaman damgalı notlar ("anlar").
 * Bu dosya yalnızca saf veri mantığıdır; depoya yazma `lib/store.ts` üzerinden yapılır.
 * Zaman damgaları kullanıcının kendi oynatıcıdan aldığı/yazdığı saniyelerdir — yaratıcı bölümü (chapter) değildir.
 */

export interface VideoMoment {
  /** saniye (tam sayı) */
  t: number;
  text: string;
  /** ISO zamanı */
  at: string;
}

export type VideoMoments = Record<string, VideoMoment[]>;

export const MAX_MOMENTS_PER_VIDEO = 100;
export const MAX_MOMENT_VIDEOS = 400;
export const MAX_MOMENT_TEXT = 280;
export const MAX_MOMENT_SECONDS = 48 * 3600;

const ID_RE = /^[\w-]{6,20}$/;

export function sanitizeMoment(raw: unknown): VideoMoment | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const t = typeof r.t === 'number' ? r.t : typeof r.t === 'string' ? Number(r.t) : NaN;
  if (!Number.isFinite(t) || t < 0 || t > MAX_MOMENT_SECONDS) return null;
  const text = typeof r.text === 'string' ? r.text.replace(/\s+/g, ' ').trim().slice(0, MAX_MOMENT_TEXT) : '';
  if (!text) return null;
  const at = typeof r.at === 'string' && !Number.isNaN(Date.parse(r.at)) ? r.at : '';
  return { t: Math.floor(t), text, at };
}

/** Bozuk/eksik kayıtları atar; eski yedeklerde alan yoksa {} döner. */
export function sanitizeMoments(raw: unknown): VideoMoments {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: VideoMoments = {};
  for (const [id, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!ID_RE.test(id) || !Array.isArray(list)) continue;
    const clean = list.map(sanitizeMoment).filter((m): m is VideoMoment => m !== null).slice(0, MAX_MOMENTS_PER_VIDEO);
    if (clean.length) out[id] = clean;
    if (Object.keys(out).length >= MAX_MOMENT_VIDEOS) break;
  }
  return out;
}

/** Yeni not ekler (saf): zamana göre sıralı tutulur, sınırlar korunur. Geçersizse aynı nesneyi döndürür. */
export function withMoment(all: VideoMoments, videoId: string, t: number, text: string, at: string): VideoMoments {
  const m = sanitizeMoment({ t, text, at });
  if (!m || !ID_RE.test(videoId)) return all;
  const cur = all[videoId] ?? [];
  if (cur.length >= MAX_MOMENTS_PER_VIDEO) return all;
  const next = [...cur, m].sort((a, b) => a.t - b.t || a.at.localeCompare(b.at));
  return { ...all, [videoId]: next };
}

/** Notu siler (saf). `at` + `t` eşleşmesiyle bulunur; son not silinince video anahtarı kaldırılır. */
export function withoutMoment(all: VideoMoments, videoId: string, m: VideoMoment): VideoMoments {
  const cur = all[videoId];
  if (!cur) return all;
  const next = cur.filter((x) => !(x.t === m.t && x.at === m.at && x.text === m.text));
  if (next.length === cur.length) return all;
  const out = { ...all };
  if (next.length) out[videoId] = next;
  else delete out[videoId];
  return out;
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

/** "1:05", "65", "1:02:03" → saniye; geçersizse null */
export function parseTime(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  if (!/^\d{1,5}(:\d{1,2}){0,2}$/.test(s)) return null;
  const parts = s.split(':').map(Number);
  if (parts.length > 1 && parts.slice(1).some((p) => p > 59)) return null;
  const sec = parts.reduce((acc, p) => acc * 60 + p, 0);
  return sec <= MAX_MOMENT_SECONDS ? sec : null;
}
