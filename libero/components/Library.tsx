'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES } from '@/data/categories';
import type { LightTech } from '@/data';
import { buildIndex, search } from '@/lib/search';
import { setProfile, useStore } from '@/lib/store';
import { LEVEL_NAMES, POSITIONS, type CategoryId, type Level, type PositionId } from '@/lib/types';
import { CatGlyph } from './CatGlyph';
import { Icon } from './Icon';
import { StarRating } from './StarRating';

type Sort = 'onerilen' | 'ad' | 'kolay' | 'zor';

const selProfileLevel = (s: { profile: { level: Level } }) => s.profile.level;
const selLevels = (s: { levels: Record<string, { level: Level }> }) => s.levels;
const selPracticed = (s: { practiced: Record<string, { count: number }> }) => s.practiced;

export function Library({ items, initialCat }: { items: LightTech[]; initialCat?: CategoryId }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | ''>(initialCat ?? '');
  const [pos, setPos] = useState<PositionId | ''>('');
  const [fit, setFit] = useState(false);
  const [sort, setSort] = useState<Sort>('onerilen');
  const level = useStore(selProfileLevel);
  const mine = useStore(selLevels);
  const practiced = useStore(selPracticed);

  // URL ile eşitle (ilk yükleme)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get('kategori');
    if (c && CATEGORIES.some((x) => x.id === c)) setCat(c as CategoryId);
    const p = sp.get('pozisyon');
    if (p && POSITIONS.some((x) => x.id === p)) setPos(p as PositionId);
    const qq = sp.get('q');
    if (qq) setQ(qq);
    if (sp.get('seviye') === '1') setFit(true);
  }, []);
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (cat) sp.set('kategori', cat);
    if (pos) sp.set('pozisyon', pos);
    if (fit) sp.set('seviye', '1');
    const qs = sp.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [q, cat, pos, fit]);

  const index = useMemo(
    () =>
      buildIndex(
        items.map((t) => ({
          k: 'teknik' as const,
          t: t.name,
          d: t.sum,
          u: t.id,
          x: `${t.contact} ${t.sub} ${t.purpose} ${t.en ?? ''}`,
          a: t.alias,
          c: CATEGORIES.find((c) => c.id === t.cat)?.name,
        })),
      ),
    [items],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of items) m[t.cat] = (m[t.cat] ?? 0) + 1;
    return m;
  }, [items]);

  const list = useMemo(() => {
    let base = items;
    if (q.trim()) {
      const hit = search(index, q, 200);
      const rank = new Map(hit.map((h, i) => [h.u, i]));
      base = items.filter((t) => rank.has(t.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    }
    base = base.filter(
      (t) =>
        (!cat || t.cat === cat) &&
        (!pos || t.pos.includes(pos)) &&
        (!fit || Math.abs(t.lv - level) <= 1),
    );
    if (!q.trim()) {
      const arr = [...base];
      if (sort === 'ad') arr.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      else if (sort === 'kolay') arr.sort((a, b) => a.lv - b.lv || a.name.localeCompare(b.name, 'tr'));
      else if (sort === 'zor') arr.sort((a, b) => b.lv - a.lv || a.name.localeCompare(b.name, 'tr'));
      else
        arr.sort(
          (a, b) =>
            Math.abs(a.lv - level) - Math.abs(b.lv - level) ||
            CATEGORIES.findIndex((c) => c.id === a.cat) - CATEGORIES.findIndex((c) => c.id === b.cat) ||
            a.name.localeCompare(b.name, 'tr'),
        );
      return arr;
    }
    return base;
  }, [items, index, q, cat, pos, fit, sort, level]);

  const filtered = !!(q || cat || pos || fit);
  const reset = () => {
    setQ('');
    setCat('');
    setPos('');
    setFit(false);
  };

  return (
    <div className="lib">
      <div className="lib__bar">
        <div className="container">
          <div className="lib__search">
            <Icon name="search" />
            <input
              type="search"
              className="lib__input"
              placeholder="Teknik ara: ara pas, trivela, ilk temas, kafa, penaltı…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Teknik ara"
              autoComplete="off"
              spellCheck={false}
            />
            {q && (
              <button type="button" className="icon-btn" onClick={() => setQ('')} aria-label="Aramayı temizle">
                <Icon name="close" />
              </button>
            )}
          </div>

          <div className="lib__row">
            <div className="chips" role="group" aria-label="Kategori">
              <button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat('')}>
                Tümü <span className="count">{items.length}</span>
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? '' : c.id)}>
                  {c.short} <span className="count">{counts[c.id] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lib__row lib__row--tools">
            <div className="lib__level">
              <span className="mono muted">Genel seviyem</span>
              <StarRating value={level} onChange={(v) => setProfile({ level: v })} size="sm" label="Genel yetenek seviyeniz" />
            </div>
            <label className="check lib__fit">
              <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} />
              <span>Seviyeme uygun olanlar</span>
            </label>
            <div className="lib__selects">
              <select className="select" value={pos} onChange={(e) => setPos(e.target.value as PositionId | '')} aria-label="Pozisyon">
                <option value="">Tüm pozisyonlar</option>
                {POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sırala" disabled={!!q.trim()}>
                <option value="onerilen">Sıra: seviyeme göre</option>
                <option value="ad">Sıra: A–Z</option>
                <option value="kolay">Sıra: kolaydan zora</option>
                <option value="zor">Sıra: zordan kolaya</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container lib__results">
        <div className="lib__meta" aria-live="polite">
          <span className="mono">
            {list.length} / {items.length} teknik
          </span>
          {filtered && (
            <button type="button" className="btn btn--quiet" onClick={reset}>
              Filtreleri temizle
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="empty">
            <h3 className="h3">Sonuç bulunamadı</h3>
            <p>Daha kısa bir kelime deneyin ya da filtreleri temizleyin. Örneğin “pas”, “şut”, “kontrol”, “savunma”.</p>
            <p style={{ marginTop: 16 }}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
                Filtreleri temizle
              </button>
            </p>
          </div>
        ) : (
          <ul className="tech-grid">
            {list.map((t) => {
              const my = mine[t.id]?.level;
              const done = practiced[t.id]?.count;
              return (
                <li key={t.id}>
                  <Link href={`/teknikler/${t.id}/`} className="card tech-card">
                    <div className="tech-card__top">
                      <span className="tech-card__glyph">
                        <CatGlyph id={t.cat} size={38} />
                      </span>
                      <span className="tag">{CATEGORIES.find((c) => c.id === t.cat)?.short}</span>
                    </div>
                    <h3 className="tech-card__name">{t.name}</h3>
                    <p className="tech-card__sum">{t.sum}</p>
                    <div className="tech-card__foot">
                      <span className="tech-card__lv" title={`Tekniğin zorluğu: ${LEVEL_NAMES[t.lv as Level]}`}>
                        <StarRating value={t.lv} readOnly size="sm" showName={false} label="Zorluk" />
                      </span>
                      <span className="tech-card__me mono">
                        {my ? `Sen ${'★'.repeat(my)}` : done ? `${done}× çalıştın` : t.contact.split(/[,(]/)[0]}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
