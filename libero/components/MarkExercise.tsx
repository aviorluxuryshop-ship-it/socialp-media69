'use client';

import { toggleFav, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Icon } from './Icon';

const selFav = (s: { fav: string[] }) => s.fav;

export function MarkExercise({ id, name }: { id: string; name: string }) {
  const fav = useStore(selFav).includes('ex:' + id);
  return (
    <div className="card card--pad">
      <p className="panel__title"><span>Listem</span></p>
      <button
        type="button"
        className={`btn btn--sm ${fav ? 'btn--ghost btn--on' : 'btn--primary'}`}
        aria-pressed={fav}
        onClick={() => {
          toggleFav('ex:' + id);
          toast(fav ? `${name} listeden çıkarıldı` : `${name} listene eklendi`);
        }}
      >
        <Icon name="heart" /> {fav ? 'Listede' : 'Favorilere ekle'}
      </button>
      <p className="field__hint" style={{ marginTop: 12 }}>Favoriler bu tarayıcıda saklanır; programınızı oluştururken ve profilinizde görünür.</p>
    </div>
  );
}
