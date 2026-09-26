'use client';

import { useActionState } from 'react';
import { markExpensePaidAction, type FormState } from './actions';

const initialState: FormState = {};

export function MarkPaidForm({ expenseId, accounts }: { expenseId: string; accounts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(markExpensePaidAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="id" value={expenseId} />
      <select name="accountId" required defaultValue="" className="rounded-md border border-[var(--color-mist)] px-1 py-1 text-xs">
        <option value="" disabled>
          Hesap…
        </option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-royal)] px-2 py-1 text-xs text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '…' : 'Öde'}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
