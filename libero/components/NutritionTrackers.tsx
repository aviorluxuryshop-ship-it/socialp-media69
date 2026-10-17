'use client';

import { useEffect, useRef, useState } from 'react';
import { URINE_STEPS } from '@/data/nutrition-guide';
import { AGE_BANDS, REMINDER_CHOICES, addGlass, buildMatchTimeline, dayKey, glassesOn, lastDays, reminderDue, type StepKind } from '@/lib/nutrition';
import { usePlan, useWater } from '@/lib/nutri-store';
import { Icon } from './Icon';
import { Rv } from './NutritionBits';

/** Yazdırma: yalnızca hedef alanı basar (styles/nutrition.css içindeki html[data-print] kuralları) */
export function PrintButton({ target, label = 'Yazdır' }: { target: 'timeline' | 'plan'; label?: string }) {
  const onClick = () => {
    const root = document.documentElement;
    root.dataset.print = target;
    const done = () => {
      delete root.dataset.print;
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.setTimeout(done, 120_000);
    window.print();
  };
  return (
    <button type="button" className="btn btn--ghost btn--sm np" onClick={onClick} data-print-btn={target}>
      <Icon name="download" />
      {label}
    </button>
  );
}

function Drop() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" />
    </svg>
  );
}

// ── Günlük su takibi ─────────────────────────────────────

export function WaterTracker() {
  const [w, setW] = useWater();
  const [now, setNow] = useState<number | null>(null);
  const [perm, setPerm] = useState<string>('yok');
  const notified = useRef<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (typeof Notification !== 'undefined') setPerm(Notification.permission);
  }, []);

  const key = now === null ? null : dayKey(new Date(now));
  const count = key ? glassesOn(w, key) : 0;
  const pct = Math.min(1, count / w.goal);
  const due = now !== null && reminderDue(w, now);

  useEffect(() => {
    if (due && perm === 'granted' && notified.current !== w.lastAt) {
      notified.current = w.lastAt;
      try {
        new Notification('Su içme zamanı', { body: 'Bir bardak su iç. Libero su hatırlatıcısı.' });
      } catch {
        /* bildirim desteklenmiyor */
      }
    }
  }, [due, perm, w.lastAt]);

  const add = (d: number) => key && setW((s) => addGlass(s, key, d, Date.now()));
  const week = key ? lastDays(w, key, 7) : [];
  const maxBar = Math.max(w.goal, ...week.map((x) => x.n), 1);
  const R = 54;
  const circ = 2 * Math.PI * R;

  return (
    <div className="water card card--pad card--edge" data-water>
      <div className="water__top">
        <div>
          <p className="eyebrow">Araç</p>
          <h3 className="h3">Günlük su takibi</h3>
          <p className="muted water__hint">
            Bardak sayısını sen yazarsın. Hedef bir öneri değil, yalnızca sayaç içindir; idrar rengi daha iyi bir ölçüdür. <Rv id="su-takibi" />
          </p>
        </div>
      </div>

      <div className="water__main">
        <div className="water__ring" role="progressbar" aria-label="Bugünkü su bardağı sayısı" aria-valuemin={0} aria-valuemax={w.goal} aria-valuenow={Math.min(count, w.goal)} aria-valuetext={`${count} bardak, hedef ${w.goal}`}>
          <svg viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--ink-700)" strokeWidth="10" />
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--sky)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 500ms var(--ease-out)' }} />
          </svg>
          <div className="water__num">
            <strong data-water-count>{count}</strong>
            <span className="mono">/ {w.goal} bardak</span>
          </div>
        </div>

        <div className="water__ctl">
          <div className="water__btns">
            <button type="button" className="btn btn--primary" onClick={() => add(1)} data-water-add>
              <Icon name="plus" /> Bir bardak içtim
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => add(-1)} disabled={count === 0} aria-label="Bir bardağı geri al">
              <Icon name="minus" /> Geri al
            </button>
          </div>
          <div className="water__goal">
            <span className="field__label" id="water-goal-l">Sayaç hedefi (bardak)</span>
            <div className="stepper" role="group" aria-labelledby="water-goal-l">
              <button type="button" aria-label="Hedefi azalt" onClick={() => setW((s) => ({ ...s, goal: s.goal - 1 }))}>
                <Icon name="minus" />
              </button>
              <output aria-live="polite" data-water-goal>{w.goal}</output>
              <button type="button" aria-label="Hedefi artır" onClick={() => setW((s) => ({ ...s, goal: s.goal + 1 }))}>
                <Icon name="plus" />
              </button>
            </div>
          </div>
          <ol className="glasses" aria-hidden="true">
            {Array.from({ length: Math.min(w.goal, 20) }, (_, i) => (
              <li key={i} data-on={i < count ? 'true' : 'false'} />
            ))}
          </ol>
        </div>
      </div>

      {week.length > 0 && (
        <div className="water__week" aria-label="Son yedi gün">
          {week.map((d, i) => (
            <div key={d.key} className="water__day" title={`${d.key}: ${d.n} bardak`}>
              <span className="water__bar"><i style={{ height: `${(d.n / maxBar) * 100}%` }} data-today={i === week.length - 1 ? 'true' : undefined} /></span>
              <span className="mono">{new Date(d.key + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
              <span className="mono water__n">{d.n}</span>
            </div>
          ))}
        </div>
      )}

      <div className="water__rem">
        <label className="check">
          <input type="checkbox" checked={w.reminder.on} onChange={(e) => setW((s) => ({ ...s, reminder: { ...s.reminder, on: e.target.checked }, lastAt: e.target.checked ? Date.now() : s.lastAt }))} data-water-rem />
          <span>Hatırlatıcı</span>
        </label>
        <div className="field water__every">
          <label htmlFor="water-every">Her</label>
          <select id="water-every" className="select" value={w.reminder.everyMin} onChange={(e) => setW((s) => ({ ...s, reminder: { ...s.reminder, everyMin: Number(e.target.value) } }))}>
            {REMINDER_CHOICES.map((m) => (
              <option key={m} value={m}>{m} dakikada bir</option>
            ))}
          </select>
        </div>
        {perm === 'default' && (
          <button type="button" className="btn btn--quiet" onClick={() => Notification.requestPermission().then(setPerm)}>
            Tarayıcı bildirimine izin ver
          </button>
        )}
      </div>
      <p className="field__hint">Hatırlatıcı yalnızca bu sayfa bir sekmede açıkken çalışır; telefonu kapalıyken bildirim göndermez. Veriler yalnızca bu tarayıcıda saklanır.</p>

      {due && (
        <div className="water__alert" role="status" data-water-due>
          <Drop />
          <p><strong>Su içme zamanı.</strong> Birkaç yudum su iç.</p>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => add(1)}>İçtim, ekle</button>
          <button type="button" className="btn btn--quiet" onClick={() => setW((s) => ({ ...s, lastAt: Date.now() - (s.reminder.everyMin - 10) * 60_000 }))}>10 dk sonra hatırlat</button>
        </div>
      )}
    </div>
  );
}

// ── İdrar rengi kartı ────────────────────────────────────

export function UrineCard() {
  const [pick, setPick] = useState<number | null>(null);
  const sel = URINE_STEPS.find((s) => s.n === pick);
  return (
    <div className="urine card card--pad" data-urine>
      <p className="eyebrow">Araç</p>
      <h3 className="h3">İdrar rengi kartı</h3>
      <p className="muted">
        İdrarının rengine en yakın kutuyu seç. Ekran renkleri gerçeğiyle birebir aynı değildir; bazı besin ve ilaçlar rengi değiştirebilir. <Rv id="idrar-karti" />
      </p>
      <div className="urine__scale" role="radiogroup" aria-label="İdrar rengi">
        {URINE_STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            role="radio"
            aria-checked={pick === s.n}
            className="urine__sw"
            style={{ ['--c' as string]: `var(--u${s.n})` }}
            onClick={() => setPick(s.n)}
            data-urine-step={s.n}
          >
            <span className="urine__chip" aria-hidden="true" />
            <span className="urine__n mono">{s.n}</span>
            <span className="urine__name">{s.name}</span>
          </button>
        ))}
      </div>
      <div className={`urine__out urine__out--${sel?.tone ?? 'none'}`} aria-live="polite" data-urine-out>
        {sel ? (
          <>
            <strong>{sel.name}</strong>
            <p>{sel.advice}</p>
          </>
        ) : (
          <p className="muted">Bir renk seçtiğinde ne yapman gerektiği burada görünür. Bu kart tıbbi değerlendirme değildir.</p>
        )}
      </div>
    </div>
  );
}

// ── Maç günü çizelgesi oluşturucu ────────────────────────

const KIND_NAME: Record<StepKind, string> = { yemek: 'Yeme', sivi: 'Sıvı', mac: 'Maç', dinlenme: 'Dinlenme', kontrol: 'Kontrol' };
function KindIcon({ k }: { k: StepKind }) {
  if (k === 'sivi') return <Drop />;
  return <Icon name={k === 'yemek' ? 'leaf' : k === 'mac' ? 'ball' : k === 'dinlenme' ? 'heart' : 'clock'} />;
}

export function MatchTimelineBuilder() {
  const [plan] = usePlan();
  const [kick, setKick] = useState('15:00');
  const [dur, setDur] = useState(70);
  const [two, setTwo] = useState(false);
  const [second, setSecond] = useState('17:30');
  const band = AGE_BANDS.find((b) => b.id === plan.band);
  const steps = buildMatchTimeline({ kickoff: kick, band: plan.band, duration: dur, second: two ? second : undefined });
  return (
    <div className="mt card card--pad card--edge" data-mt>
      <div className="mt__form np">
        <div className="field">
          <label htmlFor="mt-kick">Maç başlangıç saati</label>
          <input id="mt-kick" type="time" className="input" value={kick} onChange={(e) => setKick(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="mt-dur">Maç süresi</label>
          <select id="mt-dur" className="select" value={dur} onChange={(e) => setDur(Number(e.target.value))}>
            {[40, 50, 60, 70, 80, 90].map((d) => (
              <option key={d} value={d}>{d} dakika</option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="field__label">Aynı gün ikinci maç</span>
          <label className="check">
            <input type="checkbox" checked={two} onChange={(e) => setTwo(e.target.checked)} data-mt-two />
            <span>Var</span>
          </label>
        </div>
        {two && (
          <div className="field">
            <label htmlFor="mt-second">İkinci maç saati</label>
            <input id="mt-second" type="time" className="input" value={second} onChange={(e) => setSecond(e.target.value)} />
          </div>
        )}
        <PrintButton target="timeline" label="Çizelgeyi yazdır" />
      </div>

      <div data-print-area="timeline">
        <div className="print-only">
          <h3>Maç günü çizelgesi · {kick} · {band?.label}</h3>
          <p>Genel bilgilendirme; kişisel diyetisyen değerlendirmesi değildir.</p>
        </div>
        {steps === null ? (
          <p className="note note--warn" role="alert">Geçerli bir saat gir (örn. 15:00).</p>
        ) : (
          <>
            <p className="mono muted mt__meta" aria-live="polite">
              {band?.label} için örnek çizelge · {steps.length} adım
            </p>
            <ol className="mt__list" data-mt-list>
              {steps.map((s, i) => (
                <li key={`${s.label}-${i}`} className={`mt__s mt__s--${s.kind}`} data-kind={s.kind}>
                  <time className="mt__time mono">{s.label}</time>
                  <span className="mt__ic" title={KIND_NAME[s.kind]}><KindIcon k={s.kind} /></span>
                  <div className="mt__body">
                    <h4>{s.title}</h4>
                    <p>{s.detail}</p>
                    {s.review && steps.findIndex((x) => x.review === s.review) === i && <Rv id={s.review} />}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
        <p className="field__hint mt__foot">Bu çizelge örnektir; kişisel diyetisyen değerlendirmesi değildir. Mide hassasiyeti, maç saati ve yaşa göre değişir; yeni yiyecek maç günü denenmez.</p>
      </div>
    </div>
  );
}
