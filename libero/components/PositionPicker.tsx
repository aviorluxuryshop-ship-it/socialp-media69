'use client';

import Link from 'next/link';
import { setProfile, useStore } from '@/lib/store';
import { POSITIONS, type PositionId } from '@/lib/types';
import { Icon } from './Icon';

const selPositions = (s: { profile: { positions: PositionId[] } }) => s.profile.positions;

export interface PosLite {
  id: PositionId;
  name: string;
  tagline: string;
  keyTechs: string[];
  think: string;
}
export interface TechLite {
  id: string;
  name: string;
  lv: number;
}

export function PositionPicker({ profiles, techs }: { profiles: PosLite[]; techs: TechLite[] }) {
  const mine = useStore(selPositions);
  const toggle = (id: PositionId) => setProfile({ positions: mine.includes(id) ? mine.filter((x) => x !== id) : [...mine, id] });
  const byId = new Map(techs.map((t) => [t.id, t]));
  const suggested: TechLite[] = [];
  const seen = new Set<string>();
  for (const p of profiles.filter((p) => mine.includes(p.id))) {
    for (const id of p.keyTechs.slice(0, 6)) {
      const t = byId.get(id);
      if (t && !seen.has(id)) {
        seen.add(id);
        suggested.push(t);
      }
    }
  }
  return (
    <>
      <ul className="pos-grid">
        {profiles.map((p) => {
          const on = mine.includes(p.id);
          const short = POSITIONS.find((x) => x.id === p.id)?.short;
          return (
            <li key={p.id}>
              <div className={`card pos-card ${on ? 'pos-card--on' : ''}`}>
                <div className="pos-card__top">
                  <span className="pos-card__short num">{short}</span>
                  <button type="button" className={`chip ${on ? 'chip--on' : ''}`} aria-pressed={on} onClick={() => toggle(p.id)}>
                    {on ? <><Icon name="check" style={{ width: 14, height: 14 }} /> Seçili</> : 'Pozisyonum'}
                  </button>
                </div>
                <h3 className="pos-card__name">{p.name}</h3>
                <p className="pos-card__tag">{p.tagline}</p>
                <p className="pos-card__think">“{p.think}”</p>
                <Link href={`/pozisyonlar/${p.id}/`} className="btn btn--quiet">
                  Gelişim planını aç <Icon name="arrow" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="panel" style={{ marginTop: 32 }}>
        <p className="panel__title">
          <span>Senin için önerilenler</span>
          <span className="tag">{mine.length ? `${mine.length} pozisyon seçili` : 'Pozisyon seçilmedi'}</span>
        </p>
        {mine.length === 0 ? (
          <p className="muted">Yukarıdan bir ya da birkaç pozisyon seçin; seçimleriniz programınızı ve önerilerinizi şekillendirir. Seçimler bu tarayıcıda saklanır.</p>
        ) : (
          <>
            <ul className="chips">
              {suggested.map((t) => (
                <li key={t.id}>
                  <Link href={`/teknikler/${t.id}/`} className="chip">{t.name}</Link>
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 20 }}>
              <Link href="/program/" className="btn btn--primary btn--sm">Bu pozisyonlara göre program oluştur <Icon name="arrow" /></Link>
            </p>
          </>
        )}
      </div>
    </>
  );
}

export function SetPositionButton({ id }: { id: PositionId }) {
  const mine = useStore(selPositions);
  const on = mine.includes(id);
  return (
    <button
      type="button"
      className={`btn btn--sm ${on ? 'btn--ghost btn--on' : 'btn--primary'}`}
      aria-pressed={on}
      onClick={() => setProfile({ positions: on ? mine.filter((x) => x !== id) : [...mine, id] })}
    >
      <Icon name={on ? 'check' : 'plus'} /> {on ? 'Pozisyonum olarak seçili' : 'Bu benim pozisyonum'}
    </button>
  );
}
