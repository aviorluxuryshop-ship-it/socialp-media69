'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Scene } from '@/lib/types';
import { ARROW_LABEL, timeline, usedKinds } from '@/lib/scene';
import { Icon } from '../Icon';
import { SceneCanvas } from './SceneCanvas';

export interface SceneViewProps {
  scene: Scene;
  title: string;
  autoplay?: boolean;
  /** kare başına bekleme (ms) */
  holdMs?: number;
  legend?: boolean;
  caption?: boolean;
  compact?: boolean;
  className?: string;
}

/** Adım adım oynatılan saha diyagramı: oynat/duraklat, ileri/geri, kare noktaları, açıklama. */
export function SceneView({ scene, title, autoplay = true, holdMs = 2700, legend = true, caption = true, compact = false, className = '' }: SceneViewProps) {
  const tl = useMemo(() => timeline(scene), [scene]);
  const n = tl.length;
  const [f, setF] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [instant, setInstant] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [userStopped, setUserStopped] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const h = () => setReduced(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => setVisible(es[0]?.isIntersecting ?? false), { threshold: 0.35 });
    io.observe(el);
    const ro = new ResizeObserver((es) => setNarrow((es[0]?.contentRect.width ?? 999) < 520));
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  // otomatik oynatma: görünürken ve kullanıcı durdurmadıysa
  useEffect(() => {
    if (!autoplay || reduced || userStopped || n < 2) {
      setPlaying(false);
      return;
    }
    setPlaying(visible);
  }, [autoplay, reduced, userStopped, visible, n]);

  useEffect(() => {
    if (!playing) return;
    const last = f >= n - 1;
    const t = setTimeout(
      () => {
        if (last) {
          setInstant(true);
          setF(0);
          requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
        } else {
          setF((x) => x + 1);
        }
      },
      last ? holdMs + 700 : f === 0 ? 1100 : holdMs,
    );
    return () => clearTimeout(t);
  }, [playing, f, n, holdMs]);

  const go = (i: number) => {
    setUserStopped(true);
    setPlaying(false);
    setF(Math.max(0, Math.min(n - 1, i)));
  };

  const kinds = useMemo(() => Array.from(usedKinds(tl)), [tl]);
  const cur = tl[Math.min(f, n - 1)];
  const vertical = scene.v === 'full' ? narrow : undefined;

  return (
    <figure className={`scene ${compact ? 'scene--compact' : ''} ${className}`} ref={wrap}>
      <div className="scene__stage">
        <SceneCanvas scene={scene} tl={tl} frame={f} instant={instant} vertical={vertical} label={`${title}. Adım ${f + 1}/${n}: ${cur.note}`} />
        {n > 1 && <span className="scene__step mono">{f + 1} / {n}</span>}
      </div>
      {caption && (
        <figcaption className="scene__cap" aria-live="polite">
          <span className="scene__capnum num">{String(f + 1).padStart(2, '0')}</span>
          <span>{cur.note}</span>
        </figcaption>
      )}
      {n > 1 && (
        <div className="scene__ctrl">
          <div className="scene__btns">
            <button type="button" className="icon-btn" onClick={() => go(f - 1)} disabled={f === 0} aria-label="Önceki adım">
              <Icon name="step-back" />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--active"
              onClick={() => {
                if (playing) {
                  setUserStopped(true);
                  setPlaying(false);
                } else {
                  setUserStopped(false);
                  if (f >= n - 1) setF(0);
                  setPlaying(true);
                }
              }}
              aria-label={playing ? 'Duraklat' : 'Oynat'}
            >
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
            <button type="button" className="icon-btn" onClick={() => go(f + 1)} disabled={f === n - 1} aria-label="Sonraki adım">
              <Icon name="step-fwd" />
            </button>
          </div>
          <ol className="scene__dots" aria-label="Adımlar">
            {tl.map((_, i) => (
              <li key={i}>
                <button type="button" onClick={() => go(i)} aria-label={`Adım ${i + 1}`} aria-current={i === f ? 'step' : undefined} data-on={i <= f || undefined} />
              </li>
            ))}
          </ol>
        </div>
      )}
      {legend && kinds.length > 0 && (
        <ul className="scene__legend" aria-label="Çizgi göstergesi">
          {kinds.map((k) => (
            <li key={k}>
              <i className={`lg lg--${k}`} aria-hidden="true" />
              {ARROW_LABEL[k]}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
