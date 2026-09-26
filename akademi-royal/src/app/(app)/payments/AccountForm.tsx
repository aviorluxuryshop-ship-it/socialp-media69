'use client';

import { useActionState } from 'react';
import { saveAccountAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { FINANCIAL_ACCOUNT_TYPE_LABELS } from '@/lib/labels';

const initialState: FormState = {};

export function AccountForm() {
  const [state, formAction, pending] = useActionState(saveAccountAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <FieldLabel htmlFor="name">Hesap Adı *</FieldLabel>
        <input id="name" name="name" required placeholder="ör. Ana Kasa" className={inputClass} />
      </div>
      <div>
        <FieldLabel htmlFor="type">Hesap Tipi</FieldLabel>
        <select id="type" name="type" defaultValue="CASH" className={inputClass}>
          {Object.entries(FINANCIAL_ACCOUNT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel htmlFor="openingBalance">Açılış Bakiyesi (₺)</FieldLabel>
        <input id="openingBalance" name="openingBalance" type="number" step="0.01" defaultValue="0" className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/payments" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
