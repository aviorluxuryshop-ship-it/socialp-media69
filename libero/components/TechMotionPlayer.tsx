'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react';
import { ZONES } from '@/lib/boot';
import { PHASES, PHASE_LABEL, compileMotion, frameAt, hasPlan, type TechMotion } from '@/lib/motion/timeline';
import { advance, barModel, fmtSec, stripFrames, type Clock } from '@/lib/motion/player';
import { Icon } from './Icon';
import { Stage } from './tech-motion/Stage';

/**
 * "Hareketi izle": bir tekniğin kısa, şematik hareket gösterimi (yandan görünüm, sağ ayaklı oyuncu).
 * Saf SVG + React; kütüphane yok. Oynat/duraklat, başa sar, 0,5×/1×, kaydırma çubuğu (evre çubuğu + temas penceresi),
 * evre açıklaması ve temas anında yanan bölge. Yalnızca görünürken ve sekme açıkken oynar; rAF yalnızca oynarken çalışır.
 * Hareketi azalt tercihinde ya da JS yokken canlı oynatıcı yerine üç karelik sabit şerit gösterilir (CSS belirler).
 */

const SPEEDS = [0.5, 1] as const;
const FALLBACK_NAME = 'Hareket';

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  };
}
function useReducedMotion(): boolean {
  const q = '(prefers-reduced-motion: reduce)';
  return useSyncExternalStore(subscribeMedia(q), () => window.matchMedia(q).matches, () => false);
}
function useTabHidden(): boolean {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener('visibilitychange', cb);
      return () => document.removeEventListener('visibilitychange', cb);
    },
    () => document.visibilityState === 'hidden',
    () => false,
  );
}

const zoneName = (z: string) => (z === 'alin' ? 'Alın' : (ZONES as Record<string, { label: string }>)[z]?.label ?? z);

export function TechMotionPlayer({ motion: m, name = FALLBACK_NAME }: { motion: TechMotion; name?: string }) {
  const compiled = useMemo(() => compileMotion(m), [m]);
  const bar = useMemo(() => barModel(m), [m]);
  const strip = useMemo(() => stripFrames(m), [m]);

  // sunucuda ve ilk boyamada temas karesi (afiş) gösterilir; oynatma başlayınca 0'dan başlar
  const [t, setT] = useState(m.tc);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [userPaused, setUserPaused] = useState(false);
  const [userPlay, setUserPlay] = useState(false);
  const [inView, setInView] = useState(false); // sahne ≥ %30 görünür: kendiliğinden oynatma koşulu
  const [anyView, setAnyView] = useState(false); // oynatıcının herhangi bir parçası görünür: elle başlatılan oynatma sürer
  const reduced = useReducedMotion();
  const tabHidden = useTabHidden();
  const clock = useRef<Clock>({ t: m.tc, hold: 0 });
  const started = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // kendiliğinden oynama: sahne en az %30 görünürken. Elle "Oynat" denince, oynatıcının bir parçası (ör. denetimler) görünür olduğu sürece sürer.
  const playing = !reduced && !tabHidden && !userPaused && (inView || (userPlay && anyView));

  // görünürlük: ekran dışına çıkınca durur
  useEffect(() => {
    const stage = stageRef.current;
    const live = liveRef.current;
    if (!stage || !live) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      setAnyView(true);
      return;
    }
    const a = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    const b = new IntersectionObserver(([e]) => {
      setAnyView(e.isIntersecting);
      if (!e.isIntersecting) setUserPlay(false);
    });
    a.observe(stage);
    b.observe(live);
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, []);

  // requestAnimationFrame yalnızca oynarken çalışır
  useEffect(() => {
    const root = rootRef.current;
    if (!playing) {
      root?.setAttribute('data-raf', 'off');
      return;
    }
    if (!started.current) {
      started.current = true;
      clock.current = { t: 0, hold: 0 };
      setT(0);
    } else if (clock.current.t >= m.dur && clock.current.hold <= 0) {
      clock.current = { t: 0, hold: 0 };
    }
    root?.setAttribute('data-raf', 'on');
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      clock.current = advance(clock.current, dt, speed, m.dur);
      setT(clock.current.t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      root?.setAttribute('data-raf', 'off');
    };
  }, [playing, speed, m.dur]);

  const frame = frameAt(m, t, compiled);
  const phase = frame.phase;
  const pi = PHASES.indexOf(phase);
  const plan = hasPlan(m);
  const zones: string[] = m.zones === 'alin' ? ['alin'] : [...m.zones];

  const scrubTo = (v: number) => {
    const c = Math.min(m.dur, Math.max(0, v));
    clock.current = { t: c, hold: 0 };
    started.current = true;
    setT(c);
    setUserPaused(true);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const k = e.key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'ArrowDown' && k !== 'ArrowUp') return;
    e.preventDefault();
    const step = e.shiftKey ? 0.5 : 0.1;
    scrubTo(t + (k === 'ArrowLeft' || k === 'ArrowDown' ? -step : step));
  };
  const togglePlay = () => {
    if (playing) {
      setUserPaused(true);
    } else {
      setUserPaused(false);
      setUserPlay(true);
    }
  };
  const restart = () => {
    clock.current = { t: 0, hold: 0 };
    started.current = true;
    setT(0);
    setUserPaused(false);
    setUserPlay(true);
  };

  const label = `${name} hareket çizimi: sağ ayaklı oyuncu, sağdan görünüm. Şu anki evre: ${PHASE_LABEL[phase]}.`;
  const planLabel = `Üstten bakış: topun yolu${m.plan?.press ? ' ve baskı yapan rakibin yeri' : ''}. Yukarı oyuncunun önüdür.`;
  const hot = frame.glow > 0.15;

  return (
    <div className="tm" ref={rootRef} data-tm data-tm-id={m.id} data-t={t.toFixed(2)} data-phase={phase} data-playing={playing ? 'true' : 'false'} data-speed={String(speed)} data-glow={frame.glow.toFixed(2)}>
      <div className="tm__live" ref={liveRef} role="group" aria-label={`${name}: hareket gösterimi (şematik)`}>
        <div ref={stageRef}>
          <Stage m={m} frame={frame} label={label} planLabel={planLabel} />
        </div>

        <div className="tm__now">
          <span className="tm__pill mono" data-phase={phase} data-tm-phase>
            {PHASE_LABEL[phase]}
          </span>
          <p className="tm__cap" data-tm-caption>
            {m.caps[pi]}
          </p>
          {m.note && <p className="tm__note">{m.note}</p>}
        </div>

        <div className="tm__scrub" style={{ '--p': t / m.dur } as CSSProperties}>
          <div className="tm__track" aria-hidden="true">
            {bar.segs.map((s) => (
              <span key={s.id} className={`tm__seg tm__seg--${s.id}`} style={{ flex: `0 0 ${((s.to - s.from) * 100).toFixed(2)}%` }} data-seg={s.id} />
            ))}
            <span className="tm__fill" />
          </div>
          <input
            className="tm__range"
            type="range"
            min={0}
            max={m.dur}
            step={0.01}
            value={t}
            onChange={(e) => scrubTo(Number(e.target.value))}
            onKeyDown={onKey}
            aria-label="Hareket zamanı"
            aria-valuetext={`${fmtSec(t)} saniye, ${PHASE_LABEL[phase]} evresi`}
            data-tm-range
          />
          <div className="tm__names mono" aria-hidden="true">
            {bar.segs.map((s) => (
              <span key={s.id} style={{ flex: `0 0 ${((s.to - s.from) * 100).toFixed(2)}%` }} data-on={s.id === phase ? 'true' : 'false'}>
                {PHASE_LABEL[s.id]}
              </span>
            ))}
          </div>
        </div>

        <div className="tm__ctl">
          <button type="button" className="btn btn--primary btn--sm" onClick={togglePlay} data-tm-play>
            <Icon name={playing ? 'pause' : 'play'} />
            {playing ? 'Duraklat' : 'Oynat'}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={restart} data-tm-restart>
            <Icon name="rotate" />
            Başa sar
          </button>
          <div className="seg" role="group" aria-label="Oynatma hızı">
            {SPEEDS.map((s) => (
              <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)} data-tm-speed={s}>
                {s === 1 ? '1×' : '0,5×'}
              </button>
            ))}
          </div>
          <span className="tm__time mono" aria-hidden="true">
            {fmtSec(t)} / {fmtSec(m.dur)} sn
          </span>
        </div>

        <ul className="tm__zones" aria-label="Vurgulanan temas bölgeleri">
          <li className="tm__zones-h mono" aria-hidden="true">
            Temas yüzeyi
          </li>
          {zones.map((z) => (
            <li key={z} className="tm__zone" data-zone-chip={z} data-contact={z === m.contact ? 'true' : 'false'} data-hot={z === m.contact && hot ? 'true' : 'false'}>
              {zoneName(z)}
            </li>
          ))}
        </ul>
        {plan && (
          <p className="tm__plan-note">
            Sağ üstteki kutu üstten bakıştır: yukarı oyuncunun önüdür, yeşil çizgi topun yolunu gösterir{m.plan?.press ? '; çarpı işareti baskı yapan rakiptir' : ''}.
          </p>
        )}
      </div>

      <div className="tm__strip" role="group" aria-label="Hareketin üç evresi (sabit kareler)" data-tm-strip>
        {strip.map(({ t: ft, phase: ph }, i) => {
          // sabit karede vurgu yalnızca Temas karesinde yanar (geçiş yumuşatması olmaz)
          const f = { ...frameAt(m, ft, compiled), glow: ph === 'temas' ? 1 : 0 };
          return (
            <figure key={ph} className="tm__frame" data-frame={ph}>
              <Stage m={m} frame={f} trail={false} label={`${name}, ${PHASE_LABEL[ph]} evresi sabit kare`} planLabel={planLabel} />
              <figcaption>
                <span className="tm__pill mono" data-phase={ph}>
                  {PHASE_LABEL[ph]}
                </span>
                <span className="tm__cap">{m.caps[i]}</span>
              </figcaption>
            </figure>
          );
        })}
        {m.note && <p className="tm__note">{m.note}</p>}
      </div>

      <p className="tm__honest" data-tm-honest>
        <Icon name="info" />
        <span>Şematik hareket gösterimi; gerçek oyuncu videosu ya da hareket yakalama değildir.</span>
      </p>
    </div>
  );
}

