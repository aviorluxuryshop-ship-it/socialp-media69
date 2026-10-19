import type { Video } from '@/data/video-build';
import {
  GROUP_OF_TOPIC,
  VIDEO_GROUPS,
  VIDEO_GROUP_BY_ID,
  VIDEO_TOPIC_NAME,
  VIDEO_TOPIC_ORDER,
  isVideoGroup,
  isVideoTopic,
  type VideoGroupId,
  type VideoTopic,
} from '@/data/video-topics';
import { POSITIONS, LEVEL_NAMES, type Level, type PositionId } from './types';
import { norm } from './utils';

/**
 * Video kütüphanesi süzgeçleri — saf mantık (React/DOM yok), mantık testlerinde sınanır.
 * Adres parametreleri: ?q= &grup= &konu= &dil=tr|en &seviye=1-5 &pozisyon= &sirala=seviye|dil &uygun=1
 */

export type LangFilter = 'all' | 'tr' | 'en';
export type SortKey = 'konu' | 'seviye' | 'dil';

export interface VideoFilters {
  q: string;
  group: VideoGroupId | 'all';
  topic: VideoTopic | 'all';
  lang: LangFilter;
  level: number | 'all';
  pos: PositionId | 'all';
  mine: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: VideoFilters = { q: '', group: 'all', topic: 'all', lang: 'all', level: 'all', pos: 'all', mine: false, sort: 'konu' };

export const SORT_LABEL: Record<SortKey, string> = { konu: 'Konu', seviye: 'Seviye', dil: 'Dil' };
export const SORT_KEYS: SortKey[] = ['konu', 'seviye', 'dil'];

/** Konu seçiliyse grubu konudan türet; tutarsız grup/konu çiftini düzelt. */
export function normalizeFilters(f: VideoFilters): VideoFilters {
  if (f.topic !== 'all') return { ...f, group: GROUP_OF_TOPIC[f.topic] };
  return f;
}

export function parseFilters(search: string | URLSearchParams): VideoFilters {
  const sp = typeof search === 'string' ? new URLSearchParams(search) : search;
  const f: VideoFilters = { ...DEFAULT_FILTERS };
  f.q = (sp.get('q') ?? '').slice(0, 80);
  const g = sp.get('grup');
  if (isVideoGroup(g)) f.group = g;
  const t = sp.get('konu');
  if (isVideoTopic(t)) f.topic = t;
  const d = sp.get('dil');
  if (d === 'tr' || d === 'en') f.lang = d;
  const lv = Number(sp.get('seviye'));
  if (Number.isInteger(lv) && lv >= 1 && lv <= 5) f.level = lv;
  const p = sp.get('pozisyon');
  if (p && POSITIONS.some((x) => x.id === p)) f.pos = p as PositionId;
  const s = sp.get('sirala');
  if (s === 'seviye' || s === 'dil') f.sort = s;
  f.mine = sp.get('uygun') === '1';
  return normalizeFilters(f);
}

/** Süzgeçleri adres sorgusuna çevirir ('?a=b' ya da boş metin). Varsayılanlar yazılmaz. */
export function filtersToSearch(f: VideoFilters): string {
  const sp = new URLSearchParams();
  if (f.q.trim()) sp.set('q', f.q.trim());
  if (f.topic === 'all' && f.group !== 'all') sp.set('grup', f.group);
  if (f.topic !== 'all') sp.set('konu', f.topic);
  if (f.lang !== 'all') sp.set('dil', f.lang);
  if (f.level !== 'all') sp.set('seviye', String(f.level));
  if (f.pos !== 'all') sp.set('pozisyon', f.pos);
  if (f.sort !== 'konu') sp.set('sirala', f.sort);
  if (f.mine) sp.set('uygun', '1');
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export interface IndexedVideo {
  v: Video;
  hay: string;
}

export function indexVideos(videos: Video[]): IndexedVideo[] {
  return videos.map((v) => ({
    v,
    hay: norm(`${v.title} ${v.author} ${v.summary} ${VIDEO_TOPIC_NAME[v.topic]} ${VIDEO_GROUP_BY_ID[GROUP_OF_TOPIC[v.topic]].name} ${v.related.map((r) => r.name).join(' ')} ${v.lang === 'tr' ? 'türkçe' : 'ingilizce'}`),
  }));
}

export interface Personal {
  level: number;
  positions: PositionId[];
}

export type FilterKey = 'q' | 'group' | 'topic' | 'lang' | 'level' | 'pos' | 'mine';

function matchText(hay: string, q: string): boolean {
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hw = hay.split(' ');
  return words.every((w) => hay.includes(w) || hw.some((h) => h.startsWith(w.slice(0, Math.max(3, w.length - 2)))));
}

/** `skip` verilen süzgeçler yok sayılır (sayaçlar ve "gevşetme önerisi" için). */
export function matchVideo(iv: IndexedVideo, f: VideoFilters, me: Personal, skip: FilterKey[] = []): boolean {
  const v = iv.v;
  const use = (k: FilterKey) => !skip.includes(k);
  if (use('group') && f.group !== 'all' && GROUP_OF_TOPIC[v.topic] !== f.group) return false;
  if (use('topic') && f.topic !== 'all' && v.topic !== f.topic) return false;
  // pozisyon belirtilmemiş video herkes içindir
  if (use('pos') && f.pos !== 'all' && v.pos.length && !v.pos.includes(f.pos)) return false;
  if (use('level') && f.level !== 'all' && !(v.lv[0] <= f.level && f.level <= v.lv[1])) return false;
  if (use('lang') && f.lang !== 'all' && v.lang !== f.lang) return false;
  if (use('mine') && f.mine) {
    if (me.level < v.lv[0] - 1 || me.level > v.lv[1] + 1) return false;
    if (me.positions.length && v.pos.length && !v.pos.some((p) => me.positions.includes(p))) return false;
  }
  if (use('q') && !matchText(iv.hay, f.q)) return false;
  return true;
}

export function filterVideos(index: IndexedVideo[], f: VideoFilters, me: Personal, skip: FilterKey[] = []): Video[] {
  return index.filter((iv) => matchVideo(iv, f, me, skip)).map((iv) => iv.v);
}

const TOPIC_RANK = Object.fromEntries(VIDEO_TOPIC_ORDER.map((t, i) => [t, i])) as Record<VideoTopic, number>;
const byTitle = (a: Video, b: Video) => a.title.localeCompare(b.title, 'tr');

export function sortVideos(list: Video[], sort: SortKey): Video[] {
  const out = [...list];
  const cmp: Record<SortKey, (a: Video, b: Video) => number> = {
    konu: (a, b) => TOPIC_RANK[a.topic] - TOPIC_RANK[b.topic] || a.lv[0] - b.lv[0] || a.lv[1] - b.lv[1] || byTitle(a, b),
    seviye: (a, b) => a.lv[0] - b.lv[0] || a.lv[1] - b.lv[1] || TOPIC_RANK[a.topic] - TOPIC_RANK[b.topic] || byTitle(a, b),
    dil: (a, b) => (a.lang === b.lang ? 0 : a.lang === 'tr' ? -1 : 1) || TOPIC_RANK[a.topic] - TOPIC_RANK[b.topic] || a.lv[0] - b.lv[0] || byTitle(a, b),
  };
  return out.sort(cmp[sort]);
}

/** Konu çiplerindeki sayılar: konu ve grup dışındaki tüm süzgeçlere göre */
export function topicCounts(index: IndexedVideo[], f: VideoFilters, me: Personal): Record<VideoTopic, number> {
  const counts = Object.fromEntries(VIDEO_TOPIC_ORDER.map((t) => [t, 0])) as Record<VideoTopic, number>;
  for (const iv of index) if (matchVideo(iv, f, me, ['topic', 'group'])) counts[iv.v.topic]++;
  return counts;
}

/** Grup sekmelerindeki sayılar ('all' dahil): konu ve grup dışındaki süzgeçlere göre */
export function groupCounts(index: IndexedVideo[], f: VideoFilters, me: Personal): Record<VideoGroupId | 'all', number> {
  const c: Record<VideoGroupId | 'all', number> = { all: 0, teknik: 0, oyun: 0, kaleci: 0, fiziksel: 0 };
  for (const iv of index) {
    if (!matchVideo(iv, f, me, ['topic', 'group'])) continue;
    c.all++;
    c[GROUP_OF_TOPIC[iv.v.topic]]++;
  }
  return c;
}

export interface ActiveFilter {
  key: FilterKey;
  label: string;
}

export function activeFilters(f: VideoFilters): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (f.q.trim()) out.push({ key: 'q', label: `Arama: “${f.q.trim()}”` });
  if (f.topic !== 'all') out.push({ key: 'topic', label: `Konu: ${VIDEO_TOPIC_NAME[f.topic]}` });
  else if (f.group !== 'all') out.push({ key: 'group', label: `Kategori: ${VIDEO_GROUP_BY_ID[f.group].name}` });
  if (f.lang !== 'all') out.push({ key: 'lang', label: `Dil: ${f.lang === 'tr' ? 'Türkçe' : 'İngilizce'}` });
  if (f.level !== 'all') out.push({ key: 'level', label: `Seviye: ${'★'.repeat(f.level)} ${LEVEL_NAMES[f.level as Level]}` });
  if (f.pos !== 'all') out.push({ key: 'pos', label: `Pozisyon: ${POSITIONS.find((p) => p.id === f.pos)?.name ?? f.pos}` });
  if (f.mine) out.push({ key: 'mine', label: 'Bana uygun olanlar' });
  return out;
}

/** Süzgeç kaldırıldığında bir sonuç doğuran seçenekler (en çok sonuç verenden başlayarak) */
export function relaxSuggestions(index: IndexedVideo[], f: VideoFilters, me: Personal): (ActiveFilter & { count: number })[] {
  return activeFilters(f)
    .map((a) => ({ ...a, count: filterVideos(index, f, me, a.key === 'topic' ? ['topic', 'group'] : [a.key]).length }))
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function clearFilter(f: VideoFilters, key: FilterKey): VideoFilters {
  const next = { ...f };
  if (key === 'q') next.q = '';
  if (key === 'group') next.group = 'all';
  if (key === 'topic') { next.topic = 'all'; next.group = 'all'; }
  if (key === 'lang') next.lang = 'all';
  if (key === 'level') next.level = 'all';
  if (key === 'pos') next.pos = 'all';
  if (key === 'mine') next.mine = false;
  return next;
}

export { VIDEO_GROUPS };
