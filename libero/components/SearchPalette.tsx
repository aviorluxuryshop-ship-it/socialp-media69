'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildIndex, KIND_LABEL, search, type Indexed, type SearchDoc } from '@/lib/search';
import { Icon } from './Icon';

let cache: Indexed[] | null = null;
let loading: Promise<Indexed[]> | null = null;

function loadIndex(): Promise<Indexed[]> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch('/search-index.json')
      .then((r) => r.json())
      .then((docs: SearchDoc[]) => {
        cache = buildIndex(docs);
        return cache;
      })
      .catch(() => {
        loading = null;
        return [] as Indexed[];
      });
  }
  return loading;
}

const SUGGEST = ['ara pas', 'ilk temas', 'trivela', 'savunma arkasına koşu', 'pres', 'çeviklik', 'kaleci', 'antrenman öncesi'];

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<Indexed[]>(cache ?? []);
  const [cur, setCur] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setIndex);
    setQ('');
    setCur(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => search(index, q, 24), [index, q]);
  useEffect(() => setCur(0), [q]);

  if (!open) return null;

  const go = (u: string) => {
    onClose();
    router.push(u);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCur((c) => Math.min(c + 1, Math.max(0, results.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCur((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && results[cur]) {
      e.preventDefault();
      go(results[cur].u);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label="Site içi arama" onKeyDown={onKey}>
      <div className="palette__scrim" onClick={onClose} />
      <div className="palette__box">
        <div className="palette__input">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Teknik, egzersiz, taktik, yiyecek ara…  örn. “ara pas”, “trivela”, “çeviklik”"
            aria-label="Ara"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="close" />
          </button>
        </div>
        <div className="palette__body">
          {!q && (
            <div className="palette__suggest">
              <p className="mono muted">Önerilen aramalar</p>
              <div className="chips">
                {SUGGEST.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => setQ(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="muted" style={{ marginTop: 18, fontSize: '.85rem' }}>
                Türkçe karakter yazmak zorunda değilsiniz: “sut” yazınca “şut” da bulunur.
              </p>
            </div>
          )}
          {q && results.length === 0 && (
            <div className="palette__empty">
              <p>“{q}” için sonuç yok.</p>
              <p className="muted">Daha kısa bir kelime deneyin ya da kütüphanelere göz atın.</p>
              <div className="chips" style={{ marginTop: 14 }}>
                <Link className="chip" href="/teknikler/" onClick={onClose}>Teknik kütüphanesi</Link>
                <Link className="chip" href="/fiziksel/" onClick={onClose}>Fiziksel gelişim</Link>
                <Link className="chip" href="/videolar/" onClick={onClose}>Videolar</Link>
              </div>
            </div>
          )}
          {results.length > 0 && (
            <ul role="listbox" aria-label="Sonuçlar">
              {results.map((r, i) => (
                <li key={r.u + r.t} role="option" aria-selected={i === cur}>
                  <Link
                    href={r.u}
                    data-cur={i === cur || undefined}
                    onClick={onClose}
                    onMouseEnter={() => setCur(i)}
                  >
                    <span className="palette__kind">{KIND_LABEL[r.k]}</span>
                    <span className="palette__t">{r.t}</span>
                    <span className="palette__d">{r.d}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="palette__foot mono">
          <span>↑↓ gezin</span>
          <span>↵ aç</span>
          <span>Esc kapat</span>
        </div>
      </div>
    </div>
  );
}
