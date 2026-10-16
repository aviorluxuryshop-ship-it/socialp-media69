import type { Level, PositionId } from '@/lib/types';
import { CAT_BY_ID } from './categories';
import { TECH_BY_ID } from './index';
import curated from './videos/curated.json';
import verifiedFile from './videos/verified.json';

/**
 * Video kütüphanesi.
 *
 * • curated.json   → elle seçilmiş videolar (konu, seviye, pozisyon, Türkçe özet)
 * • verified.json  → `npm run videos:verify` çıktısı: her kimlik YouTube oEmbed ile
 *                    doğrulanır (var mı, sahibi gömmeye izin veriyor mu) ve başlık/kanal
 *                    bilgisi oradan alınır.
 * Siteye yalnızca doğrulanmış (ok: true) videolar girer. Videolar kopyalanmaz,
 * indirilmez; YouTube’un resmî gömme oynatıcısıyla ve kanal sahibi bağlantısıyla gösterilir.
 */

export type VideoTopic =
  | 'pas' | 'sut' | 'kontrol' | 'surme' | 'kafa' | 'bitiricilik' | 'hucum' | 'savunma' | 'kalecilik' | 'duran' | 'topsuz'
  | 'taktik' | 'fiziksel' | 'onleme';

export const VIDEO_TOPIC_NAME: Record<VideoTopic, string> = {
  pas: 'Pas',
  sut: 'Şut ve vuruşlar',
  kontrol: 'Top kontrolü',
  surme: 'Top sürme ve çalım',
  kafa: 'Kafa vuruşu',
  bitiricilik: 'Bitiricilik',
  hucum: 'Hücum oyunu',
  savunma: 'Savunma',
  kalecilik: 'Kalecilik',
  duran: 'Duran toplar',
  topsuz: 'Topsuz hareketler',
  taktik: 'Taktik',
  fiziksel: 'Fiziksel gelişim',
  onleme: 'Isınma ve sakatlık önleme',
};

interface Curated {
  id: string;
  topic: VideoTopic;
  lv: [number, number];
  lang: 'tr' | 'en';
  summary: string;
  pos?: PositionId[];
  techs?: string[];
  note?: string;
}

interface Verified {
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
  note?: string;
  seconds: number | null;
  /** Türkçe altyazı durumu — yalnızca doğrulanabilen bilgiyi söyler */
  sub: 'tr-anlatim' | 'tr-ceviri' | 'tr-yok';
  verifiedAt: string;
}

const verified = (verifiedFile as { videos: Record<string, Verified> }).videos;

function subOf(c: Curated, v: Verified): Video['sub'] {
  if (c.lang === 'tr') return 'tr-anlatim';
  if (v.trCaptions || v.trTranslatable) return 'tr-ceviri';
  return 'tr-yok';
}

export const VIDEOS: Video[] = (curated as Curated[])
  .filter((c) => verified[c.id]?.ok)
  .map((c): Video => {
    const v = verified[c.id];
    return {
      id: c.id,
      title: v.title ?? c.id,
      author: v.author ?? 'YouTube kanalı',
      authorUrl: v.authorUrl ?? `https://www.youtube.com/watch?v=${c.id}`,
      topic: c.topic,
      lv: [Math.max(1, Math.min(5, c.lv[0])) as Level, Math.max(1, Math.min(5, c.lv[1])) as Level],
      lang: c.lang,
      summary: c.summary,
      pos: c.pos ?? [],
      techs: (c.techs ?? []).filter((t) => {
        if (!TECH_BY_ID[t]) throw new Error(`videos: bilinmeyen teknik kimliği "${t}" (video ${c.id})`);
        return true;
      }),
      note: c.note,
      seconds: v.seconds ?? null,
      sub: subOf(c, v),
      verifiedAt: v.verifiedAt ?? '',
    };
  });

export const VIDEOS_BY_TECH: Record<string, Video[]> = {};
VIDEOS.forEach((v) => v.techs.forEach((t) => (VIDEOS_BY_TECH[t] ??= []).push(v)));

export const topicName = (t: VideoTopic) => VIDEO_TOPIC_NAME[t];
export const topicIsCategory = (t: VideoTopic) => t in CAT_BY_ID;

/** İstemciye giden hafif sürüm */
export type VideoLite = Video;
