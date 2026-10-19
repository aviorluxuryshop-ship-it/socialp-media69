'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteVideoNotes, getState, saveVideoNotes, useStore, type AppState, type VideoMarker } from '@/lib/store';
import { toast } from '@/lib/toast';
import { uid } from '@/lib/utils';
import { Icon } from './Icon';
import { VideoAutoAnalysis } from './VideoAutoAnalysis';

type Tool = 'none' | 'pen' | 'line' | 'arrow' | 'circle' | 'angle';
interface Stroke {
  tool: Exclude<Tool, 'none'>;
  color: string;
  pts: [number, number][]; // 0–1 normalize
}

const COLORS = [
  { id: '#e3c47e', name: 'Altın' },
  { id: '#efeadc', name: 'Beyaz' },
  { id: '#d8664c', name: 'Kırmızı' },
  { id: '#3f9a68', name: 'Yeşil' },
  { id: '#8fd0bd', name: 'Nane' },
];

const TOOLS: { id: Tool; name: string }[] = [
  { id: 'none', name: 'İzle' },
  { id: 'pen', name: 'Kalem' },
  { id: 'line', name: 'Çizgi' },
  { id: 'arrow', name: 'Ok' },
  { id: 'circle', name: 'Daire' },
  { id: 'angle', name: 'Açı (3 nokta)' },
];

const TEMPLATES: Record<string, { name: string; criteria: string[] }> = {
  serbest: { name: 'Serbest not', criteria: [] },
  pas: { name: 'Pas', criteria: ['Duruş ayağı topun yanında', 'Bakış ve vücut yönü', 'Vuruş yüzeyi', 'Takip hareketi', 'İsabet ve ağırlık'] },
  sut: { name: 'Şut', criteria: ['Yaklaşma açısı', 'Duruş ayağı', 'Denge ve gövde', 'Vuruş yüzeyi', 'Takip hareketi'] },
  kontrol: { name: 'İlk dokunuş', criteria: ['Karşılamaya hazırlık (omuz, bakış)', 'Yön (sonraki harekete)', 'Yüzey seçimi', 'Top-vücut mesafesi', 'Sonraki hareket'] },
  calim: { name: 'Çalım / birebir', criteria: ['Hız değişimi', 'Vücut sahtesi', 'Top kontrolü', 'Rakibe mesafe', 'Çıkış'] },
  savunma: { name: 'Savunma duruşu', criteria: ['Yan duruş', 'Ağırlık merkezi', 'Rakibe mesafe', 'Yönlendirme', 'Müdahale zamanı'] },
  topsuz: { name: 'Topsuz hareket', criteria: ['Tarama', 'Zamanlama', 'Açı yaratma', 'Alan kullanımı', 'Tempo'] },
};

const SPEEDS = [0.25, 0.5, 1];
const FPS_OPTIONS = [24, 25, 30, 50, 60];

function fmtTime(t: number) {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function fileKey(f: File) {
  return `${f.name}|${f.size}|${f.lastModified}`;
}

function angleDeg(a: [number, number], b: [number, number], c: [number, number], w: number, h: number) {
  const v1 = [(a[0] - b[0]) * w, (a[1] - b[1]) * h];
  const v2 = [(c[0] - b[0]) * w, (c[1] - b[1]) * h];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const m = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]);
  if (!m) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
}

function paint(ctx: CanvasRenderingContext2D, W: number, H: number, strokes: Stroke[]) {
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const lw = Math.max(2, W / 320);
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = lw;
    const p = s.pts.map(([x, y]) => [x * W, y * H] as const);
    if (p.length === 0) continue;
    ctx.beginPath();
    if (s.tool === 'pen') {
      ctx.moveTo(p[0][0], p[0][1]);
      p.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    } else if (s.tool === 'line' || s.tool === 'arrow') {
      if (p.length < 2) continue;
      const [a, b] = [p[0], p[p.length - 1]];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      if (s.tool === 'arrow') {
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const hl = lw * 5;
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - hl * Math.cos(ang - 0.4), b[1] - hl * Math.sin(ang - 0.4));
        ctx.lineTo(b[0] - hl * Math.cos(ang + 0.4), b[1] - hl * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      }
    } else if (s.tool === 'circle') {
      if (p.length < 2) continue;
      const [a, b] = [p[0], p[p.length - 1]];
      const r = Math.hypot(b[0] - a[0], b[1] - a[1]);
      ctx.arc(a[0], a[1], r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.tool === 'angle') {
      ctx.moveTo(p[0][0], p[0][1]);
      if (p[1]) ctx.lineTo(p[1][0], p[1][1]);
      if (p[2]) ctx.lineTo(p[2][0], p[2][1]);
      ctx.stroke();
      p.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, lw * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
      if (p.length === 3) {
        const deg = angleDeg(s.pts[0], s.pts[1], s.pts[2], W, H);
        const fs = Math.max(14, W / 38);
        ctx.font = `600 ${fs}px "JetBrains Mono Variable", monospace`;
        const label = `${deg.toFixed(0)}°`;
        const tx = p[1][0] + fs * 0.8;
        const ty = p[1][1] - fs * 0.6;
        ctx.lineWidth = fs / 5;
        ctx.strokeStyle = 'rgba(6,10,8,0.85)';
        ctx.strokeText(label, tx, ty);
        ctx.fillStyle = s.color;
        ctx.fillText(label, tx, ty);
      }
    }
  }
}

const selNotes = (s: AppState) => s.videoNotes;

export function VideoLab() {
  const notes = useStore(selNotes);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const draft = useRef<Stroke | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ key: string; name: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [fps, setFps] = useState(30);
  const [tool, setTool] = useState<Tool>('none');
  const [color, setColor] = useState(COLORS[0].id);
  const [scratch, setScratch] = useState<Stroke[]>([]);
  const [markers, setMarkers] = useState<VideoMarker[]>([]);
  const [tpl, setTpl] = useState<keyof typeof TEMPLATES>('serbest');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // object URL temizliği
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const loadFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('Lütfen bir video dosyası seçin (MP4, MOV, WebM…).');
      return;
    }
    setError('');
    const key = fileKey(f);
    setSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
    setFileInfo({ key, name: f.name });
    setScratch([]);
    setActiveMarker(null);
    setTime(0);
    setDur(0);
    setPlaying(false);
    setSpeed(1);
    const saved = getState().videoNotes[key]?.markers ?? [];
    setMarkers(saved);
    if (saved.length) toast(`${saved.length} kayıtlı not bu videoyla eşleşti.`);
  }, []);

  // Kayıtlı notlar: video dosyası değil, yalnızca ad+boyut+tarih parmak izine bağlı notlar
  // notları kalıcı hale getir
  const persist = useCallback((next: VideoMarker[]) => {
    setMarkers(next);
    if (fileInfo) saveVideoNotes(fileInfo.key, fileInfo.name, next);
  }, [fileInfo]);

  // tuval boyutu: video kutusunu izle
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [src]);

  // gösterilecek çizgiler: üzerinde çalışılan + (duraklatılmışsa) yakın işaretin çizgileri
  const shownMarker = useMemo(() => {
    if (activeMarker) return markers.find((m) => m.id === activeMarker) ?? null;
    if (playing) return null;
    return markers.find((m) => Math.abs(m.t - time) < 0.12) ?? null;
  }, [activeMarker, markers, playing, time]);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== size.w * dpr || c.height !== size.h * dpr) {
      c.width = size.w * dpr;
      c.height = size.h * dpr;
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const list: Stroke[] = [...((shownMarker?.strokes as Stroke[] | undefined) ?? []), ...scratch];
    if (draft.current) list.push(draft.current);
    paint(ctx, size.w, size.h, list);
  }, [size, scratch, shownMarker]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Video olayları ──
  const v = () => videoRef.current;
  const toggle = () => {
    const el = v();
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };
  const seek = (t: number) => {
    const el = v();
    if (!el) return;
    el.pause();
    el.currentTime = Math.max(0, Math.min(el.duration || 0, t));
    setTime(el.currentTime);
  };
  const step = (n: number) => {
    const el = v();
    if (!el) return;
    seek(el.currentTime + n / fps);
    setActiveMarker(null);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(e.shiftKey ? -10 : -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(e.shiftKey ? 10 : 1); }
  };

  // ── Çizim ──
  const pos = (e: React.PointerEvent): [number, number] => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))];
  };
  const onDown = (e: React.PointerEvent) => {
    if (tool === 'none') return;
    e.preventDefault();
    v()?.pause();
    setActiveMarker(null);
    const p = pos(e);
    if (tool === 'angle') {
      const cur = draft.current;
      if (!cur) draft.current = { tool: 'angle', color, pts: [p] };
      else cur.pts.push(p);
      if (draft.current && draft.current.pts.length === 3) {
        const done = draft.current;
        draft.current = null;
        setScratch((s) => [...s, done]);
      } else redraw();
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draft.current = { tool, color, pts: tool === 'pen' ? [p] : [p, p] };
    redraw();
  };
  const onMove = (e: React.PointerEvent) => {
    const d = draft.current;
    if (!d) return;
    const p = pos(e);
    if (d.tool === 'angle') {
      // önizleme: son noktayı imleçle göster
      const tmp = { ...d, pts: [...d.pts.slice(0, d.pts.length), p] };
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint(ctx, size.w, size.h, [...((shownMarker?.strokes as Stroke[] | undefined) ?? []), ...scratch, tmp]);
      }
      return;
    }
    if (d.tool === 'pen') d.pts.push(p);
    else d.pts[1] = p;
    redraw();
  };
  const onUp = () => {
    const d = draft.current;
    if (!d || d.tool === 'angle') return;
    draft.current = null;
    const len = d.pts.length >= 2 ? Math.hypot(d.pts[d.pts.length - 1][0] - d.pts[0][0], d.pts[d.pts.length - 1][1] - d.pts[0][1]) : 0;
    if (len > 0.005 || d.tool === 'pen') setScratch((s) => [...s, d]);
    else redraw();
  };
  const undo = () => {
    if (draft.current?.tool === 'angle') { draft.current = null; redraw(); return; }
    setScratch((s) => s.slice(0, -1));
  };

  // ── İşaretler ──
  const tplDef = TEMPLATES[tpl];
  const addMarker = () => {
    const el = v();
    if (!el) return;
    const sc = Object.fromEntries(Object.entries(scores).filter(([k]) => tplDef.criteria.includes(k)));
    const m: VideoMarker = {
      id: uid(),
      t: Number(el.currentTime.toFixed(3)),
      label: label.trim() || (tpl !== 'serbest' ? tplDef.name : 'İşaret'),
      note: note.trim(),
      scores: Object.keys(sc).length ? sc : undefined,
      strokes: scratch.length ? scratch : undefined,
    };
    persist([...markers, m].sort((a, b) => a.t - b.t));
    setScratch([]);
    setLabel('');
    setNote('');
    setScores({});
    setActiveMarker(m.id);
    toast('İşaret eklendi.');
  };
  const openMarker = (m: VideoMarker) => {
    seek(m.t);
    setActiveMarker(m.id);
  };
  const removeMarker = (id: string) => {
    persist(markers.filter((m) => m.id !== id));
    if (activeMarker === id) setActiveMarker(null);
  };

  const exportTxt = () => {
    const lines = [`Libero video analiz notları`, `Video: ${fileInfo?.name ?? ''}`, ''];
    markers.forEach((m, i) => {
      lines.push(`${i + 1}. [${fmtTime(m.t)}] ${m.label}`);
      if (m.note) lines.push(`   ${m.note}`);
      if (m.scores) Object.entries(m.scores).forEach(([k, val]) => lines.push(`   - ${k}: ${val}/5`));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'video-analiz-notlari.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const saveFrame = () => {
    const el = v();
    if (!el || !el.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = el.videoWidth;
    c.height = el.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(el, 0, 0);
    const list: Stroke[] = [...((shownMarker?.strokes as Stroke[] | undefined) ?? []), ...scratch];
    paint(ctx, c.width, c.height, list);
    c.toBlob((b) => {
      if (!b) { toast('Kare kaydedilemedi.'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `kare-${fmtTime(el.currentTime).replace(':', '-')}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  };

  const saved = Object.entries(notes);

  if (!src) {
    return (
      <div className="vlab">
        <label
          className={`vlab__drop ${dragOver ? 'vlab__drop--over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files?.[0]); }}
        >
          <Icon name="upload" style={{ width: 34, height: 34 }} />
          <span className="h3">Videonu buraya bırak ya da seç</span>
          <span className="muted">MP4, MOV ya da WebM · Dosya cihazından çıkmaz, sunucuya yüklenmez.</span>
          <span className="btn btn--primary">Video seç</span>
          <input ref={fileInput} type="file" accept="video/*" onChange={(e) => loadFile(e.target.files?.[0])} aria-label="Analiz edilecek video dosyasını seç" />
        </label>
        {error && <p className="note note--warn" role="alert" style={{ marginTop: 16 }}>{error}</p>}
        {saved.length > 0 && <SavedList saved={saved} />}
      </div>
    );
  }

  return (
    <div className="vlab" onKeyDown={onKey}>
      <div className="vlab__bar">
        <p className="mono muted" title={fileInfo?.name}>{fileInfo?.name}</p>
        <div className="vlab__bar-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileInput.current?.click()}>Başka video</button>
          <input ref={fileInput} type="file" accept="video/*" hidden onChange={(e) => loadFile(e.target.files?.[0])} aria-label="Başka bir video seç" />
          <button type="button" className="btn btn--ghost btn--sm" onClick={saveFrame}><Icon name="download" style={{ width: 14, height: 14 }} /> Kareyi PNG kaydet</button>
        </div>
      </div>
      <div className="vlab__main">
        <div>
          <div className="vlab__stage" data-tool={tool}>
            <div className="vlab__box" ref={wrapRef}>
              <video
                ref={videoRef}
                src={src}
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => setDur((e.target as HTMLVideoElement).duration)}
                onTimeUpdate={(e) => setTime((e.target as HTMLVideoElement).currentTime)}
                onSeeked={(e) => setTime((e.target as HTMLVideoElement).currentTime)}
                onPlay={() => { setPlaying(true); setActiveMarker(null); }}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => setError('Bu video tarayıcıda açılamadı. MP4 (H.264) ya da WebM biçimini deneyin.')}
              />
              <canvas
                ref={canvasRef}
                className="vlab__canvas"
                style={{ touchAction: tool === 'none' ? 'auto' : 'none', cursor: tool === 'none' ? 'default' : 'crosshair' }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                aria-label="Çizim katmanı"
              />
            </div>
          </div>
          {error && <p className="note note--warn" role="alert" style={{ marginTop: 12 }}>{error}</p>}

          <div className="vlab__ctrl">
            <div className="vlab__row">
              <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Bir kare geri"><Icon name="step-back" /></button>
              <button type="button" className="icon-btn icon-btn--lg" onClick={toggle} aria-label={playing ? 'Duraklat' : 'Oynat'}><Icon name={playing ? 'pause' : 'play'} /></button>
              <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Bir kare ileri"><Icon name="step-fwd" /></button>
              <span className="mono vlab__time" aria-live="off">{fmtTime(time)} / {fmtTime(dur)}</span>
            </div>
            <input
              type="range"
              className="vlab__seek"
              min={0}
              max={dur || 0}
              step={0.01}
              value={Math.min(time, dur || 0)}
              onChange={(e) => { setActiveMarker(null); seek(Number(e.target.value)); }}
              aria-label="Video konumu"
            />
            <div className="vlab__row vlab__row--wrap">
              <div className="field">
                <span className="field__label">Hız</span>
                <div className="seg" role="group" aria-label="Oynatma hızı">
                  {SPEEDS.map((s) => (
                    <button key={s} type="button" aria-pressed={speed === s} onClick={() => { setSpeed(s); if (v()) v()!.playbackRate = s; }}>{s}×</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="field__label">Kare hızı (adım için)</span>
                <div className="seg" role="group" aria-label="Kare hızı">
                  {FPS_OPTIONS.map((f) => <button key={f} type="button" aria-pressed={fps === f} onClick={() => setFps(f)}>{f}</button>)}
                </div>
              </div>
            </div>
            <p className="field__hint">Klavye: Boşluk oynat/duraklat · ← → bir kare · Shift+← → 10 kare. Kare hızını bilmiyorsan 30 seç; çoğu telefon 30 ya da 60 kare/sn çeker. Adım yaklaşık değerdir.</p>
          </div>

          <div className="vlab__tools" role="group" aria-label="Çizim araçları">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className="chip" aria-pressed={tool === t.id} onClick={() => { draft.current = null; setTool(t.id); }}>{t.name}</button>
            ))}
            <span className="vlab__sw" role="group" aria-label="Renk">
              {COLORS.map((c) => (
                <button key={c.id} type="button" className="vlab__swatch" style={{ background: c.id }} aria-pressed={color === c.id} aria-label={c.name} onClick={() => setColor(c.id)} />
              ))}
            </span>
            <button type="button" className="btn btn--quiet btn--sm" onClick={undo} disabled={scratch.length === 0 && !draft.current}><Icon name="undo" style={{ width: 14, height: 14 }} /> Geri al</button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => { draft.current = null; setScratch([]); }} disabled={scratch.length === 0}>Temizle</button>
          </div>
          {tool === 'angle' && <p className="field__hint">Açı aracı: üç noktaya tıkla (uç · köşe · uç). Köşedeki açı derece olarak yazılır — örneğin diz ya da gövde açısı.</p>}
        </div>

        <aside className="vlab__side">
          <div className="panel">
            <p className="panel__title">Bu ana işaret ekle · {fmtTime(time)}</p>
            <div className="stack" style={{ '--stack': '1rem' } as React.CSSProperties}>
              <div className="field">
                <label htmlFor="vl-tpl">Değerlendirme şablonu</label>
                <select id="vl-tpl" className="select" value={tpl} onChange={(e) => { setTpl(e.target.value as keyof typeof TEMPLATES); setScores({}); }}>
                  {Object.entries(TEMPLATES).map(([id, t]) => <option key={id} value={id}>{t.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="vl-label">Başlık</label>
                <input id="vl-label" className="input" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Örn. İlk dokunuş" />
              </div>
              <div className="field">
                <label htmlFor="vl-note">Not</label>
                <textarea id="vl-note" className="input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ne gördün? Neyi düzeltmelisin?" />
              </div>
              {tplDef.criteria.length > 0 && (
                <fieldset className="vlab__crit">
                  <legend className="field__label">Kriterler (1–5)</legend>
                  {tplDef.criteria.map((c) => (
                    <div key={c} className="vlab__crit-row">
                      <span>{c}</span>
                      <span className="seg seg--tiny" role="group" aria-label={c}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" aria-pressed={scores[c] === n} onClick={() => setScores((s) => ({ ...s, [c]: s[c] === n ? 0 : n }))}>{n}</button>
                        ))}
                      </span>
                    </div>
                  ))}
                </fieldset>
              )}
              <button type="button" className="btn btn--primary" onClick={addMarker}>İşaret ekle{scratch.length ? ` (${scratch.length} çizimle)` : ''} <Icon name="plus" /></button>
            </div>
          </div>

          <div className="panel panel--flat">
            <div className="vlab__mhead">
              <p className="panel__title" style={{ margin: 0 }}>İşaretler ({markers.length})</p>
              {markers.length > 0 && <button type="button" className="btn btn--quiet btn--sm" onClick={exportTxt}>.txt indir</button>}
            </div>
            {markers.length === 0 ? (
              <p className="muted" style={{ marginTop: 10 }}>Henüz işaret yok. Videoyu durdur, çizim yap, işaret ekle.</p>
            ) : (
              <ul className="vlab__markers">
                {markers.map((m) => {
                  const sc = m.scores ? Object.values(m.scores).filter((x) => x > 0) : [];
                  const avg = sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : null;
                  return (
                    <li key={m.id} className={activeMarker === m.id ? 'is-on' : undefined}>
                      <button type="button" className="vlab__mbtn" onClick={() => openMarker(m)}>
                        <span className="mono">{fmtTime(m.t)}</span>
                        <b>{m.label}</b>
                        {avg && <span className="tag">{avg}/5</span>}
                        {Array.isArray(m.strokes) && m.strokes.length > 0 && <span className="tag">çizim</span>}
                      </button>
                      {m.note && <p className="muted">{m.note}</p>}
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => removeMarker(m.id)} aria-label={`${m.label} işaretini sil`}><Icon name="trash" style={{ width: 14, height: 14 }} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="field__hint" style={{ marginTop: 12 }}>Notlar bu tarayıcıda saklanır. Video dosyasının kendisi saklanmaz; aynı dosyayı (aynı ad, boyut ve tarih) tekrar seçersen notların geri gelir.</p>
          </div>
        </aside>
      </div>
      {fileInfo && <VideoAutoAnalysis videoRef={videoRef} src={src} fileKey={fileInfo.key} fileName={fileInfo.name} />}
      {saved.length > 0 && <SavedList saved={saved} current={fileInfo?.key} />}
    </div>
  );
}

function SavedList({ saved, current }: { saved: [string, { name: string; markers: VideoMarker[]; updated: string }][]; current?: string }) {
  return (
    <div style={{ marginTop: 40 }}>
      <p className="eyebrow">Kayıtlı video notların</p>
      <ul className="loglist">
        {saved.map(([key, n]) => (
          <li key={key}>
            <span><b>{n.name}</b>{key === current ? ' · açık' : ''}</span>
            <span className="muted">{n.markers.length} işaret · {n.updated.slice(0, 10)}</span>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => { if (window.confirm('Bu videonun notları silinsin mi?')) deleteVideoNotes(key); }}>Sil</button>
          </li>
        ))}
      </ul>
      <p className="field__hint">Bir videonun notlarını görmek için aynı dosyayı yukarıdan yeniden seç.</p>
    </div>
  );
}
