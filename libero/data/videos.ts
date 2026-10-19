import { TECH_BY_ID } from './index';
import curated from './videos/curated.json';
import verifiedFile from './videos/verified.json';
import { buildVideos, validateCurated, type Curated, type Verified, type Video } from './video-build';

/**
 * Video kütüphanesi.
 *
 * • curated.json   → elle seçilmiş videolar (konu, seviye, pozisyon, Türkçe özet)
 * • verified.json  → `npm run videos:verify` çıktısı: her kimlik YouTube oEmbed ile
 *                    doğrulanır (var mı, sahibi gömmeye izin veriyor mu) ve başlık/kanal
 *                    bilgisi oradan alınır.
 * • REPORT.md      → elenen videoların kimliği, nedeni ve tarihi
 * Siteye yalnızca doğrulanmış (ok: true) videolar girer. Videolar kopyalanmaz,
 * indirilmez; YouTube’un resmî gömme oynatıcısıyla ve kanal sahibi bağlantısıyla gösterilir.
 *
 * Konu/grup adları `video-topics.ts` içindedir (istemciye ağır veri taşımamak için).
 */

export { VIDEO_TOPIC_NAME, VIDEO_GROUPS, type VideoTopic } from './video-topics';
export type { Video } from './video-build';

const verified = (verifiedFile as { videos: Record<string, Verified> }).videos;

// Derleme sırasında tutarlılık denetimi (yinelenen kimlik, boş özet, bilinmeyen konu, kayıtsız video…).
// Elenen videoların REPORT.md'de listelenmesi mantık testinde ayrıca denetlenir.
{
  const errs = validateCurated(curated as Curated[], verified, new Set((curated as Curated[]).filter((c) => !verified[c.id]?.ok).map((c) => c.id)));
  if (errs.length) throw new Error('videos: kürasyon verisi geçersiz:\n - ' + errs.join('\n - '));
}

export const VIDEOS: Video[] = buildVideos(curated as Curated[], verified, (id) => TECH_BY_ID[id]?.name);

export const VIDEO_BY_ID: Record<string, Video> = Object.fromEntries(VIDEOS.map((v) => [v.id, v]));

export const VIDEOS_BY_TECH: Record<string, Video[]> = {};
VIDEOS.forEach((v) => v.techs.forEach((t) => (VIDEOS_BY_TECH[t] ??= []).push(v)));

/** İstemciye giden hafif sürüm */
export type VideoLite = Video;
