'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { QuizQuestion } from '@/data/quiz';
import { logProgress } from '@/lib/program-actions';
import type { SessionLog } from '@/lib/program-types';
import { recordQuiz, setProfile, useMeta, useStore } from '@/lib/store';
import { LEVEL_HINTS, type Level } from '@/lib/types';
import { fmtShort } from '@/lib/utils';
import { dailyIndex } from '@/lib/daily';
import { Icon } from './Icon';
import { SceneView } from './pitch/SceneView';
import { StarRating } from './StarRating';

const selLevel = (s: { profile: { level: Level } }) => s.profile.level;
const selLogs = (s: { logs: SessionLog[] }) => s.logs;
const selVisit = (s: { lastVisit: { path: string; title: string; at: string } | null }) => s.lastVisit;
const selProgram = (s: { program: unknown }) => !!s.program;

export function HomeLevel() {
  const level = useStore(selLevel);
  return (
    <div className="home-level">
      <p className="mono muted">Genel yetenek seviyen</p>
      <StarRating value={level} onChange={(v) => setProfile({ level: v })} size="lg" label="Genel yetenek seviyeniz" />
      <p className="muted" style={{ fontSize: '.9rem' }}>{LEVEL_HINTS[level]}. Teknikler ve antrenmanlar buna göre öne çıkar.</p>
    </div>
  );
}

export function ContinueCard() {
  const logs = useStore(selLogs);
  const visit = useStore(selVisit);
  const hasProgram = useStore(selProgram);
  const { ready } = useMeta();
  const active = logs.filter((l) => l.status === 'active').sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];
  if (!ready) return <div className="continue continue--empty" aria-hidden="true" />;

  if (active) {
    const p = logProgress(active);
    return (
      <Link href="/program/" className="card continue">
        <span className="mono muted">Yarım kalan antrenman</span>
        <span className="continue__t">{active.title}</span>
        <span className="bar"><span style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} /></span>
        <span className="continue__go mono">{p.done}/{p.total} set · Devam et <Icon name="arrow" /></span>
      </Link>
    );
  }
  if (visit) {
    return (
      <Link href={visit.path} className="card continue">
        <span className="mono muted">Kaldığın yerden devam et · {fmtShort(visit.at.slice(0, 10))}</span>
        <span className="continue__t">{visit.title}</span>
        <span className="continue__go mono">Aç <Icon name="arrow" /></span>
      </Link>
    );
  }
  return (
    <Link href={hasProgram ? '/program/' : '/teknikler/'} className="card continue">
      <span className="mono muted">Başlamak için</span>
      <span className="continue__t">{hasProgram ? 'Bu haftanın antrenmanı hazır' : 'İlk tekniğini seç'}</span>
      <span className="continue__go mono">{hasProgram ? 'Programa git' : 'Kütüphaneyi aç'} <Icon name="arrow" /></span>
    </Link>
  );
}

export function DailyQuiz({ pool }: { pool: QuizQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setIdx(dailyIndex(pool.length)), [pool.length]);
  const q = pool[idx];
  const ok = q.opts.findIndex((o) => o.ok);
  const revealed = picked !== null;
  return (
    <div className="dailyq">
      <div>
        <SceneView
          key={revealed ? 'r' : 'q'}
          scene={revealed ? q.scene : { ...q.scene, f: [q.scene.f[0]] }}
          title={q.q}
          autoplay={revealed}
          caption={revealed}
          legend={false}
          holdMs={2400}
        />
      </div>
      <div>
        <p className="eyebrow">{q.theme} · günün sorusu</p>
        <h3 className="h3" style={{ margin: '14px 0 18px', lineHeight: 1.3 }}>{q.q}</h3>
        <ul className="quiz__opts" role="radiogroup" aria-label="Seçenekler">
          {q.opts.map((o, i) => {
            const state = !revealed ? '' : i === ok ? 'ok' : i === picked ? 'bad' : 'dim';
            return (
              <li key={i}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={picked === i}
                  disabled={revealed}
                  className={`quiz__opt ${state ? `quiz__opt--${state}` : ''}`}
                  onClick={() => {
                    setPicked(i);
                    recordQuiz(q.id, i === ok);
                  }}
                >
                  <span className="quiz__key mono">{String.fromCharCode(65 + i)}</span>
                  <span>
                    {o.t}
                    {revealed && (state === 'ok' || i === picked) && <small className="quiz__why">{o.why}</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {revealed && (
          <p className="muted" style={{ marginTop: 16 }}>
            {q.explain}{' '}
            <Link href="/taktik/test/" className="btn btn--quiet">Daha fazla soru</Link>
          </p>
        )}
      </div>
    </div>
  );
}
