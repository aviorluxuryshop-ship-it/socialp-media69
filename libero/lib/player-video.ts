import type { Video } from '@/data/video-build';
import { VIDEO_TOPIC_NAME, type VideoTopic } from '@/data/video-topics';
import { norm } from './utils';

/**
 * Oyuncu sayfasında video penceresinin yan paneli ("Bu videoda bak").
 * Dürüstlük: kütüphanedeki videolar genelde oyuncuyu değil, ilgili beceriyi anlatan eğitim videolarıdır.
 * Videonun başlığında oyuncunun adı geçse bile içeriğini izleyerek doğrulamadığımızı söyler.
 * Zaman kodu uydurmaz.
 */

export interface PanelPlayer {
  name: string;
  watch: string[];
  videoLooks: Partial<Record<VideoTopic, string>>;
  techs: string[];
}

export interface PanelModel {
  /** Videonun oyuncuyla ilişkisini dürüstçe anlatan cümle */
  intro: string;
  /** Başlıkta oyuncunun adı geçiyor mu (içerik doğrulanmadı) */
  titleMentions: boolean;
  /** Bu video konusuna göre oyuncuda neye bakılacağı */
  look: string[];
  /** look, konuya özel metin mi yoksa genel izleme noktalarından mı? */
  specific: boolean;
  /** Hem videonun hem oyuncunun teknikleri */
  sharedTechs: { id: string; name: string }[];
}

const PARTICLES = new Set(['van', 'der', 'den', 'de', 'da', 'dos', 'di', 'el', 'junior']);

/** Başlıkta oyuncu adı geçiyor mu? (ad/soyad parçaları ≥ 4 harf, edatlar hariç) */
export function titleMentionsPlayer(title: string, name: string): boolean {
  const t = ` ${norm(title)} `;
  const tokens = norm(name).split(' ').filter((w) => w.length >= 4 && !PARTICLES.has(w));
  return tokens.some((w) => t.includes(` ${w} `) || t.includes(` ${w}`));
}

export function buildVideoPanel(p: PanelPlayer, v: Pick<Video, 'title' | 'topic' | 'techs' | 'related'>): PanelModel {
  const mentions = titleMentionsPlayer(v.title, p.name);
  const topic = VIDEO_TOPIC_NAME[v.topic].toLocaleLowerCase('tr');
  const intro = mentions
    ? `Videonun başlığında ${p.name} geçiyor; ancak bu site videonun içeriğini izleyerek doğrulamadı. Beceriye odaklan ve ${p.name} oyununda şunu ara:`
    : `Bu video ${p.name} hakkında değil; “${topic}” konusunu anlatan bir eğitim videosu. Aynı beceriyi ${p.name} oyununda şöyle izle:`;
  const spec = p.videoLooks[v.topic];
  const look = spec ? [spec] : p.watch.slice(0, 2);
  const shared = v.related.filter((r) => p.techs.includes(r.id)).map((r) => ({ id: r.id, name: r.name }));
  return { intro, titleMentions: mentions, look, specific: !!spec, sharedTechs: shared };
}
