'use client';

import Link from 'next/link';
import { useState } from 'react';
import { POSITIONS, type PositionId } from '@/lib/types';
import { Icon } from './Icon';

export interface PlayerLite {
  id: string;
  name: string;
  pos: PositionId;
  role: string;
  tagline: string;
}

export function PlayerGrid({ players }: { players: PlayerLite[] }) {
  const [pos, setPos] = useState<PositionId | 'all'>('all');
  const shown = players.filter((p) => pos === 'all' || p.pos === pos);
  const present = POSITIONS.filter((p) => players.some((x) => x.pos === p.id));
  return (
    <>
      <div className="chips" role="group" aria-label="Pozisyona göre filtrele" style={{ marginBottom: 24 }}>
        <button type="button" className="chip" aria-pressed={pos === 'all'} onClick={() => setPos('all')}>
          Hepsi <span className="count">{players.length}</span>
        </button>
        {present.map((p) => (
          <button key={p.id} type="button" className="chip" aria-pressed={pos === p.id} onClick={() => setPos(p.id)}>
            {p.name} <span className="count">{players.filter((x) => x.pos === p.id).length}</span>
          </button>
        ))}
      </div>
      <ul className="player-grid">
        {shown.map((p) => (
          <li key={p.id}>
            <Link href={`/analiz/oyuncular/${p.id}/`} className="card card--marks player-card">
              <span className="mono muted">{POSITIONS.find((x) => x.id === p.pos)?.name}</span>
              <h3 className="player-card__name">{p.name}</h3>
              <span className="player-card__role">{p.role}</span>
              <p className="player-card__tag">{p.tagline}</p>
              <span className="player-card__go mono">Analizi aç <Icon name="arrow" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
