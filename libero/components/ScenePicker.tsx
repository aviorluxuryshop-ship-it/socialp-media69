'use client';

import { useState } from 'react';
import type { Scene } from '@/lib/types';
import { SceneView } from './pitch/SceneView';

export interface PickItem {
  id: string;
  name: string;
  blurb: string;
  scene: Scene;
}

export function ScenePicker({ items }: { items: PickItem[] }) {
  const [id, setId] = useState(items[0].id);
  const cur = items.find((i) => i.id === id) ?? items[0];
  return (
    <div className="spick">
      <div className="spick__tabs tabs" role="tablist" aria-label="Hareket seçimi">
        {items.map((i) => (
          <button key={i.id} type="button" role="tab" aria-selected={i.id === id} onClick={() => setId(i.id)}>
            {i.name}
          </button>
        ))}
      </div>
      <div className="spick__body">
        <div>
          <SceneView key={cur.id} scene={cur.scene} title={cur.name} />
        </div>
        <div>
          <h3 className="h2">{cur.name}</h3>
          <p className="lead" style={{ marginTop: 14 }}>{cur.blurb}</p>
        </div>
      </div>
    </div>
  );
}
