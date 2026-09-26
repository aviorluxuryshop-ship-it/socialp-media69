'use client';

import { useActionState } from 'react';
import { saveExpenseAction, type FormState } from './actions';
import { Button, FieldLabel, inputClass } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/lib/labels';

const initialState: FormState = {};

export function ExpenseForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(saveExpenseAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="categoryId">Kategori *</FieldLabel>
          <select id="categoryId" name="categoryId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Seçiniz…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="expenseDate">Tarih *</FieldLabel>
          <input id="expenseDate" name="expenseDate" type="date" required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="amount">Tutar (₺) *</FieldLabel>
          <input id="amount" name="amount" type="number" step="0.01" required className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="paymentMethod">Ödeme Yöntemi</FieldLabel>
          <select id="paymentMethod" name="paymentMethod" defaultValue="CASH" className={inputClass}>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="description">Açıklama</FieldLabel>
        <textarea id="description" name="description" rows={2} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
        <Button href="/expenses" variant="secondary">
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
