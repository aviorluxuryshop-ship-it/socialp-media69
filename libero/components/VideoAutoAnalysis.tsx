'use client';

/**
 * Otomatik video analizi — AŞAMA 1 TEST ARAYÜZÜ.
 * Motoru uçtan uca doğrulamak için en sade hâli: ayarlar → (gerekirse) oyuncu seçimi → ilerleme → düz sonuç görünümü.
 * Aşama 2 bunu nihai rapor arayüzüne dönüştürecek. Ağır kod (MediaPipe) yalnızca "Analizi başlat"a basılınca,
 * dinamik içe aktarmayla yüklenir; sayfanın ilk boyamasını engellemez.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { deleteVideoAnalysis, saveVideoAnalysis, useStore, type AppState } from '@/lib/store';
import { MEASURE_INFO } from '@/lib/pose/events';
import { fmt, PRIVACY_LINE, summarizeReport, type Report } from '@/lib/pose/report';
import type { PipelineResult } from '@/lib/pose/pipeline';
import { EVENT_TITLE, type Candidate, type Dims, type PoseEvent, type RawFrame, type Seed } from '@/lib/pose/types';
import { Icon } from './Icon';

type Engine = typeof import('@/lib/pose/engine');
type Phase = 'idle' | 'loading' | 'finding' | 'pick' | 'running' | 'done' | 'error' | 'cancelled';
type Quality = 'lite' | 'full';
type Delegate = 'CPU' | 'GPU';

const FPS_CHOICES = [5, 10, 15];
const MAX_SEGMENT_SEC = 120;
const selAnalyses = (s: AppState) => s.videoAnalyses;

interface Held {
  frames: RawFrame[];
  dims: Dims;
  fps: number;
  seeds: Seed[];
  quality: Quality;
  delegate: Delegate;
  startSec: number;
  endSec: number;
  processing: { totalMs: number; msPerFrame: number };
  result: PipelineResult;
}

/** "ad|boyut|tarih" anahtarından dosya boyutu (bayt); ad '|' içerse de sondan okunur. */
function sizeFromKey(key: string): number {
  const p = key.split('|');
  const n = Number(p[p.length - 2]);
  return Number.isFinite(n) ? n : 0;
}

function fmtDur(sec: number): string {
  if (!Number.isFinite(sec)) return '—';
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s} sn`;
  return `${Math.floor(s / 60)} dk ${s % 60} sn`;
}

function fmtClock(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

const unit = (k: string) => MEASURE_INFO[k]?.unit ?? '';

/** Olay satırında gösterilecek (en çok 4) ölçüm. */
function keyMeasures(e: PoseEvent): { label: string; value: string }[] {
  const m = e.measures;
  const out: { label: string; value: string }[] = [];
  const add = (k: string, d = 1) => {
    const v = m[k];
    if (v === null || v === undefined) return;
    const text = typeof v === 'number' ? `${fmt(v, d)}${unit(k) ? ' ' + unit(k) : ''}` : String(v);
    out.push({ label: MEASURE_INFO[k]?.label ?? k, value: text });
  };
  if (e.type === 'vurus') ['bacak', 'tepe_ayak_hizi', 'destek_diz_acisi', 'govde_egimi'].forEach((k) => add(k, k.endsWith('acisi') || k === 'govde_egimi' ? 0 : 1));
  else if (e.type === 'yon-degistirme') ['aci_degisimi', 'onceki_hiz', 'sonraki_hiz', 'kalca_alcalmasi'].forEach((k) => add(k, k.includes('hiz') ? 1 : 0));
  else if (e.type === 'hizlanma') ['sinif', 'baslangic_hizi', 'tepe_hiz', 'sure'].forEach((k) => add(k));
  else if (e.type === 'durus') ['tur', 'sure', 'destek_bacagi', 'kalca_salinimi'].forEach((k) => add(k, k === 'kalca_salinimi' ? 2 : 1));
  else ['en_kucuk_diz_acisi', 'kalca_dususu', 'sure'].forEach((k) => add(k, k === 'sure' ? 1 : 0));
  return out.slice(0, 4);
}

export interface VideoAutoAnalysisProps {
  /** ana oynatıcı (şimdiki an okumak ve olaya gitmek için) */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** ana oynatıcının blob adresi (burada yenisi üretilmez, iptal edilecek URL yoktur) */
  src: string;
  /** "ad|boyut|tarih" — videoNotes ile aynı anahtar */
  fileKey: string;
  fileName: string;
}

export function VideoAutoAnalysis({ videoRef, src, fileKey, fileName }: VideoAutoAnalysisProps) {
  const analyses = useStore(selAnalyses);
  const saved = analyses[fileKey];

  const [startSec, setStartSec] = useState('0');
  const [endSec, setEndSec] = useState('10');
  const [fps, setFps] = useState(10);
  const [quality, setQuality] = useState<Quality>('lite');
  const [delegate, setDelegate] = useState<Delegate>('CPU');
  const [dur, setDur] = useState<number | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number; etaMs: number | null; msPerFrame: number | null; poses: number } | null>(null);
  const [measuredPer, setMeasuredPer] = useState<number | null>(null);
  const [held, setHeld] = useState<Held | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stillDims, setStillDims] = useState<Dims | null>(null);
  const [fix, setFix] = useState<{ open: boolean; idx: number; cands: Candidate[]; dims: Dims | null; busy: boolean }>({ open: false, idx: 0, cands: [], dims: null, busy: false });

  const abortRef = useRef<AbortController | null>(null);
  const pickRef = useRef<((seed: Seed | null) => void) | null>(null);
  const stillRef = useRef<HTMLCanvasElement>(null);
  const fixRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const pipelineRef = useRef<typeof import('@/lib/pose/pipeline') | null>(null);

  const running = phase === 'loading' || phase === 'finding' || phase === 'pick' || phase === 'running';
  const fileSize = useMemo(() => sizeFromKey(fileKey), [fileKey]);

  // ana oynatıcının süresini izle (varsayılan aralık için)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const read = () => {
      const d = v.duration;
      setDur(Number.isFinite(d) && d > 0 ? d : null);
    };
    read();
    v.addEventListener('loadedmetadata', read);
    v.addEventListener('durationchange', read);
    return () => {
      v.removeEventListener('loadedmetadata', read);
      v.removeEventListener('durationchange', read);
    };
  }, [videoRef, src]);

  // varsayılan bitiş: ilk 10 sn (video daha kısaysa süre kadar)
  useEffect(() => {
    if (dur !== null) setEndSec((cur) => (Number(cur) > dur || cur === '10' ? String(Math.round(Math.min(dur, 10) * 10) / 10) : cur));
  }, [dur]);

  const abortAll = useCallback(() => {
    abortRef.current?.abort();
    pickRef.current?.(null);
    pickRef.current = null;
  }, []);

  // yeni video seçilince ya da sayfadan çıkılınca: iptal et ve belleği bırak
  useEffect(() => {
    setPhase('idle');
    setHeld(null);
    setError('');
    setStatus('');
    setProgress(null);
    setCandidates([]);
    setFix({ open: false, idx: 0, cands: [], dims: null, busy: false });
    return () => {
      abortAll();
      void import('@/lib/pose/engine').then((e) => e.disposeLandmarker());
    };
  }, [src, abortAll]);

  const loadEngine = useCallback(async () => {
    if (!engineRef.current) engineRef.current = await import('@/lib/pose/engine');
    if (!pipelineRef.current) pipelineRef.current = await import('@/lib/pose/pipeline');
    return { eng: engineRef.current, pipe: pipelineRef.current };
  }, []);

  const range = useMemo(() => {
    const s = Math.max(0, Number(startSec) || 0);
    let e = Number(endSec);
    if (!Number.isFinite(e) || e <= s) e = s + 1;
    if (dur !== null) e = Math.min(e, dur);
    return { s, e: Math.min(e, s + MAX_SEGMENT_SEC) };
  }, [startSec, endSec, dur]);
  const frameTotal = Math.max(1, Math.floor((range.e - range.s) * fps + 1e-6) + 1);
  const estimate = ((measuredPer ?? (quality === 'full' ? 550 : 300)) * frameTotal) / 1000;
  const rangeInvalid = !(Number(endSec) > Number(startSec)) || Number(startSec) < 0 || (dur !== null && Number(startSec) >= dur);

  const nowOf = () => {
    const v = videoRef.current;
    return v ? Math.round(v.currentTime * 10) / 10 : 0;
  };

  // ── Analiz akışı ──
  const start = useCallback(async () => {
    if (running) return;
    setError('');
    setHeld(null);
    setCandidates([]);
    setProgress(null);
    const ac = new AbortController();
    abortRef.current = ac;
    let av: { video: HTMLVideoElement; dispose: () => void } | null = null;
    try {
      setPhase('loading');
      setStatus('Video açılıyor ve model yükleniyor…');
      const { eng, pipe } = await loadEngine();
      av = eng.createAnalysisVideo(src);
      const info = await eng.prepareVideo(av.video);
      if (ac.signal.aborted) throw new eng.AnalysisAborted();
      const total = info.duration;
      const s = Math.max(0, Math.min(range.s, (total ?? Infinity) - 0.2));
      const e = total ? Math.min(range.e, total) : range.e;
      if (e - s < 0.2) throw new Error('Seçilen aralık çok kısa ya da videonun dışında.');

      setPhase('finding');
      setStatus('Başlangıç karesinde oyuncular aranıyor…');
      const cand = await eng.detectCandidates(av.video, s, { quality, delegate, canvas: stillRef.current ?? undefined, signal: ac.signal });
      if (!cand.candidates.length) {
        throw new Error('Başlangıç karesinde bir oyuncu bulunamadı. Oyuncunun net göründüğü bir an seçin (başlangıç süresini değiştirin) ya da daha yakından çekilmiş bir video kullanın.');
      }
      let seed: Seed;
      if (cand.candidates.length === 1) {
        const c = cand.candidates[0];
        seed = { t: s, x: c.hip[0], y: c.hip[1] };
      } else {
        setCandidates(cand.candidates);
        setStillDims(cand.dims);
        setPhase('pick');
        setStatus('Karede birden fazla kişi var. Analiz edilecek oyuncuya tıklayın.');
        const picked = await new Promise<Seed | null>((resolve) => {
          pickRef.current = (sd) => resolve(sd ? { ...sd, t: s } : null);
        });
        pickRef.current = null;
        if (!picked || ac.signal.aborted) throw new eng.AnalysisAborted();
        seed = picked;
        setCandidates([]);
      }

      setPhase('running');
      setStatus('Kareler işleniyor…');
      const res = await eng.analyzeVideo(av.video, {
        startSec: s,
        endSec: e,
        fps,
        quality,
        delegate,
        signal: ac.signal,
        onProgress: (p) => {
          setProgress({ done: p.done, total: p.total, etaMs: p.etaMs, msPerFrame: p.msPerFrame, poses: p.lastPoses });
          if (p.done >= 2) setMeasuredPer(p.msPerFrame);
        },
      });
      setStatus('Ölçümler hesaplanıyor…');
      const result = pipe.runPipeline(res.frames, res.dims, res.fps, [seed], {
        fileName,
        quality: res.quality,
        delegate: res.delegate,
        video: { width: info.width, height: info.height, durationSec: info.duration },
        startSec: res.startSec,
        endSec: res.endSec,
        processing: res.processing,
      });
      setHeld({ frames: res.frames, dims: res.dims, fps: res.fps, seeds: [seed], quality: res.quality, delegate: res.delegate, startSec: res.startSec, endSec: res.endSec, processing: res.processing, result });
      saveVideoAnalysis(fileKey, summarizeReport(result.report, fileName));
      setPhase('done');
      setStatus('');
    } catch (err) {
      const aborted = (err as Error)?.name === 'AbortError';
      if (aborted) {
        setPhase('cancelled');
        setStatus('');
      } else {
        setPhase('error');
        setError(err instanceof Error ? err.message : 'Analiz sırasında beklenmeyen bir hata oluştu.');
      }
    } finally {
      av?.dispose();
      abortRef.current = null;
      pickRef.current = null;
      engineRef.current?.scheduleIdleDispose(60_000);
    }
  }, [running, loadEngine, src, range, quality, delegate, fps, fileName, fileKey]);

  const cancel = () => abortAll();

  const pick = (c: Candidate) => pickRef.current?.({ t: 0, x: c.hip[0], y: c.hip[1] });

  // ── Sonuçta oyuncu düzeltme ──
  const drawFixStill = useCallback(
    async (idx: number, h: Held) => {
      setFix((f) => ({ ...f, busy: true, idx }));
      const { eng } = await loadEngine();
      const { candidatesFromFrame } = await import('@/lib/pose/tracking');
      const frame = h.frames[Math.max(0, Math.min(h.frames.length - 1, idx))];
      const av = eng.createAnalysisVideo(src);
      try {
        await eng.prepareVideo(av.video);
        await eng.seekTo(av.video, frame.t);
        const c = fixRef.current;
        if (c) {
          const w = Math.min(640, av.video.videoWidth);
          c.width = w;
          c.height = Math.round((w * av.video.videoHeight) / av.video.videoWidth);
          c.getContext('2d')?.drawImage(av.video, 0, 0, c.width, c.height);
        }
        setFix({ open: true, idx, cands: candidatesFromFrame(frame, h.dims), dims: h.dims, busy: false });
      } catch {
        setFix((f) => ({ ...f, busy: false }));
      } finally {
        av.dispose();
      }
    },
    [loadEngine, src],
  );

  const rerun = useCallback(
    async (seeds: Seed[]) => {
      if (!held) return;
      const { pipe } = await loadEngine();
      const result = pipe.runPipeline(held.frames, held.dims, held.fps, seeds, {
        fileName,
        quality: held.quality,
        delegate: held.delegate,
        video: { width: held.dims.w, height: held.dims.h, durationSec: dur },
        startSec: held.startSec,
        endSec: held.endSec,
        processing: held.processing,
      });
      setHeld({ ...held, seeds, result });
      saveVideoAnalysis(fileKey, summarizeReport(result.report, fileName));
    },
    [held, loadEngine, fileName, fileKey, dur],
  );

  const pickFix = (c: Candidate) => {
    if (!held) return;
    const frame = held.frames[fix.idx];
    const seeds = [...held.seeds, { t: frame.t, x: c.hip[0], y: c.hip[1] }].slice(-6);
    setFix((f) => ({ ...f, open: false }));
    void rerun(seeds);
  };

  const downloadReport = () => {
    if (!held) return;
    const blob = new Blob([JSON.stringify(held.result.report, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analiz-${fileName.replace(/\.[^.]+$/, '').slice(0, 40) || 'video'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const seekMain = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.max(0, t);
    v.scrollIntoView?.({ block: 'center', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const clearResult = () => {
    setHeld(null);
    setPhase('idle');
    setFix({ open: false, idx: 0, cands: [], dims: null, busy: false });
  };

  const report: Report | null = held?.result.report ?? null;
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="vauto" aria-labelledby="vauto-title" data-testid="vauto">
      <header className="vauto__head">
        <p className="eyebrow">Otomatik analiz · deneysel</p>
        <h2 id="vauto-title" className="h2">
          Oyuncuyu <em>otomatik</em> izle
        </h2>
        <p className="vauto__privacy" data-testid="vauto-privacy">
          <Icon name="lock" aria-hidden="true" /> {PRIVACY_LINE}
        </p>
        <p className="muted vauto__lead">
          Bir poz-tahmin modeli (MediaPipe) oyuncunun iskelet noktalarını bulur; açı, hız ve önemli anlar bu noktalardan sabit kurallarla hesaplanır. Yorum üreten bir yapay zekâ kullanılmaz. Sonuçlar bir antrenörün gözünü ve yargısını
          tamamlar, yerine geçmez.
        </p>
      </header>

      <div className="vauto__grid">
        <div className="panel vauto__form">
          <p className="panel__title">Ayarlar</p>
          <div className="vauto__fields">
            <div className="field">
              <label htmlFor="va-start">Başlangıç (sn)</label>
              <div className="vauto__inline">
                <input id="va-start" className="input" type="number" min={0} step={0.1} inputMode="decimal" value={startSec} disabled={running} onChange={(e) => setStartSec(e.target.value)} />
                <button type="button" className="btn btn--quiet btn--sm" disabled={running} onClick={() => setStartSec(String(nowOf()))}>
                  Şimdiki an
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="va-end">Bitiş (sn)</label>
              <div className="vauto__inline">
                <input id="va-end" className="input" type="number" min={0} step={0.1} inputMode="decimal" value={endSec} disabled={running} onChange={(e) => setEndSec(e.target.value)} />
                <button type="button" className="btn btn--quiet btn--sm" disabled={running} onClick={() => setEndSec(String(nowOf()))}>
                  Şimdiki an
                </button>
              </div>
            </div>
          </div>
          <div className="vauto__fields">
            <div className="field">
              <span className="field__label" id="va-fps-l">Örnekleme (kare/sn)</span>
              <div className="seg" role="group" aria-labelledby="va-fps-l">
                {FPS_CHOICES.map((f) => (
                  <button key={f} type="button" aria-pressed={fps === f} disabled={running} onClick={() => setFps(f)}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field__label" id="va-q-l">Model</span>
              <div className="seg" role="group" aria-labelledby="va-q-l">
                <button type="button" aria-pressed={quality === 'lite'} disabled={running} onClick={() => setQuality('lite')}>Hızlı</button>
                <button type="button" aria-pressed={quality === 'full'} disabled={running} onClick={() => setQuality('full')}>Daha doğru</button>
              </div>
            </div>
            <div className="field vauto__wide">
              <span className="field__label" id="va-d-l">Hesaplama</span>
              <div className="seg" role="group" aria-labelledby="va-d-l">
                <button type="button" aria-pressed={delegate === 'CPU'} disabled={running} onClick={() => setDelegate('CPU')}>İşlemci</button>
                <button type="button" aria-pressed={delegate === 'GPU'} disabled={running} onClick={() => setDelegate('GPU')}>Ekran kartı (deneysel)</button>
              </div>
            </div>
          </div>
          <p className="field__hint" data-testid="vauto-estimate">
            {frameTotal} kare · tahmini süre ≈ {fmtDur(estimate)}
            {measuredPer ? ' (son ölçüme göre)' : ' (kaba tahmin; ilk karelerden sonra gerçek süre gösterilir)'}. Düşük örnekleme daha hızlıdır ama vuruş gibi hızlı hareketleri gözden kaçırabilir. Analiz sürerken sekmeyi açık tutun.
          </p>
          {fileSize >= 500 * 1024 * 1024 && (
            <p className="note note--warn" role="status" style={{ marginTop: 12 }}>
              <Icon name="warn" aria-hidden="true" />
              <span>
                <strong>Büyük dosya ({fmtSize(fileSize)}).</strong> Tarayıcı belleği yetmeyebilir. Mümkünse videonun ilgili bölümünü kısaltıp yükleyin.
              </span>
            </p>
          )}
          {dur === null && (
            <p className="field__hint">Videonun süresi bilinmiyor (bazı kayıtlarda süre bilgisi yoktur); bitiş süresini kendiniz girin.</p>
          )}
          {rangeInvalid && <p className="field__hint" role="alert">Bitiş, başlangıçtan büyük olmalı.</p>}
          {Number(endSec) - Number(startSec) > MAX_SEGMENT_SEC && <p className="field__hint">En çok {MAX_SEGMENT_SEC} sn işlenir; aralık buna göre kısaltılacak.</p>}
          <div className="vauto__actions">
            {!running ? (
              <button type="button" className="btn btn--primary" onClick={() => void start()} disabled={rangeInvalid} data-testid="vauto-start">
                Analizi başlat <Icon name="arrow" />
              </button>
            ) : (
              <button type="button" className="btn btn--danger" onClick={cancel} data-testid="vauto-cancel">
                <Icon name="close" aria-hidden="true" /> İptal et
              </button>
            )}
          </div>
          {saved && !held && !running && (
            <p className="field__hint vauto__saved" data-testid="vauto-saved">
              Bu video için kayıtlı özet var ({new Date(saved.at).toLocaleDateString('tr-TR')} · güvenilirlik {saved.reliability} · {saved.events.length} an).{' '}
              <button type="button" className="vauto__link" onClick={() => deleteVideoAnalysis(fileKey)}>
                Özeti sil
              </button>
            </p>
          )}
        </div>

        <div className="panel vauto__out" aria-live="polite" data-testid="vauto-out" data-phase={phase}>
          <p className="panel__title">Durum</p>

          {phase === 'idle' && !held && <p className="muted">Hazır. Aralığı ve ayarları seçip “Analizi başlat”a basın. İlk kullanımda model (birkaç MB) siteden yüklenir; sonraki kullanımlarda tarayıcı önbelleğinden gelir.</p>}

          {(phase === 'loading' || phase === 'finding') && (
            <p className="vauto__status" role="status">
              <span className="vauto__spin" aria-hidden="true" /> {status}
            </p>
          )}

          <div className="vauto__still" hidden={phase !== 'pick' && phase !== 'finding'}>
            <div className="vauto__stillbox" style={{ aspectRatio: stillDims ? `${stillDims.w} / ${stillDims.h}` : undefined }}>
              <canvas ref={stillRef} aria-label="Başlangıç karesi" />
              {phase === 'pick' &&
                candidates.map((c, i) => (
                  <button
                    key={c.index}
                    type="button"
                    className="vauto__cand"
                    style={{ left: `${c.bbox[0] * 100}%`, top: `${c.bbox[1] * 100}%`, width: `${(c.bbox[2] - c.bbox[0]) * 100}%`, height: `${(c.bbox[3] - c.bbox[1]) * 100}%` }}
                    onClick={() => pick(c)}
                    aria-label={`Oyuncu ${i + 1}’i seç (kadrajın %${Math.round(c.heightPct)}’i kadar)`}
                    data-testid="vauto-cand"
                  >
                    <span className="vauto__candn">{i + 1}</span>
                  </button>
                ))}
            </div>
            {phase === 'pick' && (
              <p className="vauto__status" role="status">
                {status}
              </p>
            )}
          </div>

          {phase === 'running' && progress && (
            <div className="vauto__prog" data-testid="vauto-progress">
              <div className="vauto__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Analiz ilerlemesi">
                <span style={{ width: `${pct}%` }} />
              </div>
              <p className="mono vauto__progtxt">
                Kare {progress.done} / {progress.total} · %{pct}
                {progress.etaMs !== null && progress.done < progress.total ? ` · yaklaşık ${fmtDur(progress.etaMs / 1000)} kaldı` : ''}
                {progress.msPerFrame ? ` · ${Math.round(progress.msPerFrame)} ms/kare` : ''}
              </p>
              <p className="field__hint">Her karede bulunan kişi: {progress.poses}. İptal ederseniz o ana kadarki sonuçlar atılır.</p>
            </div>
          )}
          {phase === 'running' && !progress && (
            <p className="vauto__status" role="status">
              <span className="vauto__spin" aria-hidden="true" /> {status}
            </p>
          )}

          {phase === 'cancelled' && (
            <p className="note" role="status" data-testid="vauto-cancelled">
              <Icon name="info" aria-hidden="true" />
              <span>Analiz iptal edildi. İsterseniz ayarları değiştirip yeniden başlatabilirsiniz.</span>
            </p>
          )}
          {phase === 'error' && (
            <p className="note note--warn" role="alert" data-testid="vauto-error">
              <Icon name="warn" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          {phase === 'done' && report && held && (
            <Results
              report={report}
              held={held}
              onSeek={seekMain}
              onDownload={downloadReport}
              onClear={clearResult}
              fix={fix}
              fixRef={fixRef}
              onOpenFix={() => void drawFixStill(Math.round(held.frames.length / 2), held)}
              onFixIndex={(i) => void drawFixStill(i, held)}
              onPickFix={pickFix}
              onCloseFix={() => setFix((f) => ({ ...f, open: false }))}
              onResetSeeds={() => void rerun(held.seeds.slice(0, 1))}
            />
          )}
        </div>
      </div>

      <p className="field__hint vauto__credit">
        Poz modeli: Google MediaPipe Pose Landmarker (Apache-2.0 lisansı). Model ve çalışma dosyaları siteyle birlikte sunulur; dış sunucudan indirilmez. Ayrıntı: <code>/third-party-notices.txt</code>.
      </p>
    </section>
  );
}

// ── Sonuç görünümü (düz) ──────────────────────────────────────

interface ResultsProps {
  report: Report;
  held: Held;
  onSeek: (t: number) => void;
  onDownload: () => void;
  onClear: () => void;
  fix: { open: boolean; idx: number; cands: Candidate[]; dims: Dims | null; busy: boolean };
  fixRef: RefObject<HTMLCanvasElement | null>;
  onOpenFix: () => void;
  onFixIndex: (i: number) => void;
  onPickFix: (c: Candidate) => void;
  onCloseFix: () => void;
  onResetSeeds: () => void;
}

function Results({ report, held, onSeek, onDownload, onClear, fix, fixRef, onOpenFix, onFixIndex, onPickFix, onCloseFix, onResetSeeds }: ResultsProps) {
  const rel = report.reliability;
  const sum = report.measured.summary;
  const events = report.measured.events;
  const A = sum.angles;
  const range = (r: { min: number | null; max: number | null }) => (r.min === null ? '—' : `${fmt(r.min, 0)}–${fmt(r.max, 0)}°`);
  const relClass = rel.level === 'yüksek' ? 'tag--grass' : rel.level === 'orta' ? 'tag--brass' : 'tag--terra';
  const needsUser = rel.stats.needsUser;

  return (
    <div className="vauto__res" data-testid="vauto-results">
      <div className="vauto__relrow">
        <span className={`tag ${relClass}`} data-testid="vauto-reliability">
          Güvenilirlik: {rel.level} ({rel.score}/100)
        </span>
        <span className="mono muted">
          {report.meta.engine.model === 'full' ? 'Daha doğru model' : 'Hızlı model'} · {report.meta.engine.delegate === 'GPU' ? 'ekran kartı' : 'işlemci'} · {report.meta.frames} kare · {fmtDur(report.meta.processing ? report.meta.processing.totalMs / 1000 : 0)}
        </span>
      </div>

      {rel.warnings.length > 0 && (
        <ul className="vauto__warns" data-testid="vauto-warnings">
          {rel.warnings.map((w) => (
            <li key={w} className="note note--warn">
              <Icon name="warn" aria-hidden="true" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {needsUser && (
        <div className="note" data-testid="vauto-needs-user">
          <Icon name="user" aria-hidden="true" />
          <span>
            <strong>Oyuncu seçimini doğrulamanız gerekiyor.</strong> Takip yalnızca konum ve boyut sürekliliğine dayanır; forma ya da yüzü ayırt edemez. Doğru kişiyi başka bir karede seçerek takibi düzeltebilirsiniz.
          </span>
        </div>
      )}

      <div className="vauto__fixbar">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onOpenFix} data-testid="vauto-fix-open">
          <Icon name="user" aria-hidden="true" /> Oyuncuyu yeniden seç
        </button>
        {held.seeds.length > 1 && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={onResetSeeds}>
            Düzeltmeleri sıfırla ({held.seeds.length - 1})
          </button>
        )}
      </div>
      {fix.open || fix.busy ? (
        <div className="vauto__fix">
          <label className="field__label" htmlFor="va-fixidx">
            Kare seç: {fmtClock(held.frames[fix.idx]?.t ?? 0)}
          </label>
          <input id="va-fixidx" className="vlab__seek" type="range" min={0} max={held.frames.length - 1} value={fix.idx} disabled={fix.busy} onChange={(e) => onFixIndex(Number(e.target.value))} />
          <div className="vauto__stillbox" style={{ aspectRatio: fix.dims ? `${fix.dims.w} / ${fix.dims.h}` : '16 / 9' }}>
            <canvas ref={fixRef} aria-label="Düzeltme karesi" />
            {fix.open &&
              fix.cands.map((c, i) => (
                <button
                  key={c.index}
                  type="button"
                  className="vauto__cand"
                  style={{ left: `${c.bbox[0] * 100}%`, top: `${c.bbox[1] * 100}%`, width: `${(c.bbox[2] - c.bbox[0]) * 100}%`, height: `${(c.bbox[3] - c.bbox[1]) * 100}%` }}
                  onClick={() => onPickFix(c)}
                  aria-label={`Bu karedeki oyuncu ${i + 1}’i seç`}
                >
                  <span className="vauto__candn">{i + 1}</span>
                </button>
              ))}
          </div>
          <div className="vauto__fixbar">
            <p className="field__hint" style={{ margin: 0 }}>
              {fix.busy ? 'Kare hazırlanıyor…' : fix.cands.length ? 'Doğru kişiye tıklayın; ölçümler yeniden hesaplanır (video yeniden işlenmez).' : 'Bu karede kimse bulunamadı; kaydırıcıyla başka bir kare seçin.'}
            </p>
            <button type="button" className="btn btn--quiet btn--sm" onClick={onCloseFix}>
              Kapat
            </button>
          </div>
        </div>
      ) : null}

      <h3 className="vauto__h">Özet</h3>
      <dl className="vauto__sum" data-testid="vauto-summary">
        <div><dt>Takip kapsaması</dt><dd>%{rel.stats.coveragePct}</dd></div>
        <div><dt>Oyuncu boyu (kadraja göre)</dt><dd>{rel.stats.playerHeightPct === null ? '—' : `%${fmt(rel.stats.playerHeightPct, 0)}`}</dd></div>
        <div><dt>Kamera görünümü</dt><dd>{sum.viewKind}</dd></div>
        <div><dt>En yüksek kalça hızı</dt><dd>{fmt(sum.hipSpeed.max, 1)} GB/sn</dd></div>
        <div><dt>Adım sıklığı</dt><dd>{sum.cadence ? `≈ ${sum.cadence} adım/dk` : '—'}</dd></div>
        <div><dt>Diz açısı (sol / sağ)</dt><dd>{range(A.kneeL)} / {range(A.kneeR)}</dd></div>
        <div><dt>Kalça açısı (sol / sağ)</dt><dd>{range(A.hipL)} / {range(A.hipR)}</dd></div>
        <div><dt>Gövde eğimi</dt><dd>{sum.trunkLean ? `${fmt(sum.trunkLean.min, 0)}° … ${fmt(sum.trunkLean.max, 0)}°` : 'belirlenemedi'}</dd></div>
        <div><dt>Bulunan anlar</dt><dd>{events.length}</dd></div>
      </dl>
      <p className="field__hint">GB = gövde boyu (omuz–kalça uzaklığı). Hızlar kalibrasyonsuz olduğundan metre/sn verilmez. Açılar görüntü düzlemindedir.</p>

      <h3 className="vauto__h">Önemli anlar</h3>
      {events.length === 0 ? (
        <p className="muted" data-testid="vauto-noevents">
          Bu aralıkta eşikleri aşan bir an bulunmadı. Bu, hareket olmadığı anlamına gelmeyebilir; çekim açısı ya da örnekleme yetersiz olabilir.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table vauto__events" data-testid="vauto-events">
            <thead>
              <tr>
                <th scope="col">An</th>
                <th scope="col">Tür</th>
                <th scope="col">Güven</th>
                <th scope="col">Ölçümler</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} data-type={e.type}>
                  <td>
                    <button type="button" className="vauto__time mono" onClick={() => onSeek(e.t)} aria-label={`${EVENT_TITLE[e.type]}, ${fmt(e.t, 1)}. saniyeye git`}>
                      {fmtClock(e.t)}
                    </button>
                  </td>
                  <td>{EVENT_TITLE[e.type]}</td>
                  <td className="mono">%{Math.round(e.confidence * 100)}</td>
                  <td>
                    <ul className="vauto__chips">
                      {keyMeasures(e).map((m) => (
                        <li key={m.label}>
                          <span>{m.label}</span> <b>{m.value}</b>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="vauto__h">
        Yönlendirme <span className="tag" data-testid="vauto-rule-label">{report.ruleBased.label}</span>
      </h3>
      {report.ruleBased.findings.length === 0 ? (
        <p className="muted">Bu aralık için kural tabanlı bir yönlendirme üretilmedi.</p>
      ) : (
        <ul className="vauto__finds" data-testid="vauto-findings">
          {report.ruleBased.findings.slice(0, 8).map((f) => (
            <li key={f.id} className={f.level === 'dikkat' ? 'is-attn' : undefined}>
              <b>{f.title}</b>
              <p>{f.text}</p>
              <p className="mono vauto__cite">
                Ölçülen: {f.measured}
                {f.threshold ? ` · Eşik: ${f.threshold}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
      {report.ruleBased.findings.length > 8 && <p className="field__hint">{report.ruleBased.findings.length - 8} bulgu daha var; ayrıntı için JSON raporu indirin.</p>}

      <div className="note" data-testid="vauto-ai">
        <Icon name="info" aria-hidden="true" />
        <span>
          <strong>Yapay zekâ yorumu: {report.ai.status}.</strong> {report.ai.reason}
        </span>
      </div>

      <details className="vauto__limits">
        <summary>Bu ölçümlerin sınırları</summary>
        <ul>
          {rel.limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>

      <div className="vauto__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDownload} data-testid="vauto-download">
          <Icon name="download" aria-hidden="true" /> Raporu JSON indir
        </button>
        <button type="button" className="btn btn--quiet btn--sm" onClick={onClear}>
          Sonucu temizle
        </button>
      </div>
    </div>
  );
}
