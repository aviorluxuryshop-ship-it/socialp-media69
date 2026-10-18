'use client';

import { useMemo, useState } from 'react';
import {
  ALLERGEN_NAME,
  FOODS,
  FOOD_BY_ID,
  MEALS,
  ROLE_NAME,
  WHEN_NAME,
  alternativesFor,
  mealAllergens,
  mealVegan,
  mealVegetarian,
  type Allergen,
  type MealWhen,
} from '@/data/nutrition';
import { norm } from '@/lib/utils';
import { isMinor } from '@/lib/nutrition';
import { usePlan } from '@/lib/nutri-store';
import { Icon } from './Icon';

type Diet = 'hepsi' | 'vejetaryen' | 'vegan';

function DietControls({ avoid, setAvoid, diet, setDiet }: { avoid: Allergen[]; setAvoid: (a: Allergen[]) => void; diet: Diet; setDiet: (d: Diet) => void }) {
  return (
    <div className="stack" style={{ '--stack': '1.2rem' } as React.CSSProperties}>
      <div className="field">
        <span className="field__label">Beslenme tercihi</span>
        <div className="seg" role="group" aria-label="Beslenme tercihi">
          {(['hepsi', 'vejetaryen', 'vegan'] as Diet[]).map((d) => (
            <button key={d} type="button" aria-pressed={diet === d} onClick={() => setDiet(d)}>
              {d === 'hepsi' ? 'Her şeyi yerim' : d === 'vejetaryen' ? 'Vejetaryen' : 'Vegan'}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field__label">Alerjim / yiyemediğim</span>
        <div className="chips">
          {(Object.keys(ALLERGEN_NAME) as Allergen[]).map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={avoid.includes(a)} onClick={() => setAvoid(avoid.includes(a) ? avoid.filter((x) => x !== a) : [...avoid, a])}>
              {ALLERGEN_NAME[a].split(' (')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MealFinder() {
  const [when, setWhen] = useState<MealWhen | ''>('');
  const [avoid, setAvoid] = useState<Allergen[]>([]);
  const [diet, setDiet] = useState<Diet>('hepsi');
  const list = useMemo(
    () =>
      MEALS.filter(
        (m) =>
          (!when || m.when.includes(when)) &&
          !mealAllergens(m).some((a) => avoid.includes(a)) &&
          (diet === 'hepsi' || (diet === 'vejetaryen' ? mealVegetarian(m) : mealVegan(m))),
      ),
    [when, avoid, diet],
  );
  return (
    <div>
      <div className="grid cols-2" style={{ '--gap': '28px', marginBottom: 28 } as React.CSSProperties}>
        <div className="field">
          <span className="field__label">Ne zaman?</span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={!when} onClick={() => setWhen('')}>Hepsi</button>
            {(Object.keys(WHEN_NAME) as MealWhen[]).map((w) => (
              <button key={w} type="button" className="chip" aria-pressed={when === w} onClick={() => setWhen(when === w ? '' : w)}>
                {WHEN_NAME[w]}
              </button>
            ))}
          </div>
        </div>
        <DietControls avoid={avoid} setAvoid={setAvoid} diet={diet} setDiet={setDiet} />
      </div>
      <p className="mono muted" style={{ marginBottom: 14 }} aria-live="polite">{list.length} öğün önerisi</p>
      {list.length === 0 ? (
        <div className="empty"><h3 className="h3">Bu filtreye uygun öğün yok</h3><p>Filtreleri gevşetin; alternatif bulucuyla yiyecekleri tek tek değiştirebilirsiniz.</p></div>
      ) : (
        <ul className="meal-grid">
          {list.map((m) => (
            <li key={m.id} className="card meal">
              <p className="mono muted">{m.when.map((w) => WHEN_NAME[w]).join(' · ')}</p>
              <h3 className="meal__t">{m.name}</h3>
              <ul className="chips" style={{ gap: 6 }}>{m.parts.map((p) => <li key={p} className="tag">{p}</li>)}</ul>
              <p className="meal__why">{m.why}</p>
              <p className="meal__foot mono">
                {m.prep}
                {mealVegan(m) ? ' · vegan' : mealVegetarian(m) ? ' · vejetaryen' : ''}
                {mealAllergens(m).length > 0 && ` · içerir: ${mealAllergens(m).map((a) => ALLERGEN_NAME[a].split(' (')[0].toLowerCase()).join(', ')}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AlternativeFinder() {
  const [plan] = usePlan();
  const minor = isMinor(plan.band);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState('tavuk');
  const [avoid, setAvoid] = useState<Allergen[]>([]);
  const [diet, setDiet] = useState<Diet>('hepsi');
  const [cheap, setCheap] = useState(false);
  const [forPost, setForPost] = useState(false);
  const [exclude, setExclude] = useState<string[]>([]);

  const matches = useMemo(() => {
    const nq = norm(q);
    return FOODS.filter((f) => !nq || norm(f.name).includes(nq)).slice(0, 12);
  }, [q]);
  const food = FOOD_BY_ID[picked];
  const alts = useMemo(
    () => alternativesFor(food, { avoid, vegetarian: diet !== 'hepsi', vegan: diet === 'vegan', cheap, exclude, forPre: false, forPost, minor }).slice(0, 8),
    [food, avoid, diet, cheap, exclude, forPost, minor],
  );

  return (
    <div className="grid cols-2" style={{ '--gap': '28px' } as React.CSSProperties}>
      <div className="panel">
        <p className="panel__title">1 · Hangi yiyeceğe alternatif arıyorsun?</p>
        <div className="field">
          <label htmlFor="alt-q">Yiyecek ara</label>
          <input id="alt-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Örn. tavuk, süt, yumurta, makarna…" autoComplete="off" />
        </div>
        <ul className="chips" style={{ marginTop: 12 }}>
          {matches.map((f) => (
            <li key={f.id}>
              <button type="button" className="chip" aria-pressed={picked === f.id} onClick={() => setPicked(f.id)}>
                {f.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="note" style={{ marginTop: 18 }}>
          <Icon name="info" />
          <p><strong>{food.name}</strong> — {ROLE_NAME[food.role]}. {food.note}</p>
        </div>
        <p className="panel__title" style={{ marginTop: 28 }}>2 · Kısıtlarını belirt</p>
        <DietControls avoid={avoid} setAvoid={setAvoid} diet={diet} setDiet={setDiet} />
        <div className="stack" style={{ '--stack': '12px', marginTop: 18 } as React.CSSProperties}>
          <label className="check"><input type="checkbox" checked={cheap} onChange={(e) => setCheap(e.target.checked)} /><span>Pahalı olmayanlar</span></label>
          <label className="check"><input type="checkbox" checked={forPost} onChange={(e) => setForPost(e.target.checked)} /><span>Antrenman sonrası için uygun olanlar</span></label>
        </div>
      </div>
      <div className="panel">
        <p className="panel__title">3 · Alternatifler</p>
        {alts.length === 0 ? (
          <p className="muted">Bu kısıtlarla uygun alternatif bulunamadı. Bazı kısıtları kaldırmayı deneyin; gerekiyorsa bir diyetisyene danışın.</p>
        ) : (
          <ul className="alts">
            {alts.map(({ food: f, reason }) => (
              <li key={f.id}>
                <div>
                  <p className="alts__t">{f.name}</p>
                  <p className="alts__r">{reason} {f.note}</p>
                  <p className="mono muted" style={{ fontSize: '.62rem', marginTop: 4 }}>
                    {f.vegan ? 'vegan' : f.vegetarian ? 'vejetaryen' : 'hayvansal'}
                    {f.allergens.length > 0 && ` · içerir: ${f.allergens.map((a) => ALLERGEN_NAME[a].split(' (')[0].toLowerCase()).join(', ')}`}
                    {f.mayContain.length > 0 && ` · içerebilir: ${f.mayContain.map((a) => ALLERGEN_NAME[a].split(' (')[0].toLowerCase()).join(', ')}`}
                    {' · '}{'₺'.repeat(f.cost)}
                  </p>
                </div>
                <button type="button" className="btn btn--quiet" onClick={() => setExclude([...exclude, f.id])} aria-label={`${f.name} önerisini gizle`}>
                  Bunu sevmem
                </button>
              </li>
            ))}
          </ul>
        )}
        {exclude.length > 0 && (
          <p style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--quiet" onClick={() => setExclude([])}>Gizlenen {exclude.length} öneriyi geri getir</button>
          </p>
        )}
        <p className="field__hint" style={{ marginTop: 16 }}>Alerjin ciddiyse yiyecek etiketlerini mutlaka kontrol edin ve hekimine danış. Bu araç genel bilgi verir, tıbbi değerlendirme yerine geçmez.</p>
      </div>
    </div>
  );
}
