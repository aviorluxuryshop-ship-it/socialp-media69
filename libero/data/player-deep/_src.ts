import type { PlayerSource } from '../player-types';

/** Kaynakların açılıp okunduğu gün */
export const ACCESSED = '2026-10-17';

/** İngilizce Vikipedi maddesi (oyun tarzı bölümü okundu) */
export const wiki = (name: string, slug: string, note: string, section = 'oyun tarzı bölümü'): PlayerSource => ({
  title: `${name} — Vikipedi (İngilizce madde), ${section}`,
  url: `https://en.wikipedia.org/wiki/${slug}`,
  accessed: ACCESSED,
  note,
});

export const cv = (title: string, url: string, note: string): PlayerSource => ({ title, url, accessed: ACCESSED, note });
