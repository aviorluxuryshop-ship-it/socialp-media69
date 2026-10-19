'use client';

import { useEffect, useId, useState } from 'react';
import { AGE_NOTES, DAY_PLANS, PORTION_GUIDE } from '@/data/nutrition-guide';
import { ALLERGEN_NAME, MEAL_BY_ID, mealAllergens, mealVegan, mealVegetarian, type Allergen, type Meal } from '@/data/nutrition';
import {
  AGE_BANDS,
  DAY_KEYS,
  DAY_NAME,
  DAY_SLOTS,
  DAY_TYPES,
  DAY_TYPE_LABEL,
  DEFAULT_WEEK,
  SLOT_LABEL,
  SLOTS,
  emptyPlan,
  fillDay,
  mealAllowed,
  mealsForSlot,
  shoppingList,
  type AgeBand,
  type DayKey,
  type DayType,
  type Diet,
  type PlanState,
  type SlotKey,
} from '@/lib/nutrition';
import { usePlan } from '@/lib/nutri-store';
import { Icon } from './Icon';
import { PrintButton } from './NutritionTrackers';
import { Rv } from './NutritionBits';
import { radioNav } from './radioNav';

const alName = (a: Allergen) => ALLERGEN_NAME[a].split(' (')[0].toLowerCase();

// ── Yaş grubu seçici ve yaşa göre not ────────────────────

export function AgeSelector() {
  const [plan, setPlan] = usePlan();
  return (
    <div className="agesel card card--pad" id="yas-grubu" data-age-select>
      <div>
        <p className="eyebrow">Yaşına göre uyarla</p>
        <h2 className="h3">Yaş grubun hangisi?</h2>
        <p className="muted">Uyku süreleri, öğün örnekleri ve notlar yaş grubuna göre değişir. Seçimin yalnızca bu tarayıcıda saklanır.</p>
      </div>
      <div className="seg agesel__seg" role="radiogroup" aria-label="Yaş grubu">
        {AGE_BANDS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={plan.band === b.id}
            tabIndex={plan.band === b.id ? 0 : -1}
            onClick={() => setPlan((p) => ({ ...p, band: b.id }))}
            onKeyDown={(e) => radioNav(e, AGE_BANDS.length, i, (k) => setPlan((p) => ({ ...p, band: AGE_BANDS[k].id })))}
            data-band={b.id}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AgeNote({ topic }: { topic: string }) {
  const [plan] = usePlan();
  const note = AGE_NOTES[topic]?.[plan.band];
  const band = AGE_BANDS.find((b) => b.id === plan.band);
  if (!note) return null;
  return (
    <aside className="agenote card card--pad card--flat" data-agenote={topic} aria-label={`Yaş grubuna göre not: ${band?.label}`}>
      <p className="agenote__l mono">
        <Icon name="user" /> Yaş grubun: {band?.label}
      </p>
      <p>{note.text}</p>
      {note.review && <Rv id={note.review} />}
    </aside>
  );
}

/** Uyku tablosu: seçili yaş grubunun satırı vurgulanır */
export function SleepTable({ rows }: { rows: { age: string; hours: string; src: string; bands: AgeBand[]; note: string }[] }) {
  const [plan] = usePlan();
  return (
    <div className="tablewrap" data-reveal>
      <table className="table table--stack sleeptable" data-sleep role="table">
        <caption className="visually-hidden">Yaşa göre önerilen uyku süresi</caption>
        <thead>
          <tr role="row"><th scope="col" role="columnheader">Yaş</th><th scope="col" role="columnheader">Önerilen süre</th><th scope="col" role="columnheader">Not</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.age} role="row" data-me={r.bands.includes(plan.band) ? 'true' : undefined}>
              <th scope="row" role="rowheader">{r.age}</th>
              <td role="cell" className="sleeptable__h" data-label="Önerilen süre">{r.hours}</td>
              <td role="cell" data-label="Not">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Beslenme tercihi (alerji, vejetaryen/vegan) ──────────

const DIETS: { id: Diet; label: string }[] = [
  { id: 'hepsi', label: 'Her şeyi yerim' },
  { id: 'vejetaryen', label: 'Vejetaryen' },
  { id: 'vegan', label: 'Vegan' },
];

function Prefs() {
  const [plan, setPlan] = usePlan();
  const uid = useId();
  const keys = Object.keys(ALLERGEN_NAME) as Allergen[];
  return (
    <div className="prefs np">
      <div className="field">
        <span className="field__label" id={`${uid}-d`}>Beslenme tercihi</span>
        <div className="seg" role="group" aria-labelledby={`${uid}-d`}>
          {DIETS.map((d) => (
            <button key={d.id} type="button" aria-pressed={plan.diet === d.id} onClick={() => setPlan((p) => ({ ...p, diet: d.id }))} data-diet={d.id}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field__label" id={`${uid}-a`}>Kaçındığım alerjenler</span>
        <div className="chips" role="group" aria-labelledby={`${uid}-a`}>
          {keys.map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={plan.avoid.includes(a)} onClick={() => setPlan((p) => ({ ...p, avoid: p.avoid.includes(a) ? p.avoid.filter((x) => x !== a) : [...p.avoid, a] }))} data-avoid={a}>
              {alName(a)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MealTags({ m }: { m: Meal }) {
  const al = mealAllergens(m);
  return (
    <p className="mc__foot mono">
      {mealVegan(m) ? 'vegan' : mealVegetarian(m) ? 'vejetaryen' : 'hayvansal'} · {m.prep}
      {' · '}
      Alerjen: {al.length ? al.map(alName).join(', ') : 'yok'}
    </p>
  );
}

// ── Örnek günlük planlar ─────────────────────────────────

export function DayPlans() {
  const [plan, setPlan] = usePlan();
  const [day, setDay] = useState<DayType>('antrenman');
  const band = plan.band;
  const raw = DAY_PLANS[band][day];
  const filled = fillDay(day, raw.slots, plan.avoid, plan.diet);
  const slots = SLOTS.filter((s) => raw.slots[s] || filled[s]);
  const changed = slots.filter((s) => raw.slots[s] && filled[s] !== raw.slots[s]).length;
  return (
    <div className="dp" data-dayplans>
      <div className="dp__bar np">
        <div className="field">
          <span className="field__label" id="dp-band-l">Yaş grubu</span>
          <div className="seg" role="group" aria-labelledby="dp-band-l">
            {AGE_BANDS.map((b) => (
              <button key={b.id} type="button" aria-pressed={band === b.id} onClick={() => setPlan((p) => ({ ...p, band: b.id }))} data-dp-band={b.id}>
                {b.short}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field__label" id="dp-day-l">Gün tipi</span>
          <div className="seg" role="group" aria-labelledby="dp-day-l">
            {DAY_TYPES.map((d) => (
              <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)} data-dp-day={d}>
                {DAY_TYPE_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Prefs />
      {changed > 0 && (
        <p className="note np" role="status">
          <Icon name="info" />
          <span>Alerji ve tercihlerine göre {changed} öğün başka bir öğünle değiştirildi.</span>
        </p>
      )}
      <div className="dp__grid">
        <ol className="dp__slots" aria-label={`${AGE_BANDS.find((b) => b.id === band)?.label}, ${DAY_TYPE_LABEL[day]} örnek planı`}>
          {slots.map((s) => {
            const id = filled[s];
            const m = id ? MEAL_BY_ID[id] : undefined;
            return (
              <li key={s} className="mc card card--hover" data-slot={s}>
                <p className="mono mc__slot">{SLOT_LABEL[s]}</p>
                {m ? (
                  <>
                    <h4 className="mc__t">{m.name}</h4>
                    <ul className="chips mc__parts">{m.parts.map((p) => <li key={p} className="tag">{p}</li>)}</ul>
                    <MealTags m={m} />
                  </>
                ) : (
                  <p className="muted">Tercihlerine uygun bir öğün bulunamadı; Alerji bölümündeki araçları kullan ya da bir diyetisyene danış.</p>
                )}
              </li>
            );
          })}
        </ol>
        <aside className="dp__side">
          <div className="card card--pad card--flat">
            <h4 className="h3">Porsiyon kılavuzu</h4>
            <ul className="ticks">{PORTION_GUIDE[band].map((t) => <li key={t}>{t}</li>)}</ul>
            <Rv id="porsiyon" />
          </div>
          <div className="card card--pad card--flat">
            <h4 className="h3">Bu günün ipuçları</h4>
            <ul className="ticks">{raw.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            <Rv id="menuler" />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Haftalık planlayıcı + alışveriş listesi ──────────────

export function WeeklyPlanner() {
  const [plan, setPlan] = usePlan();
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  /** Planı silen ya da üzerine yazan işlemden önceki kayıt: kısa süre geri alınabilir (veri kaybı koruması) */
  const [undo, setUndo] = useState<{ plan: PlanState; what: string } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), 20_000);
    return () => window.clearTimeout(t);
  }, [undo]);
  const hasContent = (p: PlanState) => p.ticked.length > 0 || DAY_KEYS.some((k) => Object.keys(p.days[k].slots).length > 0);
  const remember = (what: string) => setUndo(hasContent(plan) ? { plan, what } : null);
  const list = shoppingList(plan);
  const badCount = DAY_KEYS.reduce(
    (n, k) => n + DAY_SLOTS[plan.days[k].type].filter((s) => { const id = plan.days[k].slots[s]; return id && MEAL_BY_ID[id] && !mealAllowed(MEAL_BY_ID[id], plan.avoid, plan.diet); }).length,
    0,
  );
  const total = list.reduce((n, g) => n + g.items.length, 0);

  const autofill = () => {
    remember('Plan önerilen düzenle dolduruldu');
    setPlan((p) => {
      const next = emptyPlan(p.band);
      next.diet = p.diet;
      next.avoid = p.avoid;
      next.ticked = [];
      for (const k of DAY_KEYS) {
        const type = p.days[k].type;
        next.days[k] = { type, slots: fillDay(type, DAY_PLANS[p.band][type].slots, p.avoid, p.diet) };
      }
      return next;
    });
  };
  const clear = () => {
    remember('Plan ve alışveriş işaretleri temizlendi');
    setPlan((p) => {
      const next = emptyPlan(p.band);
      next.diet = p.diet;
      next.avoid = p.avoid;
      return next;
    });
  };
  const restore = () => {
    if (!undo) return;
    const prev = undo.plan;
    setPlan(() => prev);
    setUndo(null);
  };
  const setType = (k: DayKey, type: DayType) => {
    const dropped = Object.keys(plan.days[k].slots).filter((s) => !DAY_SLOTS[type].includes(s as SlotKey)).length;
    setUndo(dropped > 0 ? { plan, what: `${DAY_NAME[k]} gün tipi değişti; ${dropped} öğün çıkarıldı` } : null);
    setPlan((p) => ({ ...p, days: { ...p.days, [k]: { type, slots: Object.fromEntries(Object.entries(p.days[k].slots).filter(([s]) => DAY_SLOTS[type].includes(s as SlotKey))) } } }));
  };
  const setSlot = (k: DayKey, s: SlotKey, id: string) => {
    setUndo(null);
    setPlan((p) => {
      const slots = { ...p.days[k].slots };
      if (id) slots[s] = id;
      else delete slots[s];
      return { ...p, days: { ...p.days, [k]: { ...p.days[k], slots } } };
    });
  };
  const tick = (id: string) => setPlan((p) => ({ ...p, ticked: p.ticked.includes(id) ? p.ticked.filter((x) => x !== id) : [...p.ticked, id] }));
  const copy = async () => {
    const text = list.map((g) => `${g.title}\n${g.items.map((i) => `- ${i.name}${i.count > 1 ? ` (${i.count} öğün)` : ''}`).join('\n')}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
    window.setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="wp" data-planner>
      <Prefs />
      <div className="wp__tools np">
        <button type="button" className="btn btn--primary" onClick={autofill} data-wp-fill>
          <Icon name="refresh" /> Önerilen planla doldur
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} data-wp-clear>
          <Icon name="trash" /> Temizle
        </button>
        <PrintButton target="plan" label="Planı ve listeyi yazdır" />
        <span className="mono muted wp__band">Yaş grubu: {AGE_BANDS.find((b) => b.id === plan.band)?.label}</span>
      </div>

      {badCount > 0 && (
        <p className="note note--warn np" role="status" data-wp-bad>
          <Icon name="warn" />
          <span>{badCount} öğün seçtiğin alerjen ya da beslenme tercihine uymuyor. Alışveriş listesi bu öğünlerin içeriğini de kapsar; “Önerilen planla doldur” uygun öğünlerle yeniler (önceki plan geri alınabilir).</span>
        </p>
      )}

      {undo && (
        <p className="note np" role="status" data-wp-undo>
          <Icon name="info" />
          <span>{undo.what}.</span>
          <button type="button" className="btn btn--quiet" onClick={restore} data-wp-undo-btn>
            Geri al
          </button>
        </p>
      )}

      <div data-print-area="plan">
        <div className="print-only">
          <h3>Haftalık öğün planı ve alışveriş listesi</h3>
          <p>Genel bilgilendirme; kişisel diyetisyen değerlendirmesi değildir.</p>
        </div>

        <div className="wp__days wp__screen">
          {DAY_KEYS.map((k) => {
            const d = plan.days[k];
            return (
              <section key={k} className="wp__day card card--pad" aria-label={DAY_NAME[k]} data-day={k}>
                <header className="wp__dh">
                  <h4>{DAY_NAME[k]}</h4>
                  <select className="select wp__type" aria-label={`${DAY_NAME[k]} gün tipi`} value={d.type} onChange={(e) => setType(k, e.target.value as DayType)}>
                    {DAY_TYPES.map((t) => <option key={t} value={t}>{DAY_TYPE_LABEL[t]}</option>)}
                  </select>
                </header>
                {DAY_SLOTS[d.type].map((s) => {
                  const cur = d.slots[s];
                  const opts = mealsForSlot(s).filter((m) => mealAllowed(m, plan.avoid, plan.diet) || m.id === cur);
                  const bad = cur && !mealAllowed(MEAL_BY_ID[cur], plan.avoid, plan.diet);
                  return (
                    <div key={s} className="wp__slot">
                      <label htmlFor={`wp-${k}-${s}`}>{SLOT_LABEL[s]}</label>
                      <select id={`wp-${k}-${s}`} className="select" value={cur ?? ''} onChange={(e) => setSlot(k, s, e.target.value)} data-wp-slot={`${k}-${s}`}>
                        <option value="">—</option>
                        {opts.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      {bad && <small className="wp__bad">Bu öğün tercihine uymuyor.</small>}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>

        <table className="wp__sum print-only">
          <thead><tr><th>Gün</th><th>Öğünler</th></tr></thead>
          <tbody>
            {DAY_KEYS.map((k) => (
              <tr key={k}>
                <th scope="row">{DAY_NAME[k]} · {DAY_TYPE_LABEL[plan.days[k].type]}</th>
                <td>
                  {DAY_SLOTS[plan.days[k].type].filter((s) => plan.days[k].slots[s]).map((s) => `${SLOT_LABEL[s]}: ${MEAL_BY_ID[plan.days[k].slots[s] as string].name}`).join(' · ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="shop card card--pad card--edge" data-shop>
          <div className="shop__h">
            <div>
              <p className="eyebrow">Alışveriş listesi</p>
              <h4 className="h3">{total ? `${total} ürün` : 'Liste boş'}</h4>
            </div>
            {total > 0 && (
              <button type="button" className="btn btn--ghost btn--sm np" onClick={copy}>
                <Icon name="copy" /> {copied === 'ok' ? 'Kopyalandı' : copied === 'fail' ? 'Kopyalanamadı: yazdırmayı dene' : 'Listeyi kopyala'}
              </button>
            )}
          </div>
          {total === 0 ? (
            <p className="muted">Öğünleri seçtikçe ya da “Önerilen planla doldur”a bastıkça liste burada oluşur. Miktar verilmez; kaç öğünde geçtiği gösterilir.</p>
          ) : (
            <div className="shop__groups">
              {list.map((g) => (
                <div key={g.title} className="shop__g">
                  <h5>{g.title}</h5>
                  <ul>
                    {g.items.map((i) => (
                      <li key={i.id}>
                        <label className="check">
                          <input type="checkbox" checked={plan.ticked.includes(i.id)} onChange={() => tick(i.id)} data-shop-item={i.id} />
                          <span>{i.name}{i.count > 1 && <small className="mono"> · {i.count} öğün</small>}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="field__hint">Plan örnektir; kişisel diyetisyen değerlendirmesi değildir. Alerjin ciddiyse etiketleri kontrol et. Bu plan yalnızca bu tarayıcıda saklanır ve yedek dosyasına dâhil değildir.</p>
      </div>
      <p className="np"><Rv id="alerjen" /> <Rv id="menuler" /></p>
    </div>
  );
}

void DEFAULT_WEEK;
