import { TECHNIQUES } from '@/data';
import { Gallery } from './Gallery';

export default function Dev() {
  return (
    <div className="container section--tight">
      <Gallery items={TECHNIQUES.map((t) => ({ id: t.id, name: t.name, scene: t.scene }))} />
    </div>
  );
}
