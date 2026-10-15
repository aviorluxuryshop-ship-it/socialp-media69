'use client';

import { useEffect } from 'react';
import { CAT_BY_ID } from '@/data/categories';
import type { Drill } from '@/data/types';
import { markPracticed, recordVisit, setTechLevel, toggleFav, useMeta, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { LEVEL_HINTS, LEVEL_NAMES, type CategoryId, type Level } from '@/lib/types';
import { fmtDate } from '@/lib/utils';
import { Icon } from './Icon';
import { StarRating } from './StarRating';

const selLevels = (s: { levels: Record<string, { level: Level; at: string }> }) => s.levels;
const selProfileLevel = (s: { profile: { level: Level } }) => s.profile.level;
const selPracticed = (s: { practiced: Record<string, { count: number; last: string }> }) => s.practiced;
const selFav = (s: { fav: string[] }) => s.fav;

function useMyLevel(id: string) {
  const levels = useStore(selLevels);
  const base = useStore(selProfileLevel);
  const own = levels[id]?.level;
  return { level: (own ?? base) as Level, own };
}

export function TechLevelCard({ id, name }: { id: string; name: string }) {
  const { level, own } = useMyLevel(id);
  const practiced = useStore(selPracticed)[id];
  const fav = useStore(selFav).includes(id);
  const { ready } = useMeta();

  useEffect(() => {
    if (ready) recordVisit(`/teknikler/${id}/`, name);
  }, [ready, id, name]);

  return (
    <div className="card card--marks card--pad levelcard">
      <p className="panel__title">
        <span>Bu teknikte seviyem</span>
        {own ? <span className="tag tag--brass">Kaydedildi</span> : <span className="tag">Genel seviye</span>}
      </p>
      <StarRating
        value={level}
        size="lg"
        label={`${name} için yetenek seviyeniz`}
        onChange={(v) => {
          setTechLevel(id, v);
          toast(`Seviyeniz kaydedildi: ${'★'.repeat(v)} ${LEVEL_NAMES[v]}`);
        }}
      />
      <p className="levelcard__hint">{LEVEL_HINTS[level]}.</p>
      {!own && <p className="field__hint">Henüz bu teknik için seçim yapmadınız; genel seviyeniz kullanılıyor. Yıldıza dokunarak değiştirebilirsiniz.</p>}
      <div className="levelcard__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => {
            markPracticed(id);
            toast('Çalışma kaydedildi. Eline sağlık!');
          }}
        >
          <Icon name="check" /> Çalıştım
        </button>
        <button type="button" className={`btn btn--ghost btn--sm ${fav ? 'btn--on' : ''}`} onClick={() => toggleFav(id)} aria-pressed={fav}>
          <Icon name="heart" /> {fav ? 'Favoride' : 'Favori'}
        </button>
      </div>
      {practiced && (
        <p className="field__hint" style={{ marginTop: 12 }}>
          {practiced.count} kez çalıştınız · son: {fmtDate(practiced.last.slice(0, 10))}
        </p>
      )}
    </div>
  );
}

export function DrillList({ id, cat, drills }: { id: string; cat: CategoryId; drills: Drill[] }) {
  const { level } = useMyLevel(id);
  const focus = CAT_BY_ID[cat].focus[level];

  const now = drills.filter((d) => d.lvl === level);
  const next = drills.filter((d) => d.lvl === level + 1);
  const basics = drills.filter((d) => d.lvl < level);
  const later = drills.filter((d) => d.lvl > level + 1);

  const Item = ({ d, tone }: { d: Drill; tone?: string }) => (
    <li className={`drill ${tone ?? ''}`}>
      <div className="drill__lv">
        <StarRating value={d.lvl} readOnly size="sm" showName={false} label="Alıştırma seviyesi" />
      </div>
      <h4 className="drill__name">{d.name}</h4>
      <p className="drill__how">{d.how}</p>
      <p className="drill__dose mono">{d.dose}</p>
    </li>
  );

  return (
    <div className="drills">
      <div className="note" style={{ marginBottom: 24 }}>
        <Icon name="target" />
        <p>
          <strong>
            {'★'.repeat(level)} {LEVEL_NAMES[level]} odağı:
          </strong>{' '}
          {focus}
        </p>
      </div>

      {now.length > 0 && (
        <>
          <h3 className="drills__h mono">Şimdi çalış</h3>
          <ul className="drills__list">{now.map((d) => <Item key={d.name} d={d} tone="drill--now" />)}</ul>
        </>
      )}
      {next.length > 0 && (
        <>
          <h3 className="drills__h mono">Sıradaki hedef</h3>
          <ul className="drills__list">{next.map((d) => <Item key={d.name} d={d} />)}</ul>
        </>
      )}
      {basics.length > 0 && (
        <details className="drills__more">
          <summary className="mono">Temel pekiştirme ({basics.length})</summary>
          <ul className="drills__list">{basics.map((d) => <Item key={d.name} d={d} tone="drill--dim" />)}</ul>
        </details>
      )}
      {later.length > 0 && (
        <details className="drills__more">
          <summary className="mono">İleri seviye — henüz değil ({later.length})</summary>
          <ul className="drills__list">{later.map((d) => <Item key={d.name} d={d} tone="drill--dim" />)}</ul>
        </details>
      )}
      {now.length + next.length === 0 && <p className="muted">Bu seviye için ayrı bir alıştırma yok; aşağıdaki diğer seviyelere göz atın.</p>}
    </div>
  );
}
