'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { QUIZ, QUIZ_THEMES, type QuizQuestion, type QuizTheme } from '@/data/quiz';
import { recordQuiz, useStore } from '@/lib/store';
import { POSITIONS, type PositionId } from '@/lib/types';
import { seeded, todayKey } from '@/lib/utils';
import { Icon } from './Icon';
import { SceneView } from './pitch/SceneView';

const selQuiz = (s: { quiz: Record<string, { tries: number; right: number; last: boolean }> }) => s.quiz;
const selPositions = (s: { profile: { positions: PositionId[] } }) => s.profile.positions;

type Phase = 'setup' | 'run' | 'done';

export function QuizRunner() {
  const stats = useStore(selQuiz);
  const myPos = useStore(selPositions);
  const [phase, setPhase] = useState<Phase>('setup');
  const [theme, setTheme] = useState<QuizTheme | ''>('');
  const [pos, setPos] = useState<PositionId | ''>('');
  const [count, setCount] = useState(8);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [list, setList] = useState<QuizQuestion[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ id: string; ok: boolean }[]>([]);

  useEffect(() => {
    if (myPos.length === 1 && !pos) setPos(myPos[0]);
    // yalnızca ilk yüklemede
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPos.length]);

  const pool = useMemo(
    () =>
      QUIZ.filter(
        (q) =>
          (!theme || q.theme === theme) &&
          (!pos || q.pos.includes(pos)) &&
          (!onlyWrong || (stats[q.id] && !stats[q.id].last)),
      ),
    [theme, pos, onlyWrong, stats],
  );

  const answered = Object.keys(stats).length;
  const rightTotal = Object.values(stats).filter((s) => s.last).length;

  const start = () => {
    const seed = Date.now() % 100000;
    const chosen = seeded(pool, seed).slice(0, count > 0 ? count : pool.length);
    setList(chosen);
    setI(0);
    setPicked(null);
    setResults([]);
    setPhase('run');
  };

  if (phase === 'setup') {
    return (
      <div className="quiz">
        <div className="grid cols-2" style={{ '--gap': '28px' } as React.CSSProperties}>
          <div className="panel">
            <p className="panel__title">Test ayarları</p>
            <div className="stack" style={{ '--stack': '1.4rem' } as React.CSSProperties}>
              <div className="field">
                <span className="field__label">Konu</span>
                <div className="chips">
                  <button type="button" className="chip" aria-pressed={!theme} onClick={() => setTheme('')}>Hepsi</button>
                  {QUIZ_THEMES.map((t) => (
                    <button key={t} type="button" className="chip" aria-pressed={theme === t} onClick={() => setTheme(theme === t ? '' : t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="q-pos">Pozisyon</label>
                <select id="q-pos" className="select" value={pos} onChange={(e) => setPos(e.target.value as PositionId | '')}>
                  <option value="">Tüm pozisyonlar</option>
                  {POSITIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <span className="field__label">Soru sayısı</span>
                <div className="seg" role="group" aria-label="Soru sayısı">
                  {[5, 8, 12, 0].map((n) => (
                    <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}>
                      {n === 0 ? 'Hepsi' : n}
                    </button>
                  ))}
                </div>
              </div>
              <label className="check">
                <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
                <span>Yalnızca son denemede yanlış yaptıklarım</span>
              </label>
            </div>
            <p style={{ marginTop: 24 }}>
              <button type="button" className="btn btn--primary" onClick={start} disabled={pool.length === 0}>
                Testi başlat ({Math.min(count || pool.length, pool.length)} soru) <Icon name="arrow" />
              </button>
            </p>
            {pool.length === 0 && <p className="field__hint" style={{ marginTop: 10 }}>Bu filtreyle soru yok; filtreleri gevşetin.</p>}
          </div>

          <div className="panel">
            <p className="panel__title">İlerlemen</p>
            <div className="quiz__stat">
              <p className="num quiz__big">{answered}<span className="muted"> / {QUIZ.length}</span></p>
              <p className="muted">cevaplanan soru</p>
            </div>
            <div className="bar" style={{ margin: '14px 0 22px' }}>
              <span style={{ width: `${(answered / QUIZ.length) * 100}%` }} />
            </div>
            <p>
              Son denemede doğru: <b className="num" style={{ fontSize: '1.4rem', color: 'var(--brass-hi)' }}>{rightTotal}</b>
              <span className="muted"> / {answered || 0}</span>
            </p>
            {answered === 0 && <p className="muted" style={{ marginTop: 10 }}>Henüz test çözmediniz. Sonuçlarınız bu tarayıcıda saklanır.</p>}
            <div className="note" style={{ marginTop: 24 }}>
              <Icon name="info" />
              <p>Her sorudan sonra doğru kararın <strong>saha üzerinde animasyonlu gösterimi</strong> ve her seçeneğin neden doğru ya da yanlış olduğu açıklanır.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const ok = results.filter((r) => r.ok).length;
    const byTheme = new Map<string, { ok: number; n: number }>();
    for (const r of results) {
      const q = QUIZ.find((x) => x.id === r.id)!;
      const e = byTheme.get(q.theme) ?? { ok: 0, n: 0 };
      e.n++;
      if (r.ok) e.ok++;
      byTheme.set(q.theme, e);
    }
    const wrong = results.filter((r) => !r.ok).map((r) => QUIZ.find((x) => x.id === r.id)!);
    return (
      <div className="quiz">
        <div className="panel quiz__done">
          <p className="eyebrow">Sonuç</p>
          <p className="display num" style={{ marginTop: 12 }}>
            {ok}<span className="muted"> / {results.length}</span>
          </p>
          <p className="lead" style={{ marginTop: 12 }}>
            {ok === results.length ? 'Mükemmel! Tüm kararları doğru verdiniz.' : ok >= results.length * 0.6 ? 'Sağlam bir performans. Yanlışlarınıza göz atıp tekrar deneyin.' : 'Bu normal: futbol zekâsı pratikle gelişir. Açıklamaları okuyup tekrar deneyin.'}
          </p>
          <ul className="quiz__themes">
            {[...byTheme.entries()].map(([t, v]) => (
              <li key={t}>
                <span>{t}</span>
                <span className="bar"><span style={{ width: `${(v.ok / v.n) * 100}%` }} /></span>
                <b className="mono">{v.ok}/{v.n}</b>
              </li>
            ))}
          </ul>
          {wrong.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <p className="panel__title">Tekrar etmek isteyebileceğin sorular</p>
              <ul className="ticks ticks--warn">
                {wrong.map((q) => (
                  <li key={q.id}>{q.q.split('.')[0]}.</li>
                ))}
              </ul>
            </div>
          )}
          <div className="levelcard__actions" style={{ marginTop: 28 }}>
            <button type="button" className="btn btn--primary" onClick={start}>Yeni test <Icon name="refresh" /></button>
            <button type="button" className="btn btn--ghost" onClick={() => setPhase('setup')}>Ayarlar</button>
            <Link href="/taktik/" className="btn btn--ghost">Taktik konuları</Link>
          </div>
        </div>
      </div>
    );
  }

  const q = list[i];
  const revealed = picked !== null;
  const correctIdx = q.opts.findIndex((o) => o.ok);

  const choose = (idx: number) => {
    if (revealed) return;
    setPicked(idx);
    const ok = idx === correctIdx;
    recordQuiz(q.id, ok);
    setResults((r) => [...r, { id: q.id, ok }]);
  };

  const next = () => {
    if (i + 1 >= list.length) setPhase('done');
    else {
      setI(i + 1);
      setPicked(null);
    }
  };

  return (
    <div className="quiz">
      <div className="quiz__head">
        <span className="mono">Soru {i + 1} / {list.length}</span>
        <span className="tag tag--brass">{q.theme}</span>
        <div className="bar" style={{ flex: 1 }}>
          <span style={{ width: `${((i + (revealed ? 1 : 0)) / list.length) * 100}%` }} />
        </div>
      </div>
      <div className="quiz__body">
        <div className="quiz__scene">
          <SceneView
            key={q.id + (revealed ? 'r' : 'q')}
            scene={revealed ? q.scene : { ...q.scene, f: [q.scene.f[0]] }}
            title={q.q}
            autoplay={revealed}
            caption={revealed}
            legend={revealed}
            holdMs={2600}
          />
          {!revealed && <p className="field__hint" style={{ textAlign: 'center' }}>Altın renkli oyuncular sizin takımınız; kırmızılar rakip.</p>}
        </div>
        <div className="quiz__qa">
          <h2 className="h3 quiz__q">{q.q}</h2>
          <ul className="quiz__opts" role="radiogroup" aria-label="Seçenekler">
            {q.opts.map((o, idx) => {
              const state = !revealed ? '' : idx === correctIdx ? 'ok' : idx === picked ? 'bad' : 'dim';
              return (
                <li key={idx}>
                  <button type="button" role="radio" aria-checked={picked === idx} className={`quiz__opt ${state ? `quiz__opt--${state}` : ''}`} onClick={() => choose(idx)} disabled={revealed}>
                    <span className="quiz__key mono">{String.fromCharCode(65 + idx)}</span>
                    <span>
                      {o.t}
                      {revealed && (state === 'ok' || state === 'bad' || idx === picked) && <small className="quiz__why">{o.why}</small>}
                      {revealed && state === 'dim' && <small className="quiz__why">{o.why}</small>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {revealed && (
            <div className={`note ${picked === correctIdx ? '' : 'note--warn'}`} style={{ marginTop: 18 }}>
              <Icon name={picked === correctIdx ? 'check' : 'info'} />
              <p>
                <strong>{picked === correctIdx ? 'Doğru karar. ' : 'En iyi karar: ' + String.fromCharCode(65 + correctIdx) + '. '}</strong>
                {q.explain}
              </p>
            </div>
          )}
          {revealed && (
            <p style={{ marginTop: 18 }}>
              <button type="button" className="btn btn--primary" onClick={next}>
                {i + 1 >= list.length ? 'Sonucu gör' : 'Sonraki soru'} <Icon name="arrow" />
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
