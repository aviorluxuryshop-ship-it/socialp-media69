'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Video, VideoTopic } from '@/data/videos';
import { VIDEO_TOPIC_NAME } from '@/data/videos';
import { useStore, type AppState } from '@/lib/store';
import { POSITIONS, type PositionId } from '@/lib/types';
import { norm } from '@/lib/utils';
import { Icon } from './Icon';
import { VideoCard } from './VideoCard';

const selPos = (s: AppState) => s.profile.positions;
const selLevel = (s: AppState) => s.profile.level;

type Lang = 'all' | 'tr' | 'en';

export function VideoLibrary({ videos }: { videos: Video[] }) {
  const myPos = useStore(selPos);
  const myLevel = useStore(selLevel);
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<VideoTopic | 'all'>('all');
  const [pos, setPos] = useState<PositionId | 'all'>('all');
  const [lv, setLv] = useState<number | 'all'>('all');
  const [lang, setLang] = useState<Lang>('all');
  const [mine, setMine] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const qq = sp.get('q');
    if (qq) setQ(qq);
    const tp = sp.get('konu') as VideoTopic | null;
    if (tp && tp in VIDEO_TOPIC_NAME) setTopic(tp);
    const ps = sp.get('pozisyon') as PositionId | null;
    if (ps && POSITIONS.some((p) => p.id === ps)) setPos(ps);
  }, []);

  const topics = useMemo(() => {
    const m = new Map<VideoTopic, number>();
    videos.forEach((v) => m.set(v.topic, (m.get(v.topic) ?? 0) + 1));
    return (Object.keys(VIDEO_TOPIC_NAME) as VideoTopic[]).filter((t) => m.has(t)).map((t) => ({ id: t, n: m.get(t) as number }));
  }, [videos]);

  const index = useMemo(() => videos.map((v) => ({ v, hay: norm(`${v.title} ${v.author} ${v.summary} ${VIDEO_TOPIC_NAME[v.topic]}`) })), [videos]);

  const shown = useMemo(() => {
    const words = norm(q).split(' ').filter(Boolean);
    return index
      .filter(({ v, hay }) => {
        if (topic !== 'all' && v.topic !== topic) return false;
        // pozisyon belirtilmemiş video herkes içindir
        if (pos !== 'all' && v.pos.length && !v.pos.includes(pos)) return false;
        if (lv !== 'all' && !(v.lv[0] <= lv && lv <= v.lv[1])) return false;
        if (lang !== 'all' && v.lang !== lang) return false;
        if (mine) {
          if (myLevel < v.lv[0] - 1 || myLevel > v.lv[1] + 1) return false;
          if (myPos.length && v.pos.length && !v.pos.some((p) => myPos.includes(p))) return false;
        }
        const hw = hay.split(' ');
        return words.every((w) => hay.includes(w) || hw.some((h) => h.startsWith(w.slice(0, Math.max(3, w.length - 2)))));
      })
      .map(({ v }) => v);
  }, [index, q, topic, pos, lv, lang, mine, myLevel, myPos]);

  const reset = () => { setQ(''); setTopic('all'); setPos('all'); setLv('all'); setLang('all'); setMine(false); };
  const filtered = q || topic !== 'all' || pos !== 'all' || lv !== 'all' || lang !== 'all' || mine;

  return (
    <div className="lib">
      <div className="lib__bar">
        <div className="container">
          <div className="lib__search">
            <Icon name="search" />
            <input
              type="search"
              className="lib__input"
              placeholder="Video ara: trivela, birebir savunma, kaleci, taramak…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Videolarda ara"
              autoComplete="off"
              spellCheck={false}
            />
            {q && (
              <button type="button" className="icon-btn" onClick={() => setQ('')} aria-label="Aramayı temizle"><Icon name="close" /></button>
            )}
          </div>
          <div className="lib__row">
            <div className="chips" role="group" aria-label="Konu">
              <button type="button" className="chip" aria-pressed={topic === 'all'} onClick={() => setTopic('all')}>Tümü <span className="count">{videos.length}</span></button>
              {topics.map((t) => (
                <button key={t.id} type="button" className="chip" aria-pressed={topic === t.id} onClick={() => setTopic(topic === t.id ? 'all' : t.id)}>{VIDEO_TOPIC_NAME[t.id]} <span className="count">{t.n}</span></button>
              ))}
            </div>
          </div>
          <div className="lib__row lib__row--tools">
            <label className="check lib__fit">
              <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
              <span>Bana uygun olanlar <span className="muted">(seviyem {'★'.repeat(myLevel)}{myPos.length ? `, ${myPos.length} pozisyon` : ''})</span></span>
            </label>
            <div className="seg" role="group" aria-label="Dil">
              <button type="button" aria-pressed={lang === 'all'} onClick={() => setLang('all')}>Tüm diller</button>
              <button type="button" aria-pressed={lang === 'tr'} onClick={() => setLang('tr')}>Türkçe</button>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>İngilizce</button>
            </div>
            <div className="lib__selects">
              <select className="select" value={pos} onChange={(e) => setPos(e.target.value as PositionId | 'all')} aria-label="Pozisyon">
                <option value="all">Tüm pozisyonlar</option>
                {POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="select" value={lv} onChange={(e) => setLv(e.target.value === 'all' ? 'all' : Number(e.target.value))} aria-label="Seviye">
                <option value="all">Tüm seviyeler</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)} {['Yeni başlayan', 'Temel', 'Orta', 'İleri', 'Usta'][n - 1]}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        <div className="vlib__count">
          <p className="mono muted" role="status" aria-live="polite">{shown.length} video</p>
          {filtered && <button type="button" className="btn btn--quiet btn--sm" onClick={reset}>Filtreleri temizle</button>}
        </div>
      {shown.length === 0 ? (
        <div className="empty" style={{ marginTop: 28 }}>
          <p className="h3">Bu filtrelerle video bulunamadı.</p>
          <p className="muted">Filtreleri gevşetmeyi dene ya da arama sözcüğünü değiştir. Kütüphane yalnızca doğrulanmış videoları içerir; her konu için video olmayabilir.</p>
          <button type="button" className="btn btn--ghost" onClick={reset}>Filtreleri temizle</button>
        </div>
      ) : (
        <ul className="vlib__grid">
          {shown.map((v) => <li key={v.id}><VideoCard video={v} /></li>)}
        </ul>
      )}
      </div>
    </div>
  );
}
