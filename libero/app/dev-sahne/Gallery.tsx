'use client';
import { useMemo } from 'react';
import type { Scene } from '@/lib/types';
import { timeline } from '@/lib/scene';
import { SceneCanvas } from '@/components/pitch/SceneCanvas';

function Card({ id, name, scene }: { id: string; name: string; scene: Scene }) {
  const tl = useMemo(() => timeline(scene), [scene]);
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <p className="mono" style={{ fontSize: 10 }}>{id}</p>
      <div style={{ border: '1px solid var(--line-2)' }}>
        <SceneCanvas scene={scene} tl={tl} frame={tl.length - 1} instant label={name} history />
      </div>
    </div>
  );
}

export function Gallery({ items }: { items: { id: string; name: string; scene: Scene }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {items.map((i) => (
        <Card key={i.id} {...i} />
      ))}
    </div>
  );
}
