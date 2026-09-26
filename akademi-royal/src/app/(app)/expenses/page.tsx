import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { EXPENSE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/labels';
import { approveExpenseAction, deleteExpenseAction, rejectExpenseAction } from './actions';
import { MarkPaidForm } from './MarkPaidForm';

const STATUS_TONE = { PENDING: 'default', APPROVED: 'success', REJECTED: 'danger', PAID: 'success' } as const;

export default async function ExpensesPage() {
  const user = await requirePermission('expenses.view');

  const [expenses, accountRows] = await Promise.all([
    prisma.expense.findMany({ include: { category: true }, orderBy: { expenseDate: 'desc' } }),
    prisma.financialAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);
  const accounts = accountRows.map((a) => ({ id: a.id, name: a.name }));

  const canCreate = hasPermission(user, 'expenses.create');
  const canApprove = hasPermission(user, 'expenses.approve');
  const canDelete = hasPermission(user, 'expenses.delete');

  const totalPending = expenses.filter((e) => e.status !== 'REJECTED').reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Masraflar"
        description="Gider kayıtları ve kategorileri."
        action={
          <div className="flex gap-2">
            <Button href="/expenses/categories" variant="secondary">
              Kategoriler
            </Button>
            {canCreate && <Button href="/expenses/new">+ Yeni Masraf</Button>}
          </div>
        }
      />

      <p className="mb-4 text-sm text-[var(--color-royal-dim)]">
        Toplam (reddedilenler hariç): <span className="font-semibold text-[var(--color-royal)]">{formatCurrencyTR(totalPending)}</span>
      </p>

      {expenses.length === 0 ? (
        <EmptyState title="Kayıtlı masraf yok" description="Yeni Masraf butonuyla ilk kaydı oluşturabilirsiniz." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Kategori</th>
                <th className="px-4 py-2 font-medium">Açıklama</th>
                <th className="px-4 py-2 font-medium">Tutar</th>
                <th className="px-4 py-2 font-medium">Yöntem</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                  <td className="px-4 py-2">{formatDateTR(e.expenseDate)}</td>
                  <td className="px-4 py-2">{e.category.name}</td>
                  <td className="px-4 py-2">{e.description ?? '—'}</td>
                  <td className="px-4 py-2">{formatCurrencyTR(e.amount as never)}</td>
                  <td className="px-4 py-2">{PAYMENT_METHOD_LABELS[e.paymentMethod]}</td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_TONE[e.status]}>{EXPENSE_STATUS_LABELS[e.status]}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {canApprove && e.status === 'PENDING' && (
                        <>
                          <form action={approveExpenseAction.bind(null, e.id)}>
                            <button type="submit" className="text-xs text-emerald-700 hover:underline">
                              Onayla
                            </button>
                          </form>
                          <form action={rejectExpenseAction.bind(null, e.id)}>
                            <button type="submit" className="text-xs text-red-600 hover:underline">
                              Reddet
                            </button>
                          </form>
                        </>
                      )}
                      {canApprove && e.status === 'APPROVED' && <MarkPaidForm expenseId={e.id} accounts={accounts} />}
                      {canDelete && e.status !== 'PAID' && (
                        <ConfirmForm
                          action={deleteExpenseAction.bind(null, e.id)}
                          confirmText="Bu masraf silinsin mi?"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Sil
                        </ConfirmForm>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
