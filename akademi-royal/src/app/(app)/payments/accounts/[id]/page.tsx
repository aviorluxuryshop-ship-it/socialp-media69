import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccountBalance } from '@/lib/accounting';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { FINANCIAL_ACCOUNT_TYPE_LABELS } from '@/lib/labels';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('payments.view');
  const { id } = await params;

  const account = await prisma.financialAccount.findUnique({ where: { id } });
  if (!account) notFound();

  const [entries, balance] = await Promise.all([
    prisma.financialAccountEntry.findMany({ where: { accountId: id }, orderBy: { occurredAt: 'desc' }, take: 100 }),
    getAccountBalance(id),
  ]);

  return (
    <div>
      <PageHeader title={account.name} description={FINANCIAL_ACCOUNT_TYPE_LABELS[account.type]} />

      <Card className="mb-6 max-w-xs">
        <p className="text-sm text-[var(--color-royal-dim)]">Güncel Bakiye</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--color-royal)]">{formatCurrencyTR(balance)}</p>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Hesap Ekstresi</h2>
      {entries.length === 0 ? (
        <EmptyState title="Bu hesapta henüz hareket yok" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
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
