import Link from 'next/link';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAccountsWithBalances } from '@/lib/accounting';
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { FINANCIAL_ACCOUNT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/labels';

export default async function PaymentsPage() {
  const user = await requirePermission('payments.view');

  const [accounts, pendingInstallments, recentPayments] = await Promise.all([
    getAccountsWithBalances(),
    prisma.installment.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      include: { pricing: { include: { enrollment: { include: { student: true, courseGroup: { include: { course: true } } } } } } },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
    prisma.payment.findMany({
      include: { student: { select: { fullName: true } }, account: { select: { name: true } } },
      orderBy: { paidAt: 'desc' },
      take: 10,
    }),
  ]);

  const canCreate = hasPermission(user, 'payments.create');
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Hesaplarım"
        description="Ödemeler, cari hesaplar, kasa/banka/POS."
        action={canCreate ? <Button href="/payments/accounts/new">+ Yeni Hesap</Button> : undefined}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id}>
            <Link href={`/payments/accounts/${a.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
              {a.name}
            </Link>
            <p className="text-xs text-[var(--color-royal-dim)]">{FINANCIAL_ACCOUNT_TYPE_LABELS[a.type]}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-royal)]">{formatCurrencyTR(a.balance)}</p>
          </Card>
        ))}
      </div>

      <PageHeader title="Bekleyen Tahsilatlar" />
      {pendingInstallments.length === 0 ? (
        <EmptyState title="Bekleyen tahsilat yok" description="Tüm taksitler tahsil edilmiş." />
      ) : (
        <div className="mb-6 overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Öğrenci</th>
                <th className="px-4 py-2 font-medium">Eğitim</th>
                <th className="px-4 py-2 font-medium">Taksit</th>
                <th className="px-4 py-2 font-medium">Vade</th>
                <th className="px-4 py-2 font-medium">Kalan</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pendingInstallments.map((i) => {
                const remaining = Number(i.amount) - Number(i.paidAmount);
                const overdue = i.dueDate < today;
                return (
                  <tr key={i.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                    <td className="px-4 py-2">
                      <Link href={`/students/${i.pricing.enrollment.studentId}`} className="font-medium text-[var(--color-royal)] hover:underline">
                        {i.pricing.enrollment.student.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{i.pricing.enrollment.courseGroup.course.name}</td>
                    <td className="px-4 py-2">
                      {i.sequenceNo}/{i.pricing.installmentCount}
                    </td>
                    <td className="px-4 py-2">
                      {formatDateTR(i.dueDate)} {overdue && <Badge tone="danger">Gecikti</Badge>}
                    </td>
                    <td className="px-4 py-2">{formatCurrencyTR(remaining)}</td>
                    <td className="px-4 py-2 text-right">
                      {canCreate && <Button href={`/payments/collect/${i.id}`}>Tahsil Et</Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PageHeader title="Son Tahsilatlar" />
      {recentPayments.length === 0 ? (
        <EmptyState title="Henüz tahsilat yapılmamış" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Öğrenci</th>
                <th className="px-4 py-2 font-medium">Tutar</th>
                <th className="px-4 py-2 font-medium">Yöntem</th>
                <th className="px-4 py-2 font-medium">Hesap</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-t border-[var(--color-mist)]">
                  <td className="px-4 py-2">{formatDateTR(p.paidAt)}</td>
                  <td className="px-4 py-2">{p.student.fullName}</td>
                  <td className="px-4 py-2">{formatCurrencyTR(p.amount as never)}</td>
                  <td className="px-4 py-2">{PAYMENT_METHOD_LABELS[p.method]}</td>
                  <td className="px-4 py-2">{p.account.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
