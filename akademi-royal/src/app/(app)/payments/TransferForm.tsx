'use client';

import { useActionState } from 'react';
import { transferBetweenAccountsAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';

const initialState: FormState = {};

type AccountOption = { id: string; name: string; balance: number };

export function TransferForm({ accounts }: { accounts: AccountOption[] }) {
  const [state, formAction, pending] = useActionState(transferBetweenAccountsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="fromAccountId">Kaynak Hesap *</FieldLabel>
          <select id="fromAccountId" name="fromAccountId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Seçiniz…
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="toAccountId">Hedef Hesap *</FieldLabel>
          <select id="toAccountId" name="toAccountId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Seçiniz…
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="amount">Tutar (₺) *</FieldLabel>
        <input id="amount" name="amount" type="number" step="0.01" required className={inputClass} />
      </div>

      <div>
        <FieldLabel htmlFor="description">Açıklama</FieldLabel>
        <input id="description" name="description" placeholder="ör. Nakit kasadan bankaya aktarım" className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Aktarılıyor…' : 'Transfer Et'}
        </Button>
        <Button href="/payments" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
