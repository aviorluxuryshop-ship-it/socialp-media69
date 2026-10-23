// Doğrulanmış video kataloğu (scripts/verify-videos.mjs ile üretilir). Uydurma kayıt yoktur.
import raw from "@/data/videos.json";
import { resolveTopic } from "./catalog";

export type VideoStyle = "kisa" | "ayrintili" | "soru-cozumu" | "gorsel" | "eglenceli" | "hikaye";

export interface CatalogVideo {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  durationSec: number;
  publishedAt: string;
  subjectId: string;
  grade: 9 | 10;
  topicIds: string[];
  styles: VideoStyle[];
  verifiedAt: string;
}

export const VIDEOS = (raw as unknown as { videos: CatalogVideo[] }).videos;
export const VIDEO_BY_ID = new Map(VIDEOS.map((v) => [v.id, v]));
export const VIDEOS_GENERATED_AT = (raw as unknown as { generatedAt: string }).generatedAt;

export const STYLE_LABEL: Record<VideoStyle, string> = {
  eglenceli: "Eğlenceli anlatım",
  kisa: "Kısa anlatım",
  ayrintili: "Ayrıntılı anlatım",
  gorsel: "Görsel anlatım",
  "soru-cozumu": "Soru çözümü",
  hikaye: "Hikâyeleştirilmiş anlatım",
};
export const STYLE_ORDER: VideoStyle[] = ["eglenceli", "kisa", "ayrintili", "gorsel", "soru-cozumu", "hikaye"];

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export type DurationBucket = "all" | "short" | "mid" | "long";
export function inBucket(sec: number, b: DurationBucket): boolean {
  if (b === "all") return true;
  if (b === "short") return sec <= 600;
  if (b === "mid") return sec > 600 && sec <= 1800;
  return sec > 1800;
}

/** Bir konuyla aynı soy ağacında (ünite ↔ konu ↔ alt başlık) olan kimlikler */
export function lineage(topicId: string): Set<string> {
  const r = resolveTopic(topicId);
  const s = new Set<string>([topicId]);
  if (r) {
    s.add(r.unit.id);
    if (r.topic) s.add(r.topic.id);
    if (r.section) s.add(r.section.id);
    // alt başlıklar
    if (r.kind === "topic" && r.topic) for (const x of r.topic.sections) s.add(x.id);
    if (r.kind === "unit") for (const t of r.unit.topics) { s.add(t.id); for (const x of t.sections) s.add(x.id); }
  }
  return s;
}

export function videosForTopic(topicId: string): CatalogVideo[] {
  const L = lineage(topicId);
  return VIDEOS.filter((v) => v.topicIds.some((t) => L.has(t)));
}

export function youtubeUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}
export function thumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
