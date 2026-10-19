'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FIELD_TESTS, TEST_BY_ID, type FieldTest } from '@/data/tests';
import { logMinutes } from '@/lib/program-actions';
import { addTest, deleteTest, useMeta, useStore, type AppState, type TestEntry } from '@/lib/store';
import { toast } from '@/lib/toast';
import { LEVEL_NAMES, type Level, type PositionId } from '@/lib/types';
import { addDays, fmtDate, fmtShort, todayKey, weekStart } from '@/lib/utils';
import { Icon } from './Icon';

export interface TechMeta {
  id: string;
  name: string;
  pos: PositionId[];
}
export interface QuizMeta {
  id: string;
  theme: string;
}

const selLogs = (s: AppState) => s.logs;
const selTests = (s: AppState) => s.tests;
const selLevels = (s: AppState) => s.levels;
const selLevelLog = (s: AppState) => s.levelLog;
const selQuiz = (s: AppState) => s.quiz;
const selPositions = (s: AppState) => s.profile.positions;
const selProfLevel = (s: AppState) => s.profile.level;

function keyOf(d: Date) {
  return todayKey(d);
}

/* ── Küçük grafikler ─────────────────────────────────────── */
function Sparkline({ values, better }: { values: number[]; better: 'low' | 'high' }) {
  const w = 220;
  const h = 56;
  const pad = 6;
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)] as const);
  const last = values[values.length - 1];
  const first = values[0];
  const improved = better === 'low' ? last < first : last > first;
  const color = last === first ? 'var(--ivory-3)' : improved ? 'var(--brass-hi)' : 'var(--terra)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" role="img" aria-label={`Son ${values.length} ölçüm grafiği`}>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.2 : 1.8} fill={i === pts.length - 1 ? color : 'var(--ink-900)'} stroke={color} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

/* ── 1. Antrenman hacmi ──────────────────────────────────── */
export function VolumePanel() {
  const logs = useStore(selLogs);
  const weeks = useMemo(() => {
    const start = weekStart();
    const out: { key: string; label: string; n: number; min: number; partial: number }[] = [];
    for (let i = 9; i >= 0; i--) {
      const s = addDays(start, -7 * i);
      const e = addDays(s, 6);
      const k1 = keyOf(s);
      const k2 = keyOf(e);
      const inW = logs.filter((l) => l.date >= k1 && l.date <= k2 && l.status !== 'active');
      const done = inW.filter((l) => l.status === 'done');
      out.push({ key: k1, label: fmtShort(k1), n: done.length, min: done.reduce((a, b) => a + logMinutes(b), 0), partial: inW.length - done.length });
    }
    return out;
  }, [logs]);

  const done = logs.filter((l) => l.status === 'done');
  const rpes = done.map((l) => l.rpe).filter((x): x is number => typeof x === 'number');
  const maxN = Math.max(1, ...weeks.map((w) => w.n));
  const thisWeek = weeks[weeks.length - 1];
  const last4 = weeks.slice(-4);
  // üst üste hafta serisi (bu hafta henüz boşsa geçen haftadan say)
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].n > 0) streak++;
    else if (i === weeks.length - 1) continue;
    else break;
  }

  if (done.length === 0 && logs.length === 0) {
    return (
      <div className="empty">
        <p className="h3">Henüz antrenman kaydın yok.</p>
        <p className="muted">Program sayfasından bir oturum başlat ya da serbest bir çalışma ekle; burada haftalık grafiğini göreceksin.</p>
        <p><Link href="/program/" className="btn btn--primary">Programa git <Icon name="arrow" /></Link></p>
      </div>
    );
  }
  return (
    <div>
      <div className="summary" style={{ marginBottom: 28 }}>
        <div className="summary__item"><span className="summary__n num">{thisWeek.n}</span><span className="summary__l">Bu hafta tamamlanan</span><span className="summary__s mono">{thisWeek.min} dk</span></div>
        <div className="summary__item"><span className="summary__n num">{last4.reduce((a, b) => a + b.n, 0)}</span><span className="summary__l">Son 4 haftada tamamlanan</span><span className="summary__s mono">{last4.reduce((a, b) => a + b.min, 0)} dk</span></div>
        <div className="summary__item"><span className="summary__n num">{streak}</span><span className="summary__l">Üst üste antrenman haftası</span></div>
        <div className="summary__item"><span className="summary__n num">{rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : '—'}</span><span className="summary__l">Ortalama zorluk (1–10)</span><span className="summary__s mono">{rpes.length ? `${rpes.length} kayıt` : 'Zorluk girilmedi'}</span></div>
      </div>
      <figure className="bars" aria-label="Son 10 haftada tamamlanan antrenman sayısı">
        <div className="bars__plot">
          {weeks.map((w, i) => (
            <div key={w.key} className="bars__col" title={`${fmtShort(w.key)} haftası: ${w.n} tamamlanan, ${w.min} dk`}>
              <span className="bars__v mono">{w.n || ''}</span>
              <span className={`bars__bar ${i === weeks.length - 1 ? 'bars__bar--now' : ''}`} style={{ height: `${(w.n / maxN) * 100}%`, minHeight: w.n ? 4 : 1 }} />
              <span className="bars__l mono">{w.label}</span>
            </div>
          ))}
        </div>
        <figcaption className="field__hint">Her sütun bir hafta (Pazartesi başlangıçlı). Yalnızca “tamamlandı” işaretlenen oturumlar sayılır; yarım bırakılanlar geçmişte görünür ama burada sayılmaz.</figcaption>
      </figure>
    </div>
  );
}

/* ── 2. Saha testleri ────────────────────────────────────── */
function fmtVal(t: FieldTest, v: number) {
  return t.decimals ? v.toFixed(t.decimals).replace('.', ',') : String(Math.round(v));
}

function TestCard({ test, entries, onPick }: { test: FieldTest; entries: TestEntry[]; onPick: (id: string) => void }) {
  const sorted = [...entries].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
  const values = sorted.map((e) => e.value);
  const best = values.length ? (test.better === 'low' ? Math.min(...values) : Math.max(...values)) : null;
  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  let delta: string | null = null;
  if (sorted.length >= 2 && last && first) {
    const d = last.value - first.value;
    const good = test.better === 'low' ? d < 0 : d > 0;
    delta = d === 0 ? 'Değişmedi' : `${d > 0 ? '+' : '−'}${fmtVal(test, Math.abs(d))} ${test.unit} ${good ? '· iyileşme' : '· geriledi'}`;
  }
  return (
    <div className="card card--pad testcard">
      <div className="testcard__top">
        <div>
          <p className="mono muted">{test.group}</p>
          <h3 className="h3">{test.name}</h3>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPick(test.id)}>Ölçüm ekle</button>
      </div>
      {sorted.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>Kayıt yok. Ölçüm düzenini görmek için “Ölçüm ekle”ye bas.</p>
      ) : (
        <>
          <div className="testcard__vals">
            <div><span className="mono muted">Son</span><b className="num">{fmtVal(test, last.value)}</b><span className="muted">{test.unit}</span></div>
            <div><span className="mono muted">En iyi</span><b className="num">{fmtVal(test, best as number)}</b><span className="muted">{test.unit}</span></div>
            <div><span className="mono muted">Kayıt</span><b className="num">{sorted.length}</b></div>
          </div>
          <Sparkline values={values.slice(-12)} better={test.better} />
          <p className="field__hint">{delta ? `İlk ölçüme göre: ${delta}` : 'Karşılaştırma için en az iki ölçüm gerekir.'} · Son: {fmtDate(last.date)}</p>
        </>
      )}
    </div>
  );
}

export function TestsPanel() {
  const tests = useStore(selTests);
  const { ready } = useMeta();
  const [kind, setKind] = useState<string>(FIELD_TESTS[0].id);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showLog, setShowLog] = useState(false);
  const t = TEST_BY_ID[kind];

  const byKind = useMemo(() => {
    const m = new Map<string, TestEntry[]>();
    tests.forEach((e) => m.set(e.kind, [...(m.get(e.kind) ?? []), e]));
    return m;
  }, [tests]);
  const withData = FIELD_TESTS.filter((x) => byKind.has(x.id));
  const withoutData = FIELD_TESTS.filter((x) => !byKind.has(x.id));
  const recent = [...tests].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1)).slice(0, 30);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value.replace(',', '.'));
    if (!value.trim() || !Number.isFinite(v)) return setError('Lütfen bir sayı gir.');
    if (v < t.min || v > t.max) return setError(`${t.name} için ${t.min}–${t.max} ${t.unit} aralığında bir değer gir. Birimi ve ondalığı kontrol et.`);
    if (!date || date > todayKey()) return setError('Tarih bugün ya da geçmiş bir gün olmalı.');
    setError('');
    addTest({ kind, value: t.decimals ? Math.round(v * 10 ** t.decimals) / 10 ** t.decimals : Math.round(v), date, note: note.trim() || undefined });
    setValue('');
    setNote('');
    toast(`${t.name} ölçümü kaydedildi.`);
  };

  return (
    <div className="grid cols-2" style={{ '--gap': '28px', alignItems: 'start' } as React.CSSProperties} aria-busy={!ready}>
      <div className="stack" style={{ '--stack': '1.2rem' } as React.CSSProperties}>
        <div className="panel">
          <p className="panel__title">Ölçüm ekle</p>
          <form onSubmit={submit} className="stack" style={{ '--stack': '1.2rem' } as React.CSSProperties}>
            <div className="field">
              <label htmlFor="t-kind">Test</label>
              <select id="t-kind" className="select" value={kind} onChange={(e) => { setKind(e.target.value); setError(''); }}>
                {(['Sürat ve çeviklik', 'Güç ve kuvvet', 'Dayanıklılık', 'Teknik'] as const).map((g) => (
                  <optgroup key={g} label={g}>
                    {FIELD_TESTS.filter((x) => x.group === g).map((x) => <option key={x.id} value={x.id}>{x.name} ({x.unit})</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="grid cols-2" style={{ '--gap': '14px' } as React.CSSProperties}>
              <div className="field">
                <label htmlFor="t-val">Sonuç ({t.unit})</label>
                <input id="t-val" className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={t.better === 'low' ? 'Örn. 2,05' : 'Örn. 35'} aria-invalid={!!error} />
              </div>
              <div className="field">
                <label htmlFor="t-date">Tarih</label>
                <input id="t-date" type="date" className="input" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="t-note">Not <span className="muted">(isteğe bağlı)</span></label>
              <input id="t-note" className="input" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Zemin, hava, yorgunluk…" />
            </div>
            {error && <p className="note note--warn" role="alert">{error}</p>}
            <button type="submit" className="btn btn--primary" disabled={!ready}>Kaydet <Icon name="arrow" /></button>
          </form>
        </div>
        <div className="panel panel--flat">
          <p className="panel__title">Nasıl ölçerim? — {t.name}</p>
          <ol className="steps">{t.how.map((s) => <li key={s}>{s}</li>)}</ol>
          <p className="field__hint" style={{ marginTop: 10 }}><strong>Gerekenler:</strong> {t.gear}</p>
          <p className="field__hint">{t.note}</p>
        </div>
      </div>

      <div className="stack" style={{ '--stack': '1.2rem' } as React.CSSProperties}>
        {withData.length === 0 && (
          <div className="empty">
            <p className="h3">Henüz saha testi kaydın yok.</p>
            <p className="muted">Soldan bir test seç, ölçümünü gir. Sonuçlar yalnızca senin önceki sonuçlarınla karşılaştırılır; ortalama ya da “norm” göstermiyoruz.</p>
          </div>
        )}
        {withData.map((x) => <TestCard key={x.id} test={x} entries={byKind.get(x.id) ?? []} onPick={(id) => { setKind(id); setError(''); document.getElementById('t-val')?.focus(); }} />)}
        {withData.length > 0 && withoutData.length > 0 && (
          <p className="field__hint">Henüz ölçmediklerin: {withoutData.map((x) => x.name).join(', ')}.</p>
        )}
        {recent.length > 0 && (
          <div>
            <button type="button" className="btn btn--quiet" aria-expanded={showLog} onClick={() => setShowLog(!showLog)}>
              {showLog ? 'Kayıt listesini gizle' : `Tüm kayıtlar (${tests.length})`}
            </button>
            {showLog && (
              <ul className="loglist">
                {recent.map((e) => {
                  const tt = TEST_BY_ID[e.kind];
                  return (
                    <li key={e.id}>
                      <span><b>{tt?.name ?? e.kind}</b> · <span className="num">{tt ? fmtVal(tt, e.value) : e.value}</span> {tt?.unit}</span>
                      <span className="muted">{fmtDate(e.date)}{e.note ? ` · ${e.note}` : ''}</span>
                      <button type="button" className="btn btn--quiet btn--sm" onClick={() => { if (window.confirm('Bu ölçüm silinsin mi?')) deleteTest(e.id); }} aria-label={`${tt?.name ?? e.kind} ölçümünü sil`}>Sil</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 3. Teknik gelişim ───────────────────────────────────── */
export function TechPanel({ techs }: { techs: TechMeta[] }) {
  const levels = useStore(selLevels);
  const levelLog = useStore(selLevelLog);
  const positions = useStore(selPositions);
  const profLevel = useStore(selProfLevel);
  const byId = useMemo(() => new Map(techs.map((t) => [t.id, t])), [techs]);
  const ratedIds = Object.keys(levels);
  const dist = [0, 0, 0, 0, 0];
  ratedIds.forEach((id) => { const l = levels[id].level; if (l >= 1 && l <= 5) dist[l - 1]++; });
  const total = ratedIds.length;
  const recent = [...levelLog].reverse().slice(0, 8);

  // önerilen odak: pozisyona ait ama henüz seviye verilmemiş ya da düşük seviyedeki teknikler
  const focus = useMemo(() => {
    const pool = positions.length ? techs.filter((t) => t.pos.some((p) => positions.includes(p))) : techs;
    return pool
      .map((t) => ({ t, lv: (levels[t.id]?.level ?? 0) as number }))
      .filter((x) => x.lv <= 2)
      .sort((a, b) => a.lv - b.lv)
      .slice(0, 6);
  }, [techs, positions, levels]);

  if (total === 0) {
    return (
      <div className="empty">
        <p className="h3">Henüz hiçbir tekniğe yıldız vermedin.</p>
        <p className="muted">Her teknik sayfasında 1–5 yıldız seviyeni seçebilirsin; seviye değişimlerin burada zaman çizgisi olarak görünür.</p>
        <p><Link href="/teknikler/" className="btn btn--primary">Teknik kütüphanesine git <Icon name="arrow" /></Link></p>
      </div>
    );
  }
  return (
    <div className="grid cols-2" style={{ '--gap': '28px', alignItems: 'start' } as React.CSSProperties}>
      <div>
        <p className="mono muted" style={{ marginBottom: 12 }}>Seviye dağılımı · {total} teknik</p>
        <ul className="dist">
          {[5, 4, 3, 2, 1].map((n) => (
            <li key={n}>
              <span className="mono">{'★'.repeat(n)}</span>
              <span className="dist__bar"><i style={{ width: `${total ? (dist[n - 1] / total) * 100 : 0}%` }} /></span>
              <b className="num">{dist[n - 1]}</b>
              <span className="muted dist__n">{LEVEL_NAMES[n as Level]}</span>
            </li>
          ))}
        </ul>
        <p className="field__hint" style={{ marginTop: 12 }}>Genel seviyen: {'★'.repeat(profLevel)} {LEVEL_NAMES[profLevel]}. Seviyeler kendi değerlendirmendir; antrenörünle ya da arkadaşlarınla karşılaştırarak ayarla.</p>
      </div>
      <div>
        <p className="mono muted" style={{ marginBottom: 12 }}>Son seviye değişikliklerin</p>
        <ul className="loglist">
          {recent.map((e, i) => (
            <li key={`${e.id}-${e.at}-${i}`}>
              <span><Link href={`/teknikler/${e.id}/`} className="btn--quiet" style={{ border: 0 }}>{byId.get(e.id)?.name ?? e.id}</Link></span>
              <span className="mono">{'★'.repeat(e.level)}{'☆'.repeat(5 - e.level)}</span>
              <span className="muted">{fmtDate(e.at.slice(0, 10))}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <p className="mono muted" style={{ marginBottom: 12 }}>
          Sırada ne çalışmalı? {positions.length ? '(seçili pozisyonlarına göre)' : '(pozisyon seçmediğin için genel liste)'}
        </p>
        {focus.length === 0 ? (
          <p className="muted">Seçili alanlardaki tüm tekniklere 3 ve üzeri yıldız vermişsin. Yeni bir pozisyon eklemeyi ya da bir üst seviyeye geçmeyi düşünebilirsin.</p>
        ) : (
          <ul className="chips">
            {focus.map(({ t, lv }) => (
              <li key={t.id}><Link href={`/teknikler/${t.id}/`} className="chip">{t.name} <span className="count">{lv ? '★'.repeat(lv) : 'seviye yok'}</span></Link></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── 4. Futbol IQ ────────────────────────────────────────── */
export function IqPanel({ quiz }: { quiz: QuizMeta[] }) {
  const rec = useStore(selQuiz);
  const themeOf = useMemo(() => new Map(quiz.map((q) => [q.id, q.theme])), [quiz]);
  const rows = useMemo(() => {
    const m = new Map<string, { tries: number; right: number; qs: number }>();
    Object.entries(rec).forEach(([id, r]) => {
      const th = themeOf.get(id);
      if (!th) return;
      const cur = m.get(th) ?? { tries: 0, right: 0, qs: 0 };
      cur.tries += r.tries;
      cur.right += r.right;
      cur.qs += 1;
      m.set(th, cur);
    });
    return Array.from(m.entries()).map(([theme, v]) => ({ theme, ...v, pct: v.tries ? v.right / v.tries : 0 })).sort((a, b) => a.pct - b.pct);
  }, [rec, themeOf]);
  const total = quiz.length;
  const answered = Object.keys(rec).filter((id) => themeOf.has(id)).length;

  if (rows.length === 0) {
    return (
      <div className="empty">
        <p className="h3">Henüz Futbol IQ sorusu çözmedin.</p>
        <p className="muted">{total} maç durumu sorusu seni bekliyor. Çözdükçe hangi konuda güçlü olduğunu burada göreceksin.</p>
        <p><Link href="/taktik/test/" className="btn btn--primary">Teste başla <Icon name="arrow" /></Link></p>
      </div>
    );
  }
  const weakest = rows.find((r) => r.tries >= 2) ?? rows[0];
  return (
    <div className="grid cols-2" style={{ '--gap': '28px', alignItems: 'start' } as React.CSSProperties}>
      <ul className="dist">
        {rows.map((r) => (
          <li key={r.theme}>
            <span className="dist__t">{r.theme}</span>
            <span className="dist__bar"><i style={{ width: `${r.pct * 100}%` }} /></span>
            <b className="num">%{Math.round(r.pct * 100)}</b>
            <span className="muted dist__n">{r.right}/{r.tries}</span>
          </li>
        ))}
      </ul>
      <div className="stack" style={{ '--stack': '1rem' } as React.CSSProperties}>
        <p className="muted">{answered}/{total} soruya en az bir kez cevap verdin. Doğruluk oranı, her denemeyi sayar (aynı soruyu tekrar çözmek oranı değiştirir).</p>
        <div className="note">
          <Icon name="info" />
          <p>En çok geliştirebileceğin konu: <strong>{weakest.theme}</strong>. Kısa örnek sayısıyla kesin bir sonuç çıkarmak zordur; birkaç soru daha çözerek görünümü netleştir.</p>
        </div>
        <p><Link href="/taktik/test/" className="btn btn--ghost">Teste devam et <Icon name="arrow" /></Link></p>
      </div>
    </div>
  );
}
