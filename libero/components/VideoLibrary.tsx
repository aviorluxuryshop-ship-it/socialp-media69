'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Video } from '@/data/video-build';
import { VIDEO_GROUPS, VIDEO_GROUP_BY_ID, VIDEO_TOPIC_NAME, type VideoTopic } from '@/data/video-topics';
import {
  DEFAULT_FILTERS,
  SORT_KEYS,
  SORT_LABEL,
  activeFilters,
  clearFilter,
  filterVideos,
  filtersToSearch,
  groupCounts,
  indexVideos,
  normalizeFilters,
  parseFilters,
  relaxSuggestions,
  sortVideos,
  topicCounts,
  type FilterKey,
  type LangFilter,
  type Personal,
  type SortKey,
  type VideoFilters,
} from '@/lib/video-filter';
import { useStore, type AppState } from '@/lib/store';
import { setUi, useUiPrefs } from '@/lib/ui-prefs';
import { LEVEL_NAMES, POSITIONS, type Level, type PositionId } from '@/lib/types';
import { Icon } from './Icon';
import { VideoCard } from './VideoCard';

const selPos = (s: AppState) => s.profile.positions;
const selLevel = (s: AppState) => s.profile.level;

export const PAGE_SIZE = 18;

/** Adres çubuğundaki sorguyu okur (?konu=pas&dil=tr…). Kendi Suspense sınırı içinde: kitaplığın geri kalanı sunucuda çizilir. */
function UrlReader({ onSearch }: { onSearch: (s: string) => void }) {
  const sp = useSearchParams();
  const s = sp.toString();
  useEffect(() => { onSearch(s); }, [s, onSearch]);
  return null;
}

export function VideoLibrary({ videos }: { videos: Video[] }) {
  const myPos = useStore(selPos);
  const myLevel = useStore(selLevel);
  const ui = useUiPrefs();
  const me = useMemo<Personal>(() => ({ level: myLevel, positions: myPos }), [myLevel, myPos]);
  const index = useMemo(() => indexVideos(videos), [videos]);

  const [f, setF] = useState<VideoFilters>(DEFAULT_FILTERS);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const armed = useRef(false); // adres okunmadan adrese yazma

  const onSearch = useCallback((s: string) => {
    armed.current = true;
    const parsed = parseFilters(s);
    setF((cur) => (filtersToSearch(cur) === filtersToSearch(parsed) ? cur : parsed));
  }, []);

  const key = filtersToSearch(f);
  // süzgeç → adres (geçmişi şişirmeden)
  useEffect(() => {
    if (!armed.current) return;
    if (window.location.search === key) return;
    try {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${key}${window.location.hash}`);
    } catch {
      /* adres güncellenemedi: süzgeç yine çalışır */
    }
  }, [key]);
  // süzgeç değişince sayfalamayı başa al
  useEffect(() => { setLimit(PAGE_SIZE); }, [key, me.level, me.positions]);

  const set = (patch: Partial<VideoFilters>) => setF((cur) => normalizeFilters({ ...cur, ...patch }));
  const reset = () => setF({ ...DEFAULT_FILTERS });

  const shown = useMemo(() => sortVideos(filterVideos(index, f, me), f.sort), [index, f, me]);
  const gCounts = useMemo(() => groupCounts(index, f, me), [index, f, me]);
  const tCounts = useMemo(() => topicCounts(index, f, me), [index, f, me]);
  const active = useMemo(() => activeFilters(f), [f]);
  const hints = useMemo(() => (shown.length === 0 ? relaxSuggestions(index, f, me) : []), [shown.length, index, f, me]);

  const topicsShown: VideoTopic[] = f.group === 'all' ? VIDEO_GROUPS.flatMap((g) => g.topics) : VIDEO_GROUP_BY_ID[f.group].topics;
  const page = shown.slice(0, limit);
  const perTopic = useMemo(() => {
    const m = new Map<VideoTopic, number>();
    shown.forEach((v) => m.set(v.topic, (m.get(v.topic) ?? 0) + 1));
    return m;
  }, [shown]);
  const blurb = f.group === 'all' ? 'Tüm kategorilerdeki videolar; kategori ve konu seçerek daralt.' : VIDEO_GROUP_BY_ID[f.group].blurb;

  const clearOne = (k: FilterKey) => setF((cur) => clearFilter(cur, k));

  return (
    <div className="vl">
      <Suspense fallback={null}>
        <UrlReader onSearch={onSearch} />
      </Suspense>

      <div className="vl__bar">
        <div className="container">
          <div className="lib__search vl__search">
            <Icon name="search" />
            <input
              type="search"
              className="lib__input"
              placeholder="Video ara: trivela, birebir savunma, kaleci, taramak…"
              value={f.q}
              onChange={(e) => set({ q: e.target.value.slice(0, 80) })}
              aria-label="Videolarda ara"
              autoComplete="off"
              spellCheck={false}
            />
            {f.q && (
              <button type="button" className="icon-btn" onClick={() => set({ q: '' })} aria-label="Aramayı temizle"><Icon name="close" /></button>
            )}
          </div>

          <div className="vl__tabs" role="group" aria-label="Kategori">
            <button type="button" className="vl__tab" aria-pressed={f.group === 'all' && f.topic === 'all'} onClick={() => set({ group: 'all', topic: 'all' })}>
              Tümü <span className="count">{gCounts.all}</span>
            </button>
            {VIDEO_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className="vl__tab"
                aria-pressed={f.group === g.id}
                onClick={() => set({ group: g.id, topic: 'all' })}
              >
                {g.name} <span className="count">{gCounts[g.id]}</span>
              </button>
            ))}
          </div>

          <div className="vl__topics chips" role="group" aria-label="Konu">
            {topicsShown.map((t) => (
              <button
                key={t}
                type="button"
                className="chip"
                aria-pressed={f.topic === t}
                disabled={tCounts[t] === 0 && f.topic !== t}
                onClick={() => set(f.topic === t ? { topic: 'all' } : { topic: t })}
              >
                {VIDEO_TOPIC_NAME[t]} <span className="count">{tCounts[t]}</span>
              </button>
            ))}
          </div>

          <div className="vl__tools">
            <div className="seg" role="group" aria-label="Dil">
              {([['all', 'Tüm diller'], ['tr', 'Türkçe'], ['en', 'İngilizce']] as [LangFilter, string][]).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={f.lang === id} onClick={() => set({ lang: id })}>{label}</button>
              ))}
            </div>
            <div className="vl__selects">
              <select className="select" value={f.level} onChange={(e) => set({ level: e.target.value === 'all' ? 'all' : Number(e.target.value) })} aria-label="Seviye">
                <option value="all">Tüm seviyeler</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)} {LEVEL_NAMES[n as Level]}</option>)}
              </select>
              <select className="select" value={f.pos} onChange={(e) => set({ pos: e.target.value as PositionId | 'all' })} aria-label="Pozisyon">
                <option value="all">Tüm pozisyonlar</option>
                {POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="select" value={f.sort} onChange={(e) => set({ sort: e.target.value as SortKey })} aria-label="Sıralama">
                {SORT_KEYS.map((k) => <option key={k} value={k}>Sırala: {SORT_LABEL[k]}</option>)}
              </select>
            </div>
            <label className="check vl__mine">
              <input type="checkbox" checked={f.mine} onChange={(e) => set({ mine: e.target.checked })} />
              <span>Bana uygun olanlar <span className="muted">(seviyem {'★'.repeat(myLevel)}{myPos.length ? `, ${myPos.length} pozisyon` : ''})</span></span>
            </label>
          </div>
        </div>
      </div>

      <div className="container vl__main">
        <div className="vl__head">
          <div>
            <p className="mono vl__count" role="status" aria-live="polite">{shown.length} video</p>
            <p className="field__hint">{blurb}</p>
          </div>
          <label className="check vl__thumbs">
            <input type="checkbox" checked={ui.ytThumbs} onChange={(e) => setUi({ ytThumbs: e.target.checked })} />
            <span>
              Kapak görselleri YouTube’dan yüklensin
              <span className="field__hint">Kapalıyken YouTube’a görsel isteği gitmez; çizim kapaklar gösterilir. Bu tercih yedeğe girmez.</span>
            </span>
          </label>
        </div>

        {active.length > 0 && (
          <div className="vl__active" aria-label="Etkin süzgeçler">
            <ul className="chips">
              {active.map((a) => (
                <li key={a.key}>
                  <button type="button" className="chip chip--on vl__x" onClick={() => clearOne(a.key)} aria-label={`Süzgeci kaldır: ${a.label}`}>
                    {a.label} <Icon name="close" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--quiet btn--sm" onClick={reset}>Filtreleri temizle</button>
          </div>
        )}

        {shown.length === 0 ? (
          <div className="empty vl__empty">
            <p className="h3">Bu filtrelerle video bulunamadı.</p>
            <p>Kütüphane yalnızca doğrulanmış videoları içerir; her konu için video olmayabilir. Süzgeçlerden birini gevşetmeyi dene:</p>
            {hints.length > 0 && (
              <ul className="chips vl__hints">
                {hints.map((h) => (
                  <li key={h.key}>
                    <button type="button" className="chip" onClick={() => clearOne(h.key)}>Kaldır: {h.label} <span className="count">{h.count} video</span></button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="btn btn--ghost" onClick={reset}>Tüm süzgeçleri temizle</button>
          </div>
        ) : (
          <ul className="vlib__grid vl__grid">
            {page.map((v, i) => (
              <VideoItem key={v.id} v={v} divider={f.sort === 'konu' && (i === 0 || page[i - 1].topic !== v.topic) ? { name: VIDEO_TOPIC_NAME[v.topic], n: perTopic.get(v.topic) ?? 0 } : null} />
            ))}
          </ul>
        )}

        {shown.length > limit && (
          <p className="vl__more">
            <button type="button" className="btn btn--ghost" onClick={() => setLimit(limit + PAGE_SIZE)}>Daha fazla göster ({shown.length - limit} video daha)</button>
          </p>
        )}
      </div>
    </div>
  );
}

function VideoItem({ v, divider }: { v: Video; divider: { name: string; n: number } | null }) {
  return (
    <>
      {divider && (
        <li className="vl__divider">
          <h3 className="vl__divider-h">{divider.name}</h3>
          <span className="mono vl__divider-n">{divider.n} video</span>
        </li>
      )}
      <li><VideoCard video={v} /></li>
    </>
  );
}
