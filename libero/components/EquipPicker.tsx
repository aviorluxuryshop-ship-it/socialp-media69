'use client';

import { Icon } from './Icon';
import {
  ENV_META,
  ENV_NAME,
  ENV_ORDER,
  EQUIP_NAME,
  equipBlockedReason,
  supervisionMissing,
  type Env,
  type EquipByEnv,
  type EquipId,
} from '@/lib/environments';

const LABEL: Record<Env, string> = {
  ev: 'Evde elimdeki ekipman',
  salon: 'Spor salonunda bulunan ekipman',
  saha: 'Sahada kullanabildiklerim',
};

/**
 * Ortam başına ekipman seçici. Her ortam yalnızca KENDİ ekipman listesini gösterir:
 * ev ekipmanı salon bölümünde, salon aletleri ev bölümünde görünmez. Yalnızca seçili
 * ortamların bölümleri çizilir.
 */
export function EquipPicker({
  envs,
  value,
  age,
  onChange,
}: {
  envs: Env[];
  value: EquipByEnv;
  age: number | null;
  onChange: (next: EquipByEnv) => void;
}) {
  const toggle = (env: Env, id: EquipId) => {
    const cur = value[env] ?? [];
    onChange({ ...value, [env]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };

  return (
    <div className="stack" style={{ '--stack': '1.2rem' } as React.CSSProperties}>
      {ENV_ORDER.filter((e) => envs.includes(e)).map((env) => {
        const meta = ENV_META[env];
        return (
          <div className="field" key={env} data-env={env}>
            <span className="field__label">{LABEL[env]}</span>
            <div className="chips" role="group" aria-label={LABEL[env]}>
              {meta.options.map((id) => {
                const blocked = equipBlockedReason(env, id, age);
                const on = (value[env] ?? []).includes(id) && !blocked;
                return (
                  <button
                    key={id}
                    type="button"
                    className="chip"
                    aria-pressed={on}
                    disabled={!!blocked}
                    title={blocked ?? meta.hints[id] ?? undefined}
                    onClick={() => toggle(env, id)}
                  >
                    {EQUIP_NAME[id]}
                  </button>
                );
              })}
            </div>
            {supervisionMissing(env, value[env] ?? [], age) && (
              <p className="note note--warn" role="status" style={{ marginTop: 6 }}>
                <Icon name="warn" />
                <span>
                  18 yaş altında yüklü çalışma (dambıl, halter, makine, kablo, bench) yalnızca gözetim altında yapılır. “Antrenman arkadaşı ya da antrenör” seçilmedikçe bu hareketler programa alınmaz; yalnızca vücut ağırlığı ve bantlı hareketler önerilir.
                </span>
              </p>
            )}
            <span className="field__hint">
              {meta.blurb}
              {meta.always.includes('sandalye') ? ' Sağlam sandalye ve ekipmansız hareketler her zaman kullanılabilir.' : ' Ekipmansız hareketler her zaman kullanılabilir.'}
              {' '}
              {meta.options
                .filter((id) => equipBlockedReason(env, id, age))
                .map((id) => `${EQUIP_NAME[id]}: ${equipBlockedReason(env, id, age)}.`)
                .join(' ')}
            </span>
            {Object.keys(meta.hints).length > 0 && (
              <ul className="field__hint" style={{ margin: 0, paddingLeft: 16, listStyle: 'disc' }}>
                {meta.options
                  .filter((id) => meta.hints[id])
                  .map((id) => (
                    <li key={id}>
                      <b>{EQUIP_NAME[id]}:</b> {meta.hints[id]}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        );
      })}
      {envs.length === 0 && <p className="field__hint">Önce en az bir antrenman ortamı seçin: {ENV_ORDER.map((e) => ENV_NAME[e]).join(', ')}.</p>}
    </div>
  );
}
