'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EXCAT_NAME, MUSCLE_NAME, type Env, type ExCat, type MuscleId } from '@/data/exercises';
import { buildIndex, search } from '@/lib/search';
import { useStore, type AppState } from '@/lib/store';
import { ENV_NAME, ENV_ORDER, EQUIP_NAME, availableEquip, equipUnion } from '@/lib/environments';
import { allowedFor } from '@/lib/training';
import type { Exercise } from '@/data/exercises';
import { Icon } from './Icon';
import { MuscleMap } from './MuscleMap';
import { StarRating } from './StarRating';

export type ExLite = Pick<Exercise, 'id' | 'name' | 'cat' | 'muscles' | 'secondary' | 'env' | 'equip' | 'lv' | 'minAge' | 'why'>;

const selProfile = (s: AppState) => s.profile;
const ENVS: { id: Env; name: string }[] = ENV_ORDER.map((id) => ({ id, name: ENV_NAME[id] }));

/** Egzersiz, kullanıcının seçtiği ortamlardan en az birinde, o ortamda seçtiği ekipmanla yapılabiliyor mu? */
function fitsMine(e: Exercise, p: AppState['profile']): boolean {
  return p.envs.some((env) => e.env.includes(env) && e.equip.every((q) => q === 'yok' || availableEquip(env, p.equipByEnv[env] ?? [], p.age).has(q)));
}

export function ExerciseLibrary({ items }: { items: ExLite[] }) {
  const profile = useStore(selProfile);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ExCat | ''>('');
  const [muscle, setMuscle] = useState<MuscleId | ''>('');
  const [env, setEnv] = useState<Env | ''>('');
  const [mine, setMine] = useState(false);
  const [safe, setSafe] = useState(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const k = sp.get('kas');
    if (k && MUSCLE_NAME[k]) setMuscle(k as MuscleId);
    const c = sp.get('kategori');
    if (c && c in EXCAT_NAME) setCat(c as ExCat);
    const qq = sp.get('q');
    if (qq) setQ(qq);
  }, []);

  const index = useMemo(
    () =>
      buildIndex(
        items.map((e) => ({
          k: 'egzersiz' as const,
          t: e.name,
          d: e.why,
          u: e.id,
          x: e.muscles.map((m) => MUSCLE_NAME[m]).join(' ') + ' ' + EXCAT_NAME[e.cat],
          c: EXCAT_NAME[e.cat],
        })),
      ),
    [items],
  );

  const list = useMemo(() => {
    let base = items;
    if (q.trim()) {
      const hit = search(index, q, 200);
      const rank = new Map(hit.map((h, i) => [h.u, i]));
      base = items.filter((e) => rank.has(e.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    }
    return base.filter(
      (e) =>
        (!cat || e.cat === cat) &&
        (!muscle || e.muscles.includes(muscle) || e.secondary.includes(muscle)) &&
        (!env || e.env.includes(env)) &&
        (!mine || fitsMine(e as Exercise, profile)) &&
        (!safe || profile.age === null || allowedFor(e as Exercise, profile.age)),
    );
  }, [items, index, q, cat, muscle, env, mine, safe, profile]);

  const countCat = (c: ExCat) => items.filter((e) => e.cat === c).length;

  return (
    <div className="exlib">
      <div className="exlib__side">
        <div className="panel">
          <p className="panel__title">
            <span>Kas grubuna göre</span>
            {muscle && (
              <button type="button" className="btn btn--quiet" onClick={() => setMuscle('')}>
                Temizle
              </button>
            )}
          </p>
          <MuscleMap selected={muscle} onPick={(m) => setMuscle(muscle === m ? '' : m)} />
          <p className="field__hint" style={{ textAlign: 'center', marginTop: 8 }}>
            {muscle ? <b style={{ color: 'var(--brass-hi)' }}>{MUSCLE_NAME[muscle]}</b> : 'Bir bölgeye dokunun'}
          </p>
        </div>
      </div>

      <div className="exlib__main">
        <div className="lib__search" style={{ marginBottom: 16 }}>
          <Icon name="search" />
          <input type="search" className="lib__input" placeholder="Egzersiz ara: çömelme, plank, sprint, esneme…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Egzersiz ara" autoComplete="off" />
          {q && (
            <button type="button" className="icon-btn" onClick={() => setQ('')} aria-label="Temizle">
              <Icon name="close" />
            </button>
          )}
        </div>
        <div className="chips" role="group" aria-label="Kategori">
          <button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat('')}>
            Tümü <span className="count">{items.length}</span>
          </button>
          {(Object.keys(EXCAT_NAME) as ExCat[]).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)}>
              {EXCAT_NAME[c]} <span className="count">{countCat(c)}</span>
            </button>
          ))}
        </div>
        <div className="exlib__tools">
          <div className="seg" role="group" aria-label="Ortam">
            <button type="button" aria-pressed={!env} onClick={() => setEnv('')}>Tüm ortamlar</button>
            {ENVS.map((e) => (
              <button key={e.id} type="button" aria-pressed={env === e.id} onClick={() => setEnv(env === e.id ? '' : e.id)}>
                {e.name}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
            <span>Seçtiğim ortam ve ekipmana uygun ({equipUnion(profile.equipByEnv, profile.envs).map((x) => EQUIP_NAME[x]).join(', ') || 'ekipmansız'})</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={safe} onChange={(e) => setSafe(e.target.checked)} />
            <span>{profile.age === null ? 'Yaşa uygun olanlar (profilde yaşınızı girin)' : `Yaşıma (${profile.age}) uygun olanlar`}</span>
          </label>
        </div>

        <p className="mono muted" style={{ margin: '18px 0 14px' }} aria-live="polite">
          {list.length} / {items.length} egzersiz
        </p>
        {list.length === 0 ? (
          <div className="empty">
            <h3 className="h3">Egzersiz bulunamadı</h3>
            <p>Filtreleri gevşetin ya da farklı bir kelime deneyin.</p>
          </div>
        ) : (
          <ul className="ex-grid">
            {list.map((e) => (
              <li key={e.id}>
                <Link href={`/fiziksel/${e.id}/`} className="card ex-card">
                  <div className="ex-card__top">
                    <span className="tag tag--brass">{EXCAT_NAME[e.cat]}</span>
                    <StarRating value={e.lv} readOnly size="sm" showName={false} label="Zorluk" />
                  </div>
                  <h3 className="ex-card__name">{e.name}</h3>
                  <p className="ex-card__m">{e.muscles.map((m) => MUSCLE_NAME[m].split(' (')[0]).join(' · ')}</p>
                  <p className="ex-card__why">{e.why}</p>
                  <p className="ex-card__foot mono">
                    {e.env.map((x) => ENVS.find((v) => v.id === x)?.name).join(' · ')}
                    {e.equip[0] !== 'yok' && ` · ${e.equip.map((x) => EQUIP_NAME[x]).join(', ')}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
