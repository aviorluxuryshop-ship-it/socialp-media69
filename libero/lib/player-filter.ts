import { PLAYER_KIND_NAME, PLAYER_KIND_ORDER, type PlayerKind } from '@/data/player-types';
import { POSITIONS, type PositionId } from './types';
import { norm } from './utils';

/** Oyuncu dizini süzgeçleri — saf mantık (mantık testlerinde sınanır). Adres: ?poz= &tur= &q= */

export interface PlayerLite {
  id: string;
  name: string;
  pos: PositionId;
  role: string;
  tagline: string;
  kind: PlayerKind;
  /** en kapsamlı analiz */
  deep: boolean;
  sources: number;
  videos: number;
  sections: number;
}

export interface PlayerFilters {
  q: string;
  pos: PositionId | 'all';
  kind: PlayerKind | 'all';
}

export const DEFAULT_PLAYER_FILTERS: PlayerFilters = { q: '', pos: 'all', kind: 'all' };

const POS_NAME = Object.fromEntries(POSITIONS.map((p) => [p.id, p.name])) as Record<string, string>;

export function parsePlayerFilters(search: string | URLSearchParams): PlayerFilters {
  const sp = typeof search === 'string' ? new URLSearchParams(search) : search;
  const f: PlayerFilters = { ...DEFAULT_PLAYER_FILTERS };
  f.q = (sp.get('q') ?? '').slice(0, 60);
  const p = sp.get('poz');
  if (p && POSITIONS.some((x) => x.id === p)) f.pos = p as PositionId;
  const k = sp.get('tur');
  if (k && PLAYER_KIND_ORDER.includes(k as PlayerKind)) f.kind = k as PlayerKind;
  return f;
}

export function playerFiltersToSearch(f: PlayerFilters): string {
  const sp = new URLSearchParams();
  if (f.q.trim()) sp.set('q', f.q.trim());
  if (f.pos !== 'all') sp.set('poz', f.pos);
  if (f.kind !== 'all') sp.set('tur', f.kind);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function haystack(p: PlayerLite): string {
  return norm(`${p.name} ${p.role} ${p.tagline} ${POS_NAME[p.pos] ?? ''} ${PLAYER_KIND_NAME[p.kind]}`);
}

export type PlayerFilterKey = 'q' | 'pos' | 'kind';

export function matchPlayer(p: PlayerLite, f: PlayerFilters, skip: PlayerFilterKey[] = []): boolean {
  if (!skip.includes('pos') && f.pos !== 'all' && p.pos !== f.pos) return false;
  if (!skip.includes('kind') && f.kind !== 'all' && p.kind !== f.kind) return false;
  if (!skip.includes('q')) {
    const words = norm(f.q).split(' ').filter(Boolean);
    if (words.length) {
      const hay = haystack(p);
      if (!words.every((w) => hay.includes(w))) return false;
    }
  }
  return true;
}

export function filterPlayers(list: PlayerLite[], f: PlayerFilters): PlayerLite[] {
  return list.filter((p) => matchPlayer(p, f));
}

/** En kapsamlı analiz önce, sonrası verilen sırayla (kararlı) */
export function orderPlayers(list: PlayerLite[]): PlayerLite[] {
  return [...list.keys()].sort((a, b) => Number(list[b].deep) - Number(list[a].deep) || a - b).map((i) => list[i]);
}

/** Çip sayaçları: kendi süzgeci hariç diğer süzgeçlere göre */
export function posCounts(list: PlayerLite[], f: PlayerFilters): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of list) if (matchPlayer(p, f, ['pos'])) out[p.pos] = (out[p.pos] ?? 0) + 1;
  return out;
}

export function kindCounts(list: PlayerLite[], f: PlayerFilters): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of list) if (matchPlayer(p, f, ['kind'])) out[p.kind] = (out[p.kind] ?? 0) + 1;
  return out;
}

/** "Lionel Messi" → "LM" ; tek adlı oyuncuda ilk iki harf */
export function initialsOf(name: string): string {
  const parts = name.replace(/[’']/g, '').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr');
}

/** Kartta büyük yazılan soyad (tek adlıysa ad) */
export function surnameOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts[parts.length - 1];
}
