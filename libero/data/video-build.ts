import type { Level, PositionId } from '@/lib/types';
import { isVideoTopic, type VideoTopic } from './video-topics';

/**
 * Kürasyon + doğrulama kayıtlarından Video listesi üretir (saf işlev; JSON okumaz).
 * `data/videos.ts` bunu gerçek verilerle, mantık testleri sahte/okunmuş verilerle çağırır.
 */

export interface Curated {
  id: string;
  topic: VideoTopic;
  lv: [number, number];
  lang: 'tr' | 'en';
  summary: string;
  pos?: PositionId[];
  techs?: string[];
  note?: string;
}

export interface Verified {
  ok: boolean;
  verifiedAt?: string;
  title?: string;
  author?: string;
  authorUrl?: string;
  seconds?: number | null;
  watched?: boolean;
  captions?: { lang: string; auto: boolean }[];
  trCaptions?: boolean;
  trTranslatable?: boolean;
  reason?: string;
}

export interface RelatedTech {
  id: string;
  name: string;
}

export interface Video {
  id: string;
  title: string;
  author: string;
  authorUrl: string;
  topic: VideoTopic;
  lv: [Level, Level];
  lang: 'tr' | 'en';
  summary: string;
  pos: PositionId[];
  techs: string[];
  /** techs içindeki kimliklerin adları (modaldaki ilgili teknik bağlantıları için) */
  related: RelatedTech[];
  note?: string;
  seconds: number | null;
  /** Türkçe altyazı durumu — yalnızca doğrulanabilen bilgiyi söyler */
  sub: 'tr-anlatim' | 'tr-ceviri' | 'tr-yok';
  verifiedAt: string;
}

export function subOf(lang: 'tr' | 'en', v: Verified): Video['sub'] {
  if (lang === 'tr') return 'tr-anlatim';
  if (v.trCaptions || v.trTranslatable) return 'tr-ceviri';
  return 'tr-yok';
}

const clampLv = (n: number) => Math.max(1, Math.min(5, Math.round(n))) as Level;

export function buildVideos(curated: Curated[], verified: Record<string, Verified>, techName: (id: string) => string | undefined): Video[] {
  return curated
    .filter((c) => verified[c.id]?.ok)
    .map((c): Video => {
      const v = verified[c.id];
      if (!isVideoTopic(c.topic)) throw new Error(`videos: bilinmeyen konu "${c.topic}" (video ${c.id})`);
      const techs = (c.techs ?? []).filter((t) => {
        if (techName(t) === undefined) throw new Error(`videos: bilinmeyen teknik kimliği "${t}" (video ${c.id})`);
        return true;
      });
      return {
        id: c.id,
        title: v.title ?? c.id,
        author: v.author ?? 'YouTube kanalı',
        authorUrl: v.authorUrl ?? `https://www.youtube.com/watch?v=${c.id}`,
        topic: c.topic,
        lv: [clampLv(c.lv[0]), clampLv(c.lv[1])],
        lang: c.lang,
        summary: c.summary,
        pos: c.pos ?? [],
        techs,
        related: techs.map((t) => ({ id: t, name: techName(t) as string })),
        note: c.note,
        seconds: v.seconds ?? null,
        sub: subOf(c.lang, v),
        verifiedAt: v.verifiedAt ?? '',
      };
    });
}

/** Veri tutarlılığı: yinelenen kimlik, boş özet, geçersiz seviye aralığı… Sorun listesini döndürür. */
export function validateCurated(curated: Curated[], verified: Record<string, Verified>, excludedListed: Set<string>): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const c of curated) {
    if (!/^[\w-]{11}$/.test(c.id)) errs.push(`geçersiz YouTube kimliği: ${c.id}`);
    if (seen.has(c.id)) errs.push(`yinelenen kimlik: ${c.id}`);
    seen.add(c.id);
    if (!isVideoTopic(c.topic)) errs.push(`${c.id}: bilinmeyen konu ${c.topic}`);
    if (!c.summary || c.summary.trim().length < 20) errs.push(`${c.id}: özet boş ya da çok kısa`);
    if (c.lang !== 'tr' && c.lang !== 'en') errs.push(`${c.id}: dil tr/en olmalı`);
    if (!Array.isArray(c.lv) || c.lv.length !== 2 || c.lv[0] < 1 || c.lv[1] > 5 || c.lv[0] > c.lv[1]) errs.push(`${c.id}: seviye aralığı geçersiz`);
    const v = verified[c.id];
    if (!v) errs.push(`${c.id}: doğrulama kaydı yok`);
    else if (!v.ok && !excludedListed.has(c.id)) errs.push(`${c.id}: elenmiş ama REPORT.md içinde listelenmemiş`);
  }
  return errs;
}
