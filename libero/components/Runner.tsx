'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { finishLog, logProgress, toggleSet } from '@/lib/program-actions';
import type { SessionLog } from '@/lib/program-types';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { fmtDate } from '@/lib/utils';
import { Icon } from './Icon';

/* ── Antrenman yürütücüsü ─────────────────────────────────── */
export function Runner({ logId, onClose }: { logId: string; onClose: () => void }) {
  const log = useStore(useCallback((s: { logs: SessionLog[] }) => s.logs.find((l) => l.id === logId), [logId]));
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState(6);
  const [note, setNote] = useState('');
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => {
      clearInterval(t);
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (!log) return null;
  const p = logProgress(log);
  const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
  const readOnly = log.status !== 'active';
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="runner" role="dialog" aria-modal="true" aria-label={`${log.title} antrenmanı`}>
      <div className="runner__scrim" onClick={onClose} />
      <div className="runner__panel">
        <div className="runner__head">
          <div>
            <p className="eyebrow">{fmtDate(log.date)}</p>
            <h2 className="h2" style={{ marginTop: 8 }}>{log.title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat"><Icon name="close" /></button>
        </div>
        <div className="runner__bar">
          <div className="bar"><span style={{ width: `${pct}%` }} /></div>
          <span className="mono">{p.done}/{p.total} set · %{pct}{!readOnly && ` · ${mm}:${ss}`}</span>
        </div>
        <ul className="runner__items">
          {log.items.map((it) => {
            const done = log.progress[it.key] ?? 0;
            return (
              <li key={it.key} className={done >= it.sets ? 'is-done' : ''}>
                <div className="runner__itemtop">
                  <p className="sess__name">
                    {it.kind === 'ex' ? <Link href={`/fiziksel/${it.ref}/`} target="_blank">{it.name}</Link> : it.kind === 'tech' ? <Link href={`/teknikler/${it.ref}/`} target="_blank">{it.name}</Link> : it.name}
                  </p>
                  <b className="mono">{it.dose}</b>
                </div>
                {it.note && <p className="sess__note">{it.note}</p>}
                <div className="runner__sets" role="group" aria-label={`${it.name} setleri`}>
                  {Array.from({ length: it.sets }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" className="setbtn" aria-pressed={done >= n} disabled={readOnly} onClick={() => toggleSet(log.id, it.key, n)} aria-label={`${n}. set ${done >= n ? 'tamamlandı' : 'tamamla'}`}>
                      {done >= n ? <Icon name="check" /> : n}
                    </button>
                  ))}
                  {it.rest !== '—' && <span className="mono muted runner__rest">dinlenme {it.rest}</span>}
                </div>
              </li>
            );
          })}
        </ul>
        {readOnly ? (
          <div className="note" style={{ marginTop: 20 }}>
            <Icon name="info" />
            <p>{log.status === 'done' ? 'Bu antrenman tamamlandı.' : 'Bu antrenman yarım bırakılmıştı.'}{log.rpe ? ` Zorluk: ${log.rpe}/10.` : ''}{log.note ? ` Not: ${log.note}` : ''}</p>
          </div>
        ) : !finishing ? (
          <div className="levelcard__actions" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--primary" onClick={() => setFinishing(true)}>Antrenmanı bitir</button>
            <button type="button" className="btn btn--ghost" onClick={() => { toast('Kaydedildi: kaldığınız yerden devam edebilirsiniz.'); onClose(); }}>Sonra devam et</button>
          </div>
        ) : (
          <div className="panel" style={{ marginTop: 24 }}>
            <p className="panel__title">Nasıl geçti?</p>
            <div className="grid cols-2" style={{ '--gap': '16px' } as React.CSSProperties}>
              <div className="field">
                <label htmlFor="rn-r">Zorluk (1 çok kolay – 10 çok zor)</label>
                <select id="rn-r" className="select" value={rpe} onChange={(e) => setRpe(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rn-n">Not</label>
                <input id="rn-n" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="İsteğe bağlı" />
              </div>
            </div>
            <div className="levelcard__actions" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn--primary" onClick={() => { finishLog(log.id, p.done >= p.total ? 'done' : 'partial', rpe, note); toast(p.done >= p.total ? 'Antrenman tamamlandı. Tebrikler!' : 'Yarım bırakılan antrenman kaydedildi.'); onClose(); }}>
                {p.done >= p.total ? 'Tamamlandı olarak kaydet' : `Yarım olarak kaydet (${p.done}/${p.total})`}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setFinishing(false)}>Geri</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
