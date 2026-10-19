'use client';

import { useEffect } from 'react';
import { hydrateStore, useMeta } from '@/lib/store';
import { useToasts } from '@/lib/toast';
import { Icon } from './Icon';

let started = false;

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (started) return;
    started = true;
    hydrateStore();
  }, []);
  return (
    <>
      {children}
      <Toasts />
      <StorageWarning />
    </>
  );
}

function Toasts() {
  const items = useToasts();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function StorageWarning() {
  const { ready, storageOk } = useMeta();
  if (!ready || storageOk) return null;
  return (
    <div className="storage-warn" role="alert">
      <Icon name="warn" />
      <span>
        Tarayıcı kaydı kullanılamıyor (gizli pencere ya da engellenmiş site verisi olabilir). İlerlemeniz bu
        sekme kapanınca silinir.
      </span>
    </div>
  );
}
