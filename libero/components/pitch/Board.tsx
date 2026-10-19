'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fitView, projector, timeline, viewOf, type ViewDef } from '@/lib/scene';
import { update, useStore, type BoardSave } from '@/lib/store';
import { toast } from '@/lib/toast';
import type { Actor, ActorType, ArrowKind, BallState, Frame, Pt, Scene, ViewId, Zone } from '@/lib/types';
import { download, uid } from '@/lib/utils';
import { Icon } from '../Icon';
import { SceneCanvas, clientToPitch } from './SceneCanvas';

type Tool = 'move' | ActorType | 'ball' | 'pass' | 'run' | 'dribble' | 'zfree' | 'zdanger' | 'ztarget' | 'erase';
type ViewKey = 'full' | 'half' | 'box' | 'mid' | 'defend' | 'custom';

const START: Scene = {
  v: 'full',
  a: [
    { id: 'A1', t: 'a', x: 44, y: 34, l: '1' },
    { id: 'A2', t: 'a', x: 56, y: 18, l: '2' },
    { id: 'A3', t: 'a', x: 56, y: 50, l: '3' },
    { id: 'B1', t: 'b', x: 64, y: 34, l: '1' },
    { id: 'B2', t: 'b', x: 72, y: 24, l: '2' },
  ],
  f: [{ n: 'Başlangıç: A1 topla; B1 ve B2 savunmada.', b: 'A1' }],
};

const TOOLS: { id: Tool; label: string; icon?: string; txt?: string }[] = [
  { id: 'move', label: 'Seç ve taşı', icon: 'arrow-up-right' },
  { id: 'a', label: 'Takım oyuncusu ekle', txt: 'A' },
  { id: 'b', label: 'Rakip oyuncu ekle', txt: 'R' },
  { id: 'k', label: 'Kaleci ekle', txt: 'K' },
  { id: 'c', label: 'Koni ekle', txt: '▲' },
  { id: 'm', label: 'Hedef işareti ekle', txt: '◎' },
  { id: 'ball', label: 'Topu koy', icon: 'ball' },
  { id: 'pass', label: 'Pas oku çiz', txt: '→' },
  { id: 'run', label: 'Koşu oku çiz', txt: '⇢' },
  { id: 'dribble', label: 'Top sürme oku çiz', txt: '∿' },
  { id: 'zfree', label: 'Boş alan işaretle', txt: '▢' },
  { id: 'zdanger', label: 'Tehlikeli alan işaretle', txt: '▨' },
  { id: 'erase', label: 'Oyuncu sil', txt: '⌫' },
];

const VIEWS: { id: ViewKey; label: string }[] = [
  { id: 'full', label: 'Tüm saha' },
  { id: 'half', label: 'Hücum yarısı' },
  { id: 'box', label: 'Ceza sahası' },
  { id: 'mid', label: 'Orta alan' },
  { id: 'defend', label: 'Savunma yarısı' },
  { id: 'custom', label: 'Sahneye sığdır' },
];

const SPEEDS = { yavas: 3600, normal: 2500, hizli: 1600 } as const;
const deep = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const clampPt = ([x, y]: Pt): Pt => [Math.max(-3, Math.min(108, x)), Math.max(-3, Math.min(71, y))];
const round1 = (n: number) => Math.round(n * 10) / 10;

function nextId(scene: Scene, t: ActorType): { id: string; l: string } {
  const prefix = t.toUpperCase();
  let n = 1;
  while (scene.a.some((a) => a.id === `${prefix}${n}`)) n++;
  return { id: `${prefix}${n}`, l: t === 'k' ? 'K' : t === 'c' || t === 'm' ? '' : String(n) };
}

export function Board() {
  const saved = useStore(useCallback((s: { board: BoardSave[] }) => s.board, []));
  const [scene, setSceneRaw] = useState<Scene>(START);
  const [past, setPast] = useState<Scene[]>([]);
  const [future, setFuture] = useState<Scene[]>([]);
  const [cur, setCur] = useState(0);
  const [tool, setTool] = useState<Tool>('move');
  const [selected, setSelected] = useState<string | null>(null);
  const [viewKey, setViewKey] = useState<ViewKey>('full');
  const [custom, setCustom] = useState<ViewDef | null>(null);
  const [vertical, setVertical] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>('normal');
  const [history, setHistory] = useState(false);
  const [instant, setInstant] = useState(false);
  const [drag, setDrag] = useState<{ kind: 'actor' | 'ball'; id?: string } | null>(null);
  const [drawing, setDrawing] = useState<{ kind: ArrowKind; from: Pt; to: Pt } | null>(null);
  const [zdraw, setZdraw] = useState<{ x: number; y: number; w: number; h: number; k: 'free' | 'danger'; ox: number; oy: number } | null>(null);
  const [name, setName] = useState('');
  const [presets, setPresets] = useState<{ g: string; id: string; name: string; scene: Scene }[] | null>(null);
  const [presetGroup, setPresetGroup] = useState('Taktik');
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  // dar ekranda varsayılan dikey
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      const w = es[0]?.contentRect.width ?? 999;
      if (w < 560) setVertical(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tl = useMemo(() => timeline(scene), [scene]);
  const frame = Math.min(cur, scene.f.length - 1);

  const view: ViewDef = useMemo(() => {
    if (viewKey === 'custom' && custom) return { ...custom, vertical };
    const k = (viewKey === 'custom' ? 'full' : viewKey) as ViewId;
    const v = viewOf({ v: k }, vertical);
    return { ...v, unit: Math.max(v.unit, 1.9) };
  }, [viewKey, custom, vertical]);

  const setScene = (next: Scene, push = true) => {
    if (push) {
      setPast((p) => [...p.slice(-59), scene]);
      setFuture([]);
    }
    setSceneRaw(next);
  };
  const undo = () => {
    setPast((p) => {
      if (!p.length) return p;
      setFuture((f) => [scene, ...f]);
      setSceneRaw(p[p.length - 1]);
      return p.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      setPast((p) => [...p, scene]);
      setSceneRaw(f[0]);
      return f.slice(1);
    });
  };

  const editFrame = (fn: (f: Frame, i: number, next: Scene) => void, push = true) => {
    const next = deep(scene);
    fn(next.f[frame], frame, next);
    setScene(next, push);
  };

  // ── oynatma ─────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const n = scene.f.length;
    const last = frame >= n - 1;
    const t = setTimeout(
      () => {
        if (last) {
          setInstant(true);
          setCur(0);
          requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
        } else setCur(frame + 1);
      },
      last ? SPEEDS[speed] + 500 : SPEEDS[speed],
    );
    return () => clearTimeout(t);
  }, [playing, frame, scene.f.length, speed]);

  // ── klavye ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (selected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        removeActor(selected);
      } else if (selected && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = e.shiftKey ? 2 : 0.5;
        const up = e.key === 'ArrowUp';
        const down = e.key === 'ArrowDown';
        const left = e.key === 'ArrowLeft';
        const right = e.key === 'ArrowRight';
        // dikeyde yukarı = hücum yönü (x+); yatayda sağ = hücum yönü
        const dx = vertical ? (up ? d : down ? -d : 0) : right ? d : left ? -d : 0;
        const dy = vertical ? (left ? -d : right ? d : 0) : down ? d : up ? -d : 0;
        const p = tl[frame].pos[selected];
        if (p) moveActor(selected, clampPt([p[0] + dx, p[1] + dy]), true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── değişiklik işlemleri ────────────────────────────────
  function moveActor(id: string, pt: Pt, push: boolean) {
    const next = deep(scene);
    const p = clampPt([round1(pt[0]), round1(pt[1])]);
    if (frame === 0) {
      const a = next.a.find((x) => x.id === id);
      if (a) {
        a.x = p[0];
        a.y = p[1];
      }
      if (next.f[0].m) delete next.f[0].m[id];
    } else {
      next.f[frame].m = { ...(next.f[frame].m ?? {}), [id]: p };
    }
    setScene(next, push);
  }

  function setBall(b: BallState) {
    editFrame((f) => {
      f.b = b;
    });
  }

  function removeActor(id: string) {
    const next = deep(scene);
    const a = next.a.find((x) => x.id === id);
    next.a = next.a.filter((x) => x.id !== id);
    next.f.forEach((f, i) => {
      if (f.m) delete f.m[id];
      if (f.b === id) f.b = i === 0 && a ? [a.x, a.y] : undefined;
    });
    setScene(next);
    setSelected(null);
  }

  function nearestActor(pt: Pt, types: ActorType[] = ['a', 'b', 'k']): string | null {
    let best: string | null = null;
    let bd = view.unit * 2.2;
    for (const a of scene.a) {
      if (!types.includes(a.t)) continue;
      const p = tl[frame].pos[a.id] ?? [a.x, a.y];
      const d = Math.hypot(p[0] - pt[0], p[1] - pt[1]);
      if (d < bd) {
        bd = d;
        best = a.id;
      }
    }
    return best;
  }

  const pitchPt = (e: React.PointerEvent): Pt => clampPt(clientToPitch(svgRef.current!, e, view));

  // ── işaretçi olayları ───────────────────────────────────
  const onActorDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (tool === 'erase') return removeActor(id);
    if (tool !== 'move') {
      // çizim araçlarında oyuncu üstünden başlayan çizim
      return startBg(e);
    }
    setSelected(id);
    setPast((p) => [...p.slice(-59), scene]);
    setFuture([]);
    setDrag({ kind: 'actor', id });
    (svgRef.current as SVGSVGElement).setPointerCapture(e.pointerId);
  };
  const onBallDown = (e: React.PointerEvent) => {
    if (tool !== 'move') return;
    e.stopPropagation();
    setPast((p) => [...p.slice(-59), scene]);
    setFuture([]);
    setDrag({ kind: 'ball' });
    (svgRef.current as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  function startBg(e: React.PointerEvent) {
    const pt = pitchPt(e);
    if (tool === 'move') {
      setSelected(null);
      return;
    }
    if (tool === 'a' || tool === 'b' || tool === 'k' || tool === 'c' || tool === 'm') {
      const next = deep(scene);
      const { id, l } = nextId(next, tool);
      const actor: Actor = { id, t: tool, x: round1(pt[0]), y: round1(pt[1]), ...(l ? { l } : {}) };
      if (frame === 0) next.a.push(actor);
      else {
        next.a.push({ ...actor, x: actor.x, y: actor.y });
      }
      setScene(next);
      setSelected(id);
      setTool('move');
      return;
    }
    if (tool === 'ball') {
      const holder = nearestActor(pt);
      setBall(holder ?? [round1(pt[0]), round1(pt[1])]);
      setTool('move');
      return;
    }
    if (tool === 'pass' || tool === 'run' || tool === 'dribble') {
      setDrawing({ kind: tool, from: pt, to: pt });
      (svgRef.current as SVGSVGElement).setPointerCapture(e.pointerId);
      return;
    }
    if (tool === 'zfree' || tool === 'zdanger') {
      setZdraw({ x: pt[0], y: pt[1], w: 0, h: 0, k: tool === 'zfree' ? 'free' : 'danger', ox: pt[0], oy: pt[1] });
      (svgRef.current as SVGSVGElement).setPointerCapture(e.pointerId);
    }
  }

  const onMove = (e: React.PointerEvent) => {
    if (drag?.kind === 'actor' && drag.id) {
      moveActor(drag.id, pitchPt(e), false);
    } else if (drag?.kind === 'ball') {
      const pt = pitchPt(e);
      const holder = nearestActor(pt);
      const next = deep(scene);
      next.f[frame].b = holder ?? [round1(pt[0]), round1(pt[1])];
      setSceneRaw(next);
    } else if (drawing) {
      setDrawing({ ...drawing, to: pitchPt(e) });
    } else if (zdraw) {
      const pt = pitchPt(e);
      setZdraw({ ...zdraw, x: Math.min(zdraw.ox, pt[0]), y: Math.min(zdraw.oy, pt[1]), w: Math.abs(pt[0] - zdraw.ox), h: Math.abs(pt[1] - zdraw.oy) });
    }
  };

  const onUp = () => {
    if (drag) setDrag(null);
    if (drawing) {
      const d = Math.hypot(drawing.to[0] - drawing.from[0], drawing.to[1] - drawing.from[1]);
      if (d > 2) {
        editFrame((f) => {
          f.o = { ...(f.o ?? {}), arr: [...(f.o?.arr ?? []), { k: drawing.kind, from: [round1(drawing.from[0]), round1(drawing.from[1])], to: [round1(drawing.to[0]), round1(drawing.to[1])] }] };
        });
      }
      setDrawing(null);
    }
    if (zdraw) {
      if (zdraw.w > 2 && zdraw.h > 2) {
        const z: Zone = { x: round1(zdraw.x), y: round1(zdraw.y), w: round1(zdraw.w), h: round1(zdraw.h), k: zdraw.k, l: zdraw.k === 'free' ? 'boş alan' : 'tehlike' };
        editFrame((f) => {
          f.o = { ...(f.o ?? {}), z: [...tl[frame].zones, z] };
        });
      }
      setZdraw(null);
    }
  };

  // ── adım işlemleri ──────────────────────────────────────
  const addFrame = (copy: boolean) => {
    const next = deep(scene);
    const f: Frame = copy ? deep(next.f[frame]) : { n: `Adım ${next.f.length + 1}` };
    if (copy) {
      f.n = `Adım ${next.f.length + 1}`;
      // hareketler kopyada tekrar edilmesin: mevcut konumlar zaten taşınır
      delete f.m;
      if (f.o) delete f.o.arr;
      delete f.b;
    }
    next.f.splice(frame + 1, 0, f);
    setScene(next);
    setCur(frame + 1);
  };
  const delFrame = () => {
    if (scene.f.length < 2) return;
    // silinen karedeki hareketleri bir sonraki kareye aktar
    const next = deep(scene);
    const removed = next.f[frame];
    next.f.splice(frame, 1);
    if (frame === 0) {
      // kare 0 silinirse bir sonraki kare yeni başlangıç olur
      const pos = tl[1]?.pos;
      if (pos) next.a.forEach((a) => ([a.x, a.y] = pos[a.id] ?? [a.x, a.y]));
      const b1 = tl[1]?.ball;
      next.f[0].b = b1 ? (b1.holder ?? b1.pt) : removed.b;
      delete next.f[0].m;
    }
    setScene(next);
    setCur(Math.max(0, frame - (frame > 0 ? 1 : 0)));
  };

  // ── kayıt ve dosya ──────────────────────────────────────
  const save = () => {
    const nm = name.trim() || `Tahta ${saved.length + 1}`;
    const entry: BoardSave = { id: uid(), name: nm, at: new Date().toISOString(), scene: deep(scene) };
    update((s) => ({ ...s, board: [entry, ...s.board].slice(0, 30) }));
    setName('');
    toast(`“${nm}” kaydedildi (bu tarayıcıda).`);
  };
  const loadSaved = (b: BoardSave) => {
    const s = b.scene as Scene;
    if (!s || !Array.isArray(s.a) || !Array.isArray(s.f) || s.f.length === 0) return toast('Kayıt okunamadı.');
    setScene(s);
    setCur(0);
    setSelected(null);
    toast(`“${b.name}” açıldı.`);
  };
  const exportJson = () => download('libero-taktik-tahtasi.json', JSON.stringify({ app: 'libero-board', scene }, null, 2));
  const importJson = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result));
        const s = j.scene as Scene;
        if (!s || !Array.isArray(s.a) || !Array.isArray(s.f) || s.f.length === 0) throw new Error('bad');
        setScene(s);
        setCur(0);
        toast('Tahta içe aktarıldı.');
      } catch {
        toast('Dosya geçerli bir Libero tahtası değil.');
      }
    };
    r.readAsText(f);
  };
  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const cs = getComputedStyle(document.documentElement);
    let src = new XMLSerializer().serializeToString(svg);
    src = src.replace(/var\((--[a-z0-9-]+)\)/g, (_, v) => cs.getPropertyValue(v).trim() || '#fff');
    src = src.replace('<defs>', '<defs><style>.sc-lbl{font-family:monospace;font-weight:700}.sc-note,.sc-zone__t{font-family:monospace;text-transform:uppercase;fill:#cfcbbd}</style>');
    const vb = svg.viewBox.baseVal;
    const scale = 1400 / vb.width;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(vb.width * scale);
      c.height = Math.round(vb.height * scale);
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => {
        if (!b) return toast('PNG oluşturulamadı.');
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u;
        a.download = 'libero-taktik-tahtasi.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(u), 1500);
      }, 'image/png');
    };
    img.onerror = () => toast('PNG oluşturulamadı.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  };

  const loadPresets = async () => {
    if (presets) return;
    try {
      const r = await fetch('/scenes.json');
      setPresets(await r.json());
    } catch {
      toast('Hazır sahneler yüklenemedi.');
    }
  };

  const applyPreset = (p: { name: string; scene: Scene }) => {
    const s = deep(p.scene);
    s.v = 'full';
    setScene(s);
    setCur(0);
    setSelected(null);
    const fit = fitView(s, timeline(s), vertical);
    setCustom({ ...fit, unit: Math.max(fit.unit, 1.6) });
    setViewKey('custom');
    toast(`“${p.name}” tahtaya yüklendi. Oyuncuları sürükleyip kendi senaryonuzu kurun.`);
  };

  const selActor = scene.a.find((a) => a.id === selected);
  const curNote = scene.f[frame].n;
  const pr = projector(view);
  void pr;

  return (
    <div className="board">
      <div className="board__tools" role="toolbar" aria-label="Taktik tahtası araçları">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" className={`tool ${tool === t.id ? 'tool--on' : ''}`} aria-pressed={tool === t.id} title={t.label} aria-label={t.label} onClick={() => setTool(t.id)} data-kind={t.id}>
            {t.icon ? <Icon name={t.icon} /> : <span className="tool__txt">{t.txt}</span>}
          </button>
        ))}
        <span className="board__sep" aria-hidden="true" />
        <button type="button" className="tool" title="Geri al (Ctrl Z)" aria-label="Geri al" onClick={undo} disabled={!past.length}><Icon name="undo" /></button>
        <button type="button" className="tool" title="Yinele" aria-label="Yinele" onClick={redo} disabled={!future.length}><Icon name="redo" /></button>
        <button
          type="button"
          className="tool"
          title="Bu adımdaki çizimleri temizle"
          aria-label="Bu adımdaki çizimleri temizle"
          onClick={() => editFrame((f) => { if (f.o) { delete f.o.arr; f.o.z = []; } })}
        >
          <Icon name="close" />
        </button>
        <button
          type="button"
          className="tool"
          title="Tahtayı sıfırla"
          aria-label="Tahtayı sıfırla"
          onClick={() => { if (window.confirm('Tahtadaki her şey silinsin mi?')) { setScene({ v: 'full', a: [], f: [{ n: 'Boş tahta' }] }); setCur(0); setSelected(null); } }}
        >
          <Icon name="trash" />
        </button>
      </div>

      <div className="board__main">
        <div className="board__stage" ref={wrapRef}>
          <div className="scene__stage board__canvas" data-tool={tool}>
            <SceneCanvas
              ref={svgRef}
              scene={scene}
              tl={tl}
              frame={frame}
              view={view}
              history={history}
              instant={instant || !!drag}
              durMs={Math.round(SPEEDS[speed] * 0.55)}
              label={`Taktik tahtası. Adım ${frame + 1}/${scene.f.length}: ${curNote}`}
              selected={selected}
              editable
              onActorDown={onActorDown}
              onBallDown={onBallDown}
              onBgDown={startBg}
              onMove={onMove}
              onUp={onUp}
              drawing={drawing}
              drawZone={zdraw ? { x: zdraw.x, y: zdraw.y, w: zdraw.w, h: zdraw.h, k: zdraw.k } : null}
            />
          </div>
          <div className="board__transport">
            <button type="button" className="icon-btn" onClick={() => setCur(Math.max(0, frame - 1))} disabled={frame === 0} aria-label="Önceki adım"><Icon name="step-back" /></button>
            <button type="button" className="icon-btn icon-btn--active" onClick={() => { setPlaying((p) => !p); if (!playing && frame >= scene.f.length - 1) setCur(0); }} aria-label={playing ? 'Duraklat' : 'Oynat'}>
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
            <button type="button" className="icon-btn" onClick={() => setCur(Math.min(scene.f.length - 1, frame + 1))} disabled={frame >= scene.f.length - 1} aria-label="Sonraki adım"><Icon name="step-fwd" /></button>
            <div className="seg" role="group" aria-label="Oynatma hızı">
              {(['yavas', 'normal', 'hizli'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={speed === k} onClick={() => setSpeed(k)}>{k === 'yavas' ? 'Yavaş' : k === 'normal' ? 'Normal' : 'Hızlı'}</button>
              ))}
            </div>
            <span className="mono muted" style={{ marginLeft: 'auto' }}>Adım {frame + 1} / {scene.f.length}</span>
          </div>
          <p className="board__hint">
            {tool === 'move' && 'Oyuncuyu ya da topu sürükleyin. Yeni bir adım ekleyip oyuncuları yeni yerlerine taşıdığınızda pas, koşu ve çalım okları kendiliğinden çizilir.'}
            {(tool === 'a' || tool === 'b' || tool === 'k' || tool === 'c' || tool === 'm') && 'Sahaya dokunarak yerleştirin.'}
            {tool === 'ball' && 'Topun yerini seçmek için sahaya dokunun (oyuncunun yanına dokunursanız top onda olur).'}
            {(tool === 'pass' || tool === 'run' || tool === 'dribble') && 'Okun başlangıcından bitişine sürükleyin.'}
            {(tool === 'zfree' || tool === 'zdanger') && 'Alanı işaretlemek için sürükleyin.'}
            {tool === 'erase' && 'Silmek istediğiniz oyuncuya dokunun.'}
          </p>
        </div>

        <aside className="board__side">
          <section className="panel">
            <p className="panel__title">Adımlar</p>
            <ol className="frames">
              {scene.f.map((f, i) => (
                <li key={i}>
                  <button type="button" className={`frames__btn ${i === frame ? 'is-on' : ''}`} onClick={() => { setPlaying(false); setCur(i); }}>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{f.n || 'Adım ' + (i + 1)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="field" style={{ marginTop: 12 }}>
              <label htmlFor="b-note">Bu adımın açıklaması</label>
              <input id="b-note" className="input" value={curNote} onChange={(e) => editFrame((f) => { f.n = e.target.value; }, false)} placeholder="Örn. A, B’ye pas verir" />
            </div>
            <div className="levelcard__actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => addFrame(true)}><Icon name="plus" /> Adım ekle</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={delFrame} disabled={scene.f.length < 2}><Icon name="trash" /> Adımı sil</button>
            </div>
          </section>

          {selActor && (
            <section className="panel">
              <p className="panel__title">Seçili: {selActor.t === 'a' ? 'Takım' : selActor.t === 'b' ? 'Rakip' : selActor.t === 'k' ? 'Kaleci' : selActor.t === 'c' ? 'Koni' : 'İşaret'}</p>
              <div className="field">
                <label htmlFor="b-lbl">Etiket (en çok 3 karakter)</label>
                <input id="b-lbl" className="input" maxLength={3} value={selActor.l ?? ''} onChange={(e) => { const next = deep(scene); const a = next.a.find((x) => x.id === selActor.id)!; a.l = e.target.value; setScene(next, false); }} />
              </div>
              <div className="levelcard__actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn--danger btn--sm" onClick={() => removeActor(selActor.id)}><Icon name="trash" /> Sil</button>
              </div>
              <p className="field__hint" style={{ marginTop: 8 }}>Ok tuşlarıyla küçük adımlarla (Shift: büyük) hareket ettirebilirsiniz.</p>
            </section>
          )}

          <section className="panel">
            <p className="panel__title">Görünüm</p>
            <div className="chips" role="group" aria-label="Saha görünümü">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="chip"
                  aria-pressed={viewKey === v.id}
                  onClick={() => {
                    if (v.id === 'custom') {
                      const fit = fitView(scene, tl, vertical);
                      setCustom({ ...fit, unit: Math.max(fit.unit, 1.6) });
                    }
                    setViewKey(v.id);
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="levelcard__actions" style={{ marginTop: 14 }}>
              <div className="seg" role="group" aria-label="Yön">
                <button type="button" aria-pressed={vertical} onClick={() => setVertical(true)}>Dikey</button>
                <button type="button" aria-pressed={!vertical} onClick={() => setVertical(false)}>Yatay</button>
              </div>
              <label className="check">
                <input type="checkbox" checked={history} onChange={(e) => setHistory(e.target.checked)} />
                <span>Önceki okları soluk göster</span>
              </label>
            </div>
          </section>

          <section className="panel">
            <p className="panel__title">Hazır sahneler</p>
            <div className="field">
              <label htmlFor="b-pg">Tür</label>
              <select id="b-pg" className="select" value={presetGroup} onFocus={loadPresets} onChange={(e) => { setPresetGroup(e.target.value); loadPresets(); }}>
                {['Taktik', 'Pozisyon', 'Teknik'].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="b-ps">Sahne</label>
              <select
                id="b-ps"
                className="select"
                defaultValue=""
                onFocus={loadPresets}
                onChange={(e) => {
                  const p = presets?.find((x) => x.g === presetGroup && x.id === e.target.value);
                  if (p) applyPreset(p);
                  e.target.value = '';
                }}
              >
                <option value="">{presets ? 'Bir sahne seçin…' : 'Yüklemek için dokunun'}</option>
                {presets?.filter((p) => p.g === presetGroup).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </section>

          <section className="panel">
            <p className="panel__title">Kaydet ve paylaş</p>
            <div className="field">
              <label htmlFor="b-name">Tahta adı</label>
              <input id="b-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Korner planı" />
            </div>
            <div className="levelcard__actions" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn--primary btn--sm" onClick={save}>Kaydet</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={exportPng}><Icon name="download" /> PNG</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={exportJson}><Icon name="download" /> JSON</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => importRef.current?.click()}><Icon name="upload" /> İçe aktar</button>
              <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
            </div>
            {saved.length > 0 && (
              <ul className="saved">
                {saved.map((b) => (
                  <li key={b.id}>
                    <button type="button" className="saved__name" onClick={() => loadSaved(b)}>{b.name}</button>
                    <span className="mono muted">{new Date(b.at).toLocaleDateString('tr-TR')}</span>
                    <button type="button" className="icon-btn" style={{ width: 30, height: 30 }} aria-label={`${b.name} kaydını sil`} onClick={() => update((s) => ({ ...s, board: s.board.filter((x) => x.id !== b.id) }))}><Icon name="close" /></button>
                  </li>
                ))}
              </ul>
            )}
            <p className="field__hint" style={{ marginTop: 10 }}>Kayıtlar yalnızca bu tarayıcıda saklanır. Başka cihaza taşımak için JSON olarak dışa aktarın.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
