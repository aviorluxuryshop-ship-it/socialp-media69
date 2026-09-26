import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { formatCurrencyTR } from '@/lib/form-utils';
import { CollectPaymentForm } from '../../CollectPaymentForm';

export default async function CollectPaymentPage({ params }: { params: Promise<{ installmentId: string }> }) {
  await requirePermission('payments.create');
  const { installmentId } = await params;

  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: {
      pricing: { include: { enrollment: { include: { student: true, courseGroup: { include: { course: true } } } } } },
    },
  });
  if (!installment) notFound();

  const accountRows = await prisma.financialAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  const accounts = accountRows.map((a) => ({ id: a.id, name: a.name }));
  const remaining = Number(installment.amount) - Number(installment.paidAmount);

  return (
    <div>
      <PageHeader
        title="Tahsilat Al"
        description={`${installment.pricing.enrollment.student.fullName} — ${installment.pricing.enrollment.courseGroup.course.name} (Taksit ${installment.sequenceNo}/${installment.pricing.installmentCount})`}
      />
      <Card className="max-w-lg">
        <p className="mb-4 text-sm text-[var(--color-royal-dim)]">
          Kalan tutar: <span className="font-semibold text-[var(--color-royal)]">{formatCurrencyTR(remaining)}</span>
        </p>
        {accounts.length === 0 ? (
          <EmptyState title="Aktif hesap yok" description="Önce Hesaplarım'dan bir kasa/banka hesabı oluşturun." />
        ) : (
          <CollectPaymentForm installmentId={installment.id} remaining={remaining} accounts={accounts} />
        )}
      </Card>
    </div>
  );
}
