'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { EX_BY_ID } from '@/data/exercises';
import { FOCUS_NAME, GOALS, generateProgram } from '@/lib/program';
import { ENV_NAME, ENV_ORDER, EQUIP_NAME, type EquipByEnv } from '@/lib/environments';
import { EquipPicker } from './EquipPicker';
import type { PlannedSession, Program, SessionFocus, SessionLog } from '@/lib/program-types';
import {
  addManualLog,
  assignDay,
  clearProgram,
  deleteLog,
  logForSession,
  logMinutes,
  logProgress,
  removeItem,
  saveProgram,
  startSession,
  swapItem,
  weekRange,
} from '@/lib/program-actions';
import { setProfile, useStore, type EnvId, type Goal } from '@/lib/store';
import { toast } from '@/lib/toast';
import { BAND_NAME, BAND_RULES, GENERAL_SAFETY, ageBand } from '@/lib/training';
import { POSITIONS, type Level, type PositionId } from '@/lib/types';
import { DAY_NAMES, DAY_SHORT, addDays, fmtDate, fmtShort, todayKey } from '@/lib/utils';
import { Icon } from './Icon';
import { Runner } from './Runner';
import { StarRating } from './StarRating';

const selProfile = (s: { profile: import('@/lib/store').Profile }) => s.profile;
const selProgram = (s: { program: Program | null }) => s.program;
const selLogs = (s: { logs: SessionLog[] }) => s.logs;

const ENVS: { id: EnvId; name: string }[] = ENV_ORDER.map((id) => ({ id, name: ENV_NAME[id] }));

type Tab = 'hafta' | 'oturumlar' | 'gecmis' | 'ayar';

export function ProgramApp() {
  const profile = useStore(selProfile);
  const program = useStore(selProgram);
  const logs = useStore(selLogs);
  const [tab, setTab] = useState<Tab>('hafta');
  const [runner, setRunner] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // ?pozisyon= bağlantısı
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('yeni') === '1') setShowWizard(true);
  }, []);

  if (!program || showWizard) {
    return (
      <Wizard
        key={showWizard ? 'edit' : 'new'}
        initial={profile}
        hasProgram={!!program}
        onCancel={() => setShowWizard(false)}
        onDone={() => {
          setShowWizard(false);
          setTab('hafta');
        }}
      />
    );
  }

  const active = logs.filter((l) => l.status === 'active').sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0];

  return (
    <div className="prog">
      {active && (
        <div className="card card--marks card--pad prog__resume">
          <div>
            <p className="eyebrow">Yarım kalan çalışma</p>
            <p className="h3" style={{ marginTop: 8 }}>{active.title}</p>
            <p className="muted">
              {fmtDate(active.date)} · {logProgress(active).done}/{logProgress(active).total} set tamamlandı
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => setRunner(active.id)}>
            Kaldığın yerden devam et <Icon name="arrow" />
          </button>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Program bölümleri">
        {(
          [
            ['hafta', 'Bu hafta'],
            ['oturumlar', 'Oturumlar'],
            ['gecmis', 'Geçmiş'],
            ['ayar', 'Program ayarları'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ paddingTop: 28 }}>
        {tab === 'hafta' && <WeekView program={program} logs={logs} onStart={(s) => setRunner(startSession(s, program, logs))} onResume={setRunner} />}
        {tab === 'oturumlar' && <SessionList program={program} profile={profile} />}
        {tab === 'gecmis' && <History logs={logs} onOpen={setRunner} />}
        {tab === 'ayar' && (
          <Settings
            program={program}
            onRegenerate={() => setShowWizard(true)}
            onClear={() => {
              if (window.confirm('Programı silmek istiyor musunuz? Antrenman geçmişiniz silinmez.')) {
                clearProgram();
                toast('Program silindi. Geçmişiniz korundu.');
              }
            }}
          />
        )}
      </div>

      {runner && <Runner logId={runner} onClose={() => setRunner(null)} />}
    </div>
  );
}

/* ── Sihirbaz ─────────────────────────────────────────────── */
function Wizard({
  initial,
  hasProgram,
  onCancel,
  onDone,
}: {
  initial: import('@/lib/store').Profile;
  hasProgram: boolean;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [age, setAge] = useState<string>(initial.age ? String(initial.age) : '');
  const [level, setLevel] = useState<Level>(initial.level);
  const [goal, setGoal] = useState<Goal>(initial.goal);
  const [positions, setPositions] = useState<PositionId[]>(initial.positions);
  const [equipByEnv, setEquipByEnv] = useState<EquipByEnv>(initial.equipByEnv);
  const [envs, setEnvs] = useState<EnvId[]>(initial.envs);
  const [perWeek, setPerWeek] = useState(initial.perWeek);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ageNum = Number(age);
  const validAge = Number.isFinite(ageNum) && ageNum >= 6 && ageNum <= 70;
  const band = validAge ? ageBand(ageNum) : null;
  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = async () => {
    if (!validAge) {
      setError('Lütfen 6 ile 70 arasında geçerli bir yaş girin. Yaş, güvenli doz ve egzersiz seçimi için gereklidir.');
      return;
    }
    if (envs.length === 0) {
      setError('En az bir antrenman ortamı seçin.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      setProfile({ age: ageNum, level, goal, positions, equipByEnv, envs, perWeek, minutes });
      const prog = generateProgram({ age: ageNum, band: ageBand(ageNum), level, goal, positions, equipment: [], equipByEnv, envs, perWeek, minutes });
      saveProgram(prog);
      toast('Programınız hazır. İstediğiniz günlere taşıyabilirsiniz.');
      onDone();
    } catch {
      setError('Program oluşturulurken bir sorun oldu. Sayfayı yenileyip tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard">
      <div className="grid cols-2" style={{ '--gap': '28px' } as React.CSSProperties}>
        <div className="panel">
          <p className="panel__title">1 · Sen</p>
          <div className="stack" style={{ '--stack': '1.4rem' } as React.CSSProperties}>
            <div className="field">
              <label htmlFor="w-age">Yaş</label>
              <input id="w-age" className="input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="Örn. 14" aria-describedby="w-age-h" />
              <span id="w-age-h" className="field__hint">Yaş, doz ve egzersiz güvenliğini belirler. Yalnızca bu tarayıcıda saklanır.</span>
            </div>
            <div className="field">
              <span className="field__label">Genel yetenek seviyesi</span>
              <StarRating value={level} onChange={setLevel} label="Genel yetenek seviyeniz" />
            </div>
            <div className="field">
              <span className="field__label">Pozisyon(lar)</span>
              <div className="chips">
                {POSITIONS.map((p) => (
                  <button key={p.id} type="button" className="chip" aria-pressed={positions.includes(p.id)} onClick={() => toggle(positions, p.id, setPositions)}>
                    {p.name}
                  </button>
                ))}
              </div>
              <span className="field__hint">İsteğe bağlı. Kanat ve bek seçerseniz programda sürat ve çeviklik oturumu öne alınır.</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <p className="panel__title">2 · Hedef ve olanaklar</p>
          <div className="stack" style={{ '--stack': '1.4rem' } as React.CSSProperties}>
            <div className="field">
              <label htmlFor="w-goal">Hedef</label>
              <select id="w-goal" className="select" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                {GOALS.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} — {g.hint}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="field__label">Antrenman ortamı</span>
              <div className="chips">
                {ENVS.map((e) => (
                  <button key={e.id} type="button" className="chip" aria-pressed={envs.includes(e.id)} onClick={() => toggle(envs, e.id, setEnvs)}>
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
            <EquipPicker envs={envs} value={equipByEnv} age={validAge ? ageNum : null} onChange={setEquipByEnv} />
            <div className="field">
              <span className="field__label">Haftada kaç antrenman?</span>
              <div className="seg" role="group" aria-label="Haftalık antrenman sayısı">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" aria-pressed={perWeek === n} onClick={() => setPerWeek(n)}>{n}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field__label">Antrenman süresi</span>
              <div className="seg" role="group" aria-label="Antrenman süresi">
                {[30, 45, 60, 75, 90].map((n) => (
                  <button key={n} type="button" aria-pressed={minutes === n} onClick={() => setMinutes(n)}>{n} dk</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {band && (
        <div className={`note ${band === 'u12' || band === '12-14' ? 'note--warn' : ''}`} style={{ marginTop: 24 }}>
          <Icon name="info" />
          <div>
            <p><strong>{BAND_RULES[band].title} için kurallar:</strong></p>
            <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: 'disc' }}>
              {BAND_RULES[band].rules.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
      <ul className="field__hint" style={{ marginTop: 14 }}>
        {GENERAL_SAFETY.map((s) => <li key={s}>• {s}</li>)}
      </ul>
      {error && <p className="note note--warn" role="alert" style={{ marginTop: 16 }}>{error}</p>}
      <div className="levelcard__actions" style={{ marginTop: 28 }}>
        <button type="button" className="btn btn--primary" onClick={submit} disabled={busy}>
          {busy ? 'Hazırlanıyor…' : hasProgram ? 'Programı yeniden oluştur' : 'Programımı oluştur'} <Icon name="arrow" />
        </button>
        {hasProgram && <button type="button" className="btn btn--ghost" onClick={onCancel}>Vazgeç</button>}
      </div>
    </div>
  );
}

/* ── Haftalık görünüm ─────────────────────────────────────── */
function WeekView({ program, logs, onStart, onResume }: { program: Program; logs: SessionLog[]; onStart: (s: PlannedSession) => void; onResume: (logId: string) => void }) {
  const [offset, setOffset] = useState(0);
  const wr = weekRange(offset);
  const today = todayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(wr.startDate, i));
  const unplaced = program.sessions.filter((s) => s.day === null);
  const weekLogs = logs.filter((l) => l.date >= wr.start && l.date <= wr.end && l.status !== 'active');
  const doneCount = weekLogs.filter((l) => l.status === 'done').length;
  const free = weekLogs.filter((l) => !l.sessionId);

  return (
    <div>
      <div className="prog__weekbar">
        <div className="prog__nav">
          <button type="button" className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Önceki hafta"><Icon name="chevron-left" /></button>
          <div>
            <p className="mono muted">{offset === 0 ? 'Bu hafta' : offset === -1 ? 'Geçen hafta' : offset === 1 ? 'Gelecek hafta' : `${offset > 0 ? '+' : ''}${offset} hafta`}</p>
            <p className="h3">{fmtShort(wr.start)} – {fmtShort(wr.end)}</p>
          </div>
          <button type="button" className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Sonraki hafta"><Icon name="chevron-right" /></button>
          {offset !== 0 && <button type="button" className="btn btn--quiet" onClick={() => setOffset(0)}>Bu haftaya dön</button>}
        </div>
        <div className="prog__weekstat">
          <span className="num" style={{ fontSize: '2rem', lineHeight: 1 }}>{doneCount}<span className="muted">/{program.sessions.length}</span></span>
          <span className="mono muted">tamamlanan oturum</span>
        </div>
      </div>

      <div className="weekgrid">
        {days.map((d, i) => {
          const key = todayKey(d);
          const sessions = program.sessions.filter((s) => s.day === i);
          return (
            <div key={key} className={`weekcol ${key === today ? 'weekcol--today' : ''}`}>
              <div className="weekcol__head">
                <span className="mono">{DAY_SHORT[i]}</span>
                <span className="num">{d.getDate()}</span>
              </div>
              {sessions.length === 0 && <p className="weekcol__rest mono">Dinlenme</p>}
              {sessions.map((s) => (
                <SessionCard key={s.id} s={s} logs={logs} offset={offset} onStart={onStart} onResume={onResume} />
              ))}
            </div>
          );
        })}
      </div>

      {unplaced.length > 0 && (
        <div className="panel" style={{ marginTop: 24 }}>
          <p className="panel__title">Takvime yerleştirilmemiş oturumlar</p>
          <div className="weekgrid weekgrid--auto">
            {unplaced.map((s) => (
              <SessionCard key={s.id} s={s} logs={logs} offset={offset} onStart={onStart} onResume={onResume} />
            ))}
          </div>
        </div>
      )}
      {free.length > 0 && (
        <p className="field__hint" style={{ marginTop: 14 }}>Bu hafta {free.length} serbest antrenman kaydınız da var (Geçmiş sekmesinde).</p>
      )}
      <QuickLog />
    </div>
  );
}

function SessionCard({ s, logs, offset, onStart, onResume }: { s: PlannedSession; logs: SessionLog[]; offset: number; onStart: (s: PlannedSession) => void; onResume: (id: string) => void }) {
  const log = logForSession(logs, s.id, offset);
  const status = log?.status;
  const prog = log ? logProgress(log) : null;
  const sheet = offset === 0;
  return (
    <div className={`scard scard--${status ?? 'none'}`}>
      <p className="scard__title">
        <Link href={`/program/antrenman/?oturum=${s.id}`} className="scard__link" aria-label={`${s.title} antrenman ayrıntısını aç`}>{s.title}</Link>
      </p>
      <p className="scard__meta mono">{s.minutes} dk · {s.env === 'ev' ? 'Ev' : s.env === 'salon' ? 'Salon' : 'Saha'}</p>
      {status === 'done' && <span className="tag tag--grass">Tamamlandı ✓</span>}
      {status === 'partial' && <span className="tag tag--terra">Yarım bırakıldı</span>}
      {status === 'active' && prog && <span className="tag tag--brass">Devam ediyor {prog.done}/{prog.total}</span>}
      <div className="scard__actions">
        {status === 'active' && log ? (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => onResume(log.id)}>Devam et</button>
        ) : (
          <button type="button" className={`btn btn--sm ${status === 'done' ? 'btn--ghost' : 'btn--primary'}`} onClick={() => onStart(s)} disabled={!sheet && false}>
            {status === 'done' ? 'Tekrar yap' : 'Başla'}
          </button>
        )}
        <Link href={`/program/antrenman/?oturum=${s.id}`} className="btn btn--quiet btn--sm">Ayrıntı</Link>
        <select className="select scard__day" aria-label={`${s.title} gününü değiştir`} value={s.day ?? ''} onChange={(e) => assignDay(s.id, e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">Gün seç</option>
          {DAY_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

function QuickLog() {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<SessionFocus | 'serbest'>('serbest');
  const [minutes, setMinutes] = useState(45);
  const [rpe, setRpe] = useState(5);
  const [note, setNote] = useState('');
  return (
    <div style={{ marginTop: 24 }}>
      {!open ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(true)}>
          <Icon name="plus" /> Programdan bağımsız antrenman kaydet
        </button>
      ) : (
        <div className="panel">
          <p className="panel__title">Serbest antrenman kaydı</p>
          <div className="grid cols-3" style={{ '--gap': '16px' } as React.CSSProperties}>
            <div className="field">
              <label htmlFor="ql-f">Tür</label>
              <select id="ql-f" className="select" value={focus} onChange={(e) => setFocus(e.target.value as SessionFocus | 'serbest')}>
                {Object.entries(FOCUS_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ql-m">Süre (dk)</label>
              <input id="ql-m" className="input" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(Math.min(300, Number(e.target.value.replace(/\D/g, '')) || 0))} />
            </div>
            <div className="field">
              <label htmlFor="ql-r">Zorluk (1–10)</label>
              <select id="ql-r" className="select" value={rpe} onChange={(e) => setRpe(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="ql-n">Not</label>
            <textarea id="ql-n" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ne çalıştın, nasıl hissettin?" />
          </div>
          <div className="levelcard__actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                addManualLog(focus, minutes || 30, rpe, note);
                toast('Antrenman kaydedildi.');
                setOpen(false);
                setNote('');
              }}
            >
              Kaydet
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Oturum listesi / ayrıntı ─────────────────────────────── */
function SessionList({ program, profile }: { program: Program; profile: import('@/lib/store').Profile }) {
  const [openId, setOpenId] = useState<string | null>(program.sessions[0]?.id ?? null);
  return (
    <div className="stack" style={{ '--stack': '12px' } as React.CSSProperties}>
      {program.sessions.map((s) => (
        <details key={s.id} className="panel sess" open={openId === s.id} onToggle={(e) => (e.currentTarget.open ? setOpenId(s.id) : openId === s.id && setOpenId(null))}>
          <summary>
            <span className="h3">{s.title}</span>
            <span className="mono muted">{s.items.length} hareket · {s.minutes} dk{s.day !== null ? ` · ${DAY_NAMES[s.day]}` : ''}</span>
          </summary>
          <ul className="sess__items">
            {s.items.map((it) => {
              const ex = EX_BY_ID[it.ref];
              const alt = ex?.alt.find((id) => EX_BY_ID[id] && EX_BY_ID[id].id !== it.ref);
              return (
                <li key={it.key}>
                  <div>
                    <p className="sess__name">
                      {it.kind === 'ex' ? <Link href={`/fiziksel/${it.ref}/`}>{it.name}</Link> : it.kind === 'tech' ? <Link href={`/teknikler/${it.ref}/`}>{it.name}</Link> : it.name}
                    </p>
                    {it.note && <p className="sess__note">{it.note}</p>}
                  </div>
                  <div className="sess__dose">
                    <b className="mono">{it.dose}</b>
                    {it.rest !== '—' && <span className="mono muted">dinlenme {it.rest}</span>}
                  </div>
                  <div className="sess__acts">
                    {it.kind === 'ex' && alt && (
                      <button type="button" className="btn btn--quiet" onClick={() => { swapItem(s.id, it.key, alt, profile.age ?? 18, profile.level); toast(`“${EX_BY_ID[alt].name}” ile değiştirildi`); }}>
                        Alternatif
                      </button>
                    )}
                    <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} aria-label={`${it.name} egzersizini çıkar`} onClick={() => removeItem(s.id, it.key)}>
                      <Icon name="close" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link href={`/program/antrenman/?oturum=${s.id}`} className="btn btn--quiet">Antrenman ayrıntısı: hedef kaslar, doğru yürütme, hatalar →</Link>
          </p>
        </details>
      ))}
    </div>
  );
}

/* ── Geçmiş ───────────────────────────────────────────────── */
function History({ logs, onOpen }: { logs: SessionLog[]; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<'hepsi' | 'done' | 'partial'>('hepsi');
  const list = useMemo(
    () => [...logs].filter((l) => l.status !== 'active' && (filter === 'hepsi' || l.status === filter)).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
    [logs, filter],
  );
  const done = logs.filter((l) => l.status === 'done');
  const mins = done.reduce((a, l) => a + logMinutes(l), 0);
  return (
    <div>
      <div className="grid cols-3" style={{ '--gap': '14px', marginBottom: 24 } as React.CSSProperties}>
        <div className="panel"><p className="panel__title">Tamamlanan</p><p className="num quiz__big">{done.length}</p></div>
        <div className="panel"><p className="panel__title">Toplam süre</p><p className="num quiz__big">{Math.round(mins / 60 * 10) / 10}<span className="muted" style={{ fontSize: '1.4rem' }}> sa</span></p></div>
        <div className="panel"><p className="panel__title">Yarım kalan</p><p className="num quiz__big">{logs.filter((l) => l.status === 'partial').length}</p></div>
      </div>
      <div className="chips" style={{ marginBottom: 20 }}>
        {(['hepsi', 'done', 'partial'] as const).map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'hepsi' ? 'Hepsi' : f === 'done' ? 'Tamamlananlar' : 'Yarım bırakılanlar'}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="empty">
          <h3 className="h3">Henüz kayıt yok</h3>
          <p>Bir antrenmana başlayıp bitirdiğinizde burada görünür. Kayıtlar yalnızca bu tarayıcıda saklanır.</p>
        </div>
      ) : (
        <ul className="hist">
          {list.map((l) => {
            const p = logProgress(l);
            return (
              <li key={l.id} className="hist__row">
                <div>
                  <p className="hist__title">{l.title}</p>
                  <p className="mono muted">{fmtDate(l.date)} · {logMinutes(l)} dk{l.rpe ? ` · zorluk ${l.rpe}/10` : ''}</p>
                  {l.note && <p className="sess__note">“{l.note}”</p>}
                </div>
                <span className={`tag ${l.status === 'done' ? 'tag--grass' : 'tag--terra'}`}>{l.status === 'done' ? 'Tamamlandı' : `Yarım ${p.done}/${p.total}`}</span>
                <div className="hist__acts">
                  <button type="button" className="btn btn--quiet" onClick={() => onOpen(l.id)}>Ayrıntı</button>
                  <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Kaydı sil" onClick={() => window.confirm('Bu kaydı silmek istiyor musunuz?') && deleteLog(l.id)}>
                    <Icon name="trash" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Ayarlar ──────────────────────────────────────────────── */
function Settings({ program, onRegenerate, onClear }: { program: Program; onRegenerate: () => void; onClear: () => void }) {
  const i = program.input;
  return (
    <div className="grid cols-2" style={{ '--gap': '24px' } as React.CSSProperties}>
      <div className="panel">
        <p className="panel__title">Programın özeti</p>
        <dl className="kv">
          <dt>Yaş</dt><dd>{i.age} ({BAND_NAME[i.band]})</dd>
          <dt>Seviye</dt><dd>{'★'.repeat(i.level)}</dd>
          <dt>Hedef</dt><dd>{GOALS.find((g) => g.id === i.goal)?.name}</dd>
          <dt>Haftalık</dt><dd>{i.perWeek} antrenman · {i.minutes} dk</dd>
          <dt>Ortam</dt><dd>{i.envs.map((e) => ENVS.find((x) => x.id === e)?.name).join(', ')}</dd>
          {i.equipByEnv
            ? i.envs.map((e) => (
                <Fragment key={e}>
                  <dt>{ENV_NAME[e as EnvId]} ekipmanı</dt>
                  <dd>{(i.equipByEnv?.[e] ?? []).map((x) => EQUIP_NAME[x as keyof typeof EQUIP_NAME]).filter(Boolean).join(', ') || 'Ekipmansız'}</dd>
                </Fragment>
              ))
            : (
                <>
                  <dt>Ekipman</dt>
                  <dd>{i.equipment.length ? i.equipment.map((x) => EQUIP_NAME[x as keyof typeof EQUIP_NAME] ?? x).join(', ') : 'Ekipmansız'}</dd>
                </>
              )}
          {i.positions.length > 0 && (<><dt>Pozisyon</dt><dd>{i.positions.map((p) => POSITIONS.find((x) => x.id === p)?.name).join(', ')}</dd></>)}
        </dl>
        <div className="levelcard__actions" style={{ marginTop: 22 }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={onRegenerate}><Icon name="refresh" /> Yeniden oluştur</button>
          <button type="button" className="btn btn--danger btn--sm" onClick={onClear}><Icon name="trash" /> Programı sil</button>
        </div>
      </div>
      <div className="panel">
        <p className="panel__title">Notlar</p>
        <ul className="ticks">
          {program.notes.map((n) => <li key={n}>{n}</li>)}
          {GENERAL_SAFETY.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
}
