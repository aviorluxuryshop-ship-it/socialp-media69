'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PLAYER_KIND_NAME, PLAYER_KIND_ORDER } from '@/data/player-types';
import {
  DEFAULT_PLAYER_FILTERS,
  filterPlayers,
  initialsOf,
  kindCounts,
  orderPlayers,
  parsePlayerFilters,
  playerFiltersToSearch,
  posCounts,
  surnameOf,
  type PlayerFilters,
  type PlayerLite,
} from '@/lib/player-filter';
import { POSITIONS } from '@/lib/types';
import { Icon } from './Icon';

const POS_NAME = Object.fromEntries(POSITIONS.map((p) => [p.id, p.name])) as Record<string, string>;

/** Oyuncu dizini: arama, konum ve tür süzgeçleri; tipografik kartlar (fotoğraf yok); en kapsamlı analiz öne çıkarılır. */
export function PlayerIndex({ players }: { players: PlayerLite[] }) {
  const [f, setF] = useState<PlayerFilters>(DEFAULT_PLAYER_FILTERS);
  const armed = useRef(false);

  useEffect(() => {
    const read = () => setF(parsePlayerFilters(window.location.search));
    read();
    armed.current = true;
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const key = playerFiltersToSearch(f);
  useEffect(() => {
    if (!armed.current || window.location.search === key) return;
    try {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${key}${window.location.hash}`);
    } catch {
      /* adres güncellenemedi: süzgeç yine çalışır */
    }
  }, [key]);

  const ordered = useMemo(() => orderPlayers(players), [players]);
  const shown = useMemo(() => filterPlayers(ordered, f), [ordered, f]);
  const pc = useMemo(() => posCounts(ordered, f), [ordered, f]);
  const kc = useMemo(() => kindCounts(ordered, f), [ordered, f]);
  const set = (patch: Partial<PlayerFilters>) => setF((cur) => ({ ...cur, ...patch }));
  const reset = () => setF({ ...DEFAULT_PLAYER_FILTERS });
  const anyFilter = f.q.trim() !== '' || f.pos !== 'all' || f.kind !== 'all';
  const presentPos = POSITIONS.filter((p) => players.some((x) => x.pos === p.id));

  return (
    <div className="pidx">
      <div className="pidx__bar">
        <div className="lib__search pidx__search">
          <Icon name="search" />
          <input
            type="search"
            className="lib__input"
            placeholder="Oyuncu ara: Messi, pivot, kaleci, duran top…"
            value={f.q}
            onChange={(e) => set({ q: e.target.value.slice(0, 60) })}
            aria-label="Oyuncularda ara"
            autoComplete="off"
            spellCheck={false}
          />
          {f.q && (
            <button type="button" className="icon-btn" onClick={() => set({ q: '' })} aria-label="Aramayı temizle"><Icon name="close" /></button>
          )}
        </div>
        <div className="chips" role="group" aria-label="Pozisyona göre süz">
          <button type="button" className="chip" aria-pressed={f.pos === 'all'} onClick={() => set({ pos: 'all' })}>
            Tüm pozisyonlar <span className="count">{Object.values(pc).reduce((a, b) => a + b, 0)}</span>
          </button>
          {presentPos.map((p) => (
            <button key={p.id} type="button" className="chip" aria-pressed={f.pos === p.id} disabled={!pc[p.id] && f.pos !== p.id} onClick={() => set({ pos: f.pos === p.id ? 'all' : p.id })}>
              {p.name} <span className="count">{pc[p.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Role göre süz">
          <button type="button" className="chip" aria-pressed={f.kind === 'all'} onClick={() => set({ kind: 'all' })}>
            Tüm roller <span className="count">{Object.values(kc).reduce((a, b) => a + b, 0)}</span>
          </button>
          {PLAYER_KIND_ORDER.map((k) => (
            <button key={k} type="button" className="chip" aria-pressed={f.kind === k} disabled={!kc[k] && f.kind !== k} onClick={() => set({ kind: f.kind === k ? 'all' : k })}>
              {PLAYER_KIND_NAME[k]} <span className="count">{kc[k] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="pidx__status">
          <p className="mono pidx__count" role="status" aria-live="polite">{shown.length} oyuncu</p>
          {anyFilter && <button type="button" className="btn btn--quiet btn--sm" onClick={reset}>Filtreleri temizle</button>}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <p className="h3">Bu filtrelerle oyuncu bulunamadı.</p>
          <p>Arama sözcüğünü değiştir ya da pozisyon/rol süzgecini kaldır.</p>
          <button type="button" className="btn btn--ghost" onClick={reset}>Tüm oyuncuları göster</button>
        </div>
      ) : (
        <ul className="pidx__grid">
          {shown.map((p) => (
            <li key={p.id} className={p.deep ? 'pidx__feat' : undefined}>
              <Link href={`/analiz/oyuncular/${p.id}/`} className={`card pcard ${p.deep ? 'pcard--feat card--edge-accent' : ''}`} aria-label={`${p.name} oyun analizi${p.deep ? ' (en kapsamlı analiz)' : ''}`}>
                <span className="pcard__mono" aria-hidden="true">{initialsOf(p.name)}</span>
                <span className="pcard__top">
                  <span className="mono pcard__pos">{POS_NAME[p.pos]}</span>
                  {p.deep && <span className="tag tag--accent">En kapsamlı analiz</span>}
                </span>
                <span className="pcard__name">
                  <span className="pcard__first">{p.name.slice(0, p.name.length - surnameOf(p.name).length).trim()}</span>
                  <span className="pcard__last">{surnameOf(p.name)}</span>
                </span>
                <span className="pcard__role">{p.role}</span>
                <span className="pcard__tag">{p.tagline}</span>
                <span className="pcard__foot mono">
                  <span>{PLAYER_KIND_NAME[p.kind]}</span>
                  <span>{p.videos} video · {p.sources} kaynak</span>
                  <span className="pcard__go">Analizi aç <Icon name="arrow" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
