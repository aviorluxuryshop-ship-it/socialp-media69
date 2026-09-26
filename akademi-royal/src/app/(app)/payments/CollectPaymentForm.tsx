'use client';

import { useActionState } from 'react';
import { collectPaymentAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/lib/labels';

const initialState: FormState = {};

export function CollectPaymentForm({
  installmentId,
  remaining,
  accounts,
}: {
  installmentId: string;
  remaining: number;
  accounts: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(collectPaymentAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="installmentId" value={installmentId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="amount">Tutar (₺) *</FieldLabel>
          <input id="amount" name="amount" type="number" step="0.01" max={remaining} defaultValue={remaining} required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="accountId">Hesap *</FieldLabel>
          <select id="accountId" name="accountId" required className={inputClass}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="method">Ödeme Yöntemi</FieldLabel>
          <select id="method" name="method" defaultValue="CASH" className={inputClass}>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="receiptNo">Makbuz No</FieldLabel>
          <input id="receiptNo" name="receiptNo" className={inputClass} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="note">Açıklama</FieldLabel>
        <textarea id="note" name="note" rows={2} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Tahsilatı Kaydet'}
        </Button>
      </div>
    </form>
  );
}
