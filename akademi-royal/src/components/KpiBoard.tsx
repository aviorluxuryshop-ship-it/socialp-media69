'use client';

import { useState } from 'react';
import Link from 'next/link';

type Row = { id: string; label: string; sub: string; href: string };
export type Kpi = { key: string; label: string; value: string; tone?: string; rows: Row[]; emptyText: string };

export function KpiBoard({ kpis }: { kpis: Kpi[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = kpis.find((k) => k.key === openKey) ?? null;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setOpenKey(openKey === k.key ? null : k.key)}
            className={`rounded-lg border p-4 text-left transition ${
              openKey === k.key ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'border-[var(--color-mist)]'
            } bg-[var(--color-surface)] hover:border-[var(--color-accent)]`}
          >
            <p className="text-xs text-[var(--color-royal-dim)]">{k.label}</p>
            <p className={`mt-1 text-lg font-semibold ${k.tone ?? 'text-[var(--color-royal)]'}`}>{k.value}</p>
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-[var(--color-mist)] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-royal)]">{open.label}</h3>
            <button
              type="button"
              onClick={() => setOpenKey(null)}
              className="text-xs text-[var(--color-royal-dim)] hover:text-[var(--color-royal)]"
            >
              Kapat ✕
            </button>
          </div>
          {open.rows.length === 0 ? (
            <p className="text-sm text-[var(--color-royal-dim)]">{open.emptyText}</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
              {open.rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 border-b border-[var(--color-mist)] py-1.5 last:border-0">
                  <Link href={r.href} className="font-medium text-[var(--color-royal)] hover:underline">
                    {r.label}
                  </Link>
                  <span className="shrink-0 text-xs text-[var(--color-royal-dim)]">{r.sub}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
