'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EX_BY_ID, EXCAT_NAME, MUSCLE_NAME, type Exercise } from '@/data/exercises';
import { ENV_NAME, EQUIP_NAME } from '@/lib/environments';
import { FOCUS_NAME, alternativesFor } from '@/lib/program';
import { logForSession, logProgress, startSession } from '@/lib/program-actions';
import type { PlannedItem, PlannedSession, Program, SessionLog } from '@/lib/program-types';
import { useMeta, useStore, type AppState } from '@/lib/store';
import { BAND_NAME, BAND_RULES, GENERAL_SAFETY, ageBand } from '@/lib/training';
import { DAY_NAMES } from '@/lib/utils';
import { Icon } from './Icon';
import { Runner } from './Runner';

const selProgram = (s: AppState) => s.program;
const selLogs = (s: AppState) => s.logs;

const FOCUS_GOAL: Record<string, string> = {
  'alt-vucut': 'Bacak ve kalça kuvveti: sprint, sıçrama ve yön değiştirmenin temeli.',
  'ust-vucut': 'Üst vücut ve gövde: top koruma, mücadele ve duruş için denge kuran çalışma.',
  merkez: 'Merkez bölge (karın–bel–kalça): gövdeyi stabil tutma ve sakatlık önleme.',
  'hiz-ceviklik': 'Sürat, çeviklik ve iniş kontrolü: kısa mesafede hızlanma ve yön değiştirme.',
  dayaniklilik: 'Dayanıklılık: maç boyunca tekrarlı koşu kapasitesi.',
  toparlanma: 'Toparlanma: hareketlilik, gevşeme ve hafif çalışma.',
  teknik: 'Teknik çalışma (eski programdan).',
  saha: 'Saha çalışması (eski programdan).',
};

function equipOf(items: PlannedItem[]): string[] {
  const names = new Set<string>();
  for (const it of items) {
    const ex = EX_BY_ID[it.ref];
    if (!ex) continue;
    for (const q of ex.equip) if (q !== 'yok') names.add(EQUIP_NAME[q]);
  }
  return [...names];
}

export function WorkoutPage() {
  const program = useStore(selProgram);
  const logs = useStore(selLogs);
  const { ready } = useMeta();
  const [sid, setSid] = useState<string | null | undefined>(undefined);
  const [runner, setRunner] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setSid(sp.get('oturum'));
  }, []);

  const session = useMemo(() => program?.sessions.find((s) => s.id === sid) ?? null, [program, sid]);

  if (sid === undefined || !ready) return <p className="muted" aria-live="polite">Antrenman yükleniyor…</p>;

  if (!program || !session) {
    return (
      <div className="empty">
        <h3 className="h3">Antrenman bulunamadı</h3>
        <p>Bu bağlantıdaki antrenman programınızda yok. Program yeniden oluşturulduysa eski oturum bağlantıları geçersiz olur.</p>
        <p style={{ marginTop: 16 }}>
          <Link href="/program/" className="btn btn--primary">Programıma dön</Link>
        </p>
      </div>
    );
  }
  return <Detail session={session} program={program} logs={logs} runner={runner} setRunner={setRunner} />;
}

function Detail({
  session,
  program,
  logs,
  runner,
  setRunner,
}: {
  session: PlannedSession;
  program: Program;
  logs: SessionLog[];
  runner: string | null;
  setRunner: (id: string | null) => void;
}) {
  const log = logForSession(logs, session.id, 0);
  const status = log?.status;
  const prog = log ? logProgress(log) : null;
  const band = ageBand(program.input.age);
  const equip = equipOf(session.items);
  const rules = BAND_RULES[band].rules.slice(0, 2);

  return (
    <div className="workout">
      <div className="card card--marks card--pad workout__top">
        <div>
          <p className="eyebrow">{FOCUS_NAME[session.focus]}</p>
          <h2 className="h2" style={{ marginTop: 8 }}>{session.title}</h2>
          <p className="muted" style={{ marginTop: 8, maxWidth: '60ch' }}>{FOCUS_GOAL[session.focus]}</p>
          <div className="tech-meta" style={{ marginTop: 14 }}>
            <span className="tag">{ENV_NAME[session.env]}</span>
            <span className="tag">{session.minutes} dk</span>
            <span className="tag">{session.items.length} hareket</span>
            {session.day !== null && <span className="tag">{DAY_NAMES[session.day]}</span>}
            {status === 'done' && <span className="tag tag--grass">Bu hafta tamamlandı ✓</span>}
            {status === 'partial' && <span className="tag tag--terra">Yarım bırakıldı</span>}
            {status === 'active' && prog && <span className="tag tag--brass">Devam ediyor {prog.done}/{prog.total}</span>}
          </div>
          <p className="field__hint" style={{ marginTop: 12 }}>
            Gereken ekipman: {equip.length ? equip.join(', ') : 'ekipman gerekmez'}.
          </p>
        </div>
        <div className="workout__cta">
          {status === 'active' && log ? (
            <button type="button" className="btn btn--primary" onClick={() => setRunner(log.id)}>Devam et <Icon name="arrow" /></button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => setRunner(startSession(session, program, logs))}>
              {status === 'done' ? 'Tekrar yap' : 'Antrenmana başla'} <Icon name="arrow" />
            </button>
          )}
          <Link href="/program/" className="btn btn--ghost">Programa dön</Link>
        </div>
      </div>

      <div className="note note--warn" style={{ marginTop: 20 }}>
        <Icon name="warn" />
        <div>
          <p><strong>{BAND_NAME[band]} için güvenlik:</strong></p>
          <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: 'disc' }}>
            {rules.map((r) => <li key={r}>{r}</li>)}
            <li>{GENERAL_SAFETY[1]}</li>
            <li>{GENERAL_SAFETY[2]}</li>
          </ul>
        </div>
      </div>

      <ol className="wk-list">
        {session.items.map((it, i) => (
          <ItemCard key={it.key} it={it} n={i + 1} alts={it.kind === 'ex' ? alternativesFor(it.ref, session, program) : []} />
        ))}
      </ol>

      {runner && <Runner logId={runner} onClose={() => setRunner(null)} />}
    </div>
  );
}

function ItemCard({ it, n, alts }: { it: PlannedItem; n: number; alts: Exercise[] }) {
  const ex: Exercise | undefined = it.kind === 'ex' ? EX_BY_ID[it.ref] : undefined;
  return (
    <li className="wk-item" id={`hareket-${n}`}>
      <details open>
        <summary>
          <span className="wk-item__n mono">{String(n).padStart(2, '0')}</span>
          <span className="wk-item__name">{it.name}</span>
          <span className="wk-item__dose mono">{it.dose}{it.rest !== '—' ? ` · dinlenme ${it.rest}` : ''}</span>
        </summary>

        <dl className="kv wk-item__kv">
          <dt>Set / tekrar / süre</dt>
          <dd>{it.dose}</dd>
          <dt>Dinlenme</dt>
          <dd>{it.rest === '—' ? 'Setler arası dinlenme yok (tek parça)' : `Setler arası ${it.rest}`}</dd>
          {ex && (
            <>
              <dt>Hedef kaslar</dt>
              <dd>
                {ex.muscles.map((m) => MUSCLE_NAME[m]).join(', ')}
                {ex.secondary.length > 0 && <span className="muted"> · yardımcı: {ex.secondary.map((m) => MUSCLE_NAME[m]).join(', ')}</span>}
              </dd>
              <dt>Kategori</dt>
              <dd>{EXCAT_NAME[ex.cat]}</dd>
              <dt>Ekipman</dt>
              <dd>{ex.equip.map((q) => EQUIP_NAME[q]).join(', ')}</dd>
            </>
          )}
        </dl>

        {it.note && <p className="sess__note" style={{ marginTop: 10 }}>{it.note}</p>}

        {ex ? (
          <div className="wk-item__body">
            <div>
              <h3 className="h4">Nasıl yapılır?</h3>
              <ol className="steps">{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
            <div>
              <h3 className="h4">Doğru yürütme için</h3>
              <ul className="ticks">{ex.cues.map((s) => <li key={s}>{s}</li>)}</ul>
              {ex.mistakes.length > 0 && (
                <>
                  <h3 className="h4" style={{ marginTop: 18 }}>Sık yapılan hatalar</h3>
                  <ul className="ticks ticks--warn">{ex.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
                </>
              )}
            </div>
            {ex.caution && (
              <div className="note note--warn wk-item__caution">
                <Icon name="warn" />
                <p><strong>Dikkat: </strong>{ex.caution}</p>
              </div>
            )}
            <p className="field__hint wk-item__why">
              <strong>Neden?</strong> {ex.why}
            </p>
            <p className="wk-item__links">
              <Link href={`/fiziksel/${ex.id}/`} className="btn btn--quiet">Egzersiz sayfası</Link>
              {alts.length > 0 && (
                <span className="muted">
                  {' '}Bu oturumda yapılabilecek alternatif:{' '}
                  {alts.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && ', '}
                      <Link href={`/fiziksel/${a.id}/`} className="btn--quiet" style={{ border: 0 }}>{a.name}</Link>
                    </span>
                  ))}
                </span>
              )}
            </p>
          </div>
        ) : it.kind === 'tech' ? (
          <p className="wk-item__links">
            <Link href={`/teknikler/${it.ref}/`} className="btn btn--quiet">Teknik sayfası</Link>
          </p>
        ) : null}
      </details>
    </li>
  );
}
