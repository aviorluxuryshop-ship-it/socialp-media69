'use client';

import { useEffect, useRef } from 'react';
import { chooseBallMode, hasWebGL, readDevice } from '@/lib/motion';
import { BallSvg } from './BallSvg';

/**
 * Hero topu. Sunucuda hafif SVG top çizilir (yer ayrılmış, JS'siz çalışır). İstemcide:
 *  1) cihaz planı: WebGL var mı, düşük güç mü, hareket azaltma mı → 'webgl' | 'svg'
 *  2) 'webgl' ise three.js sahnesi YALNIZCA boşta ve görünürken, dinamik içe aktarmayla yüklenir
 *  3) hazır olunca SVG'den tuvale yumuşak geçiş; hata/bağlam kaybında SVG'de kalınır
 * Durum, React durumu yerine data-öznitelikleriyle (data-mode, data-state) bildirilir.
 */
export function HeroBall({ className = '' }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const plan = chooseBallMode(readDevice(hasWebGL()));
    root.dataset.motion = plan.animate ? 'on' : 'off';
    root.dataset.reason = plan.reason;
    if (plan.mode === 'svg') {
      root.dataset.mode = 'svg';
      root.dataset.state = 'ready';
      return;
    }
    root.dataset.mode = 'webgl';
    root.dataset.state = 'pending';

    let cancelled = false;
    let handle: { dispose(): void } | null = null;
    let started = false;
    let visible = false;
    let idle = false;
    let idleId: number | ReturnType<typeof setTimeout> = 0;

    const start = () => {
      if (started || cancelled || !visible || !idle) return;
      started = true;
      root.dataset.state = 'loading';
      import('@/lib/motion-ball-scene')
        .then((m) =>
          m.mountBall(stage, plan, (s) => {
            if (cancelled) return;
            if (s === 'ready') {
              root.dataset.state = 'ready';
            } else {
              root.dataset.mode = 'svg';
              root.dataset.state = 'ready';
            }
          }),
        )
        .then((h) => {
          if (cancelled) h?.dispose();
          else handle = h;
        })
        .catch(() => {
          if (cancelled) return;
          root.dataset.mode = 'svg';
          root.dataset.state = 'ready';
        });
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(
        () => {
          idle = true;
          start();
        },
        { timeout: 1800 },
      );
    } else {
      idleId = setTimeout(() => {
        idle = true;
        start();
      }, 600);
    }
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      start();
    });
    io.observe(root);

    return () => {
      cancelled = true;
      io.disconnect();
      if (w.requestIdleCallback && w.cancelIdleCallback) w.cancelIdleCallback(idleId as number);
      else clearTimeout(idleId as ReturnType<typeof setTimeout>);
      handle?.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className={`hero-ball ${className}`.trim()} data-mode="svg" data-state="pending" data-motion="on">
      <div className="hero-ball__glow" aria-hidden="true" />
      <div className="hero-ball__float">
        <div ref={stageRef} className="hero-ball__stage">
          <BallSvg className="hero-ball__svg" />
        </div>
      </div>
      <div className="hero-ball__shadow" aria-hidden="true" />
    </div>
  );
}
