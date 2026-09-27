import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccountBalance } from '@/lib/accounting';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { FINANCIAL_ACCOUNT_TYPE_LABELS } from '@/lib/labels';
import { deleteAccountAction, toggleAccountActiveAction } from '../../actions';

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission('payments.view');
  const { id } = await params;
  const { error } = await searchParams;

  const account = await prisma.financialAccount.findUnique({ where: { id } });
  if (!account) notFound();

  const [entries, balance] = await Promise.all([
    prisma.financialAccountEntry.findMany({ where: { accountId: id }, orderBy: { occurredAt: 'desc' }, take: 100 }),
    getAccountBalance(id),
  ]);

  const canEdit = hasPermission(user, 'payments.edit');
  const canDelete = hasPermission(user, 'payments.delete');

  return (
    <div>
      <PageHeader
        title={account.name}
        description={FINANCIAL_ACCOUNT_TYPE_LABELS[account.type]}
        action={
          <div className="flex gap-2">
            {canEdit && (
              <ConfirmForm
                action={toggleAccountActiveAction.bind(null, account.id)}
                confirmText={account.isActive ? 'Hesap pasife alınsın mı?' : 'Hesap aktif hale getirilsin mi?'}
                className="rounded-md border border-[var(--color-mist)] px-3 py-2 text-sm font-medium text-[var(--color-royal)] transition hover:bg-[var(--color-mist)]"
              >
                {account.isActive ? 'Pasife Al' : 'Aktif Et'}
              </ConfirmForm>
            )}
            {canDelete && (
              <ConfirmForm
                action={deleteAccountAction.bind(null, account.id)}
                confirmText="Bu hesap kalıcı olarak silinsin mi?"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sil
              </ConfirmForm>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Card className="max-w-xs">
          <p className="text-sm text-[var(--color-royal-dim)]">Güncel Bakiye</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-royal)]">{formatCurrencyTR(balance)}</p>
        </Card>
        <Badge tone={account.isActive ? 'success' : 'default'}>{account.isActive ? 'Aktif' : 'Pasif'}</Badge>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Hesap Ekstresi</h2>
      {entries.length === 0 ? (
        <EmptyState title="Bu hesapta henüz hareket yok" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Açıklama</th>
                <th className="px-4 py-2 font-medium">Yön</th>
                <th className="px-4 py-2 font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-[var(--color-mist)]">
                  <td className="px-4 py-2">{formatDateTR(e.occurredAt)}</td>
                  <td className="px-4 py-2">{e.description ?? '—'}</td>
                  <td className="px-4 py-2">
                    <Badge tone={e.direction === 'IN' ? 'success' : 'danger'}>{e.direction === 'IN' ? 'Giriş' : 'Çıkış'}</Badge>
                  </td>
                  <td className="px-4 py-2">{formatCurrencyTR(e.amount as never)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
