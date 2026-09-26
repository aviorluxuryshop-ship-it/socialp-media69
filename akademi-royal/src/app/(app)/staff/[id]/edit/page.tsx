import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { StaffForm } from '../../StaffForm';

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('staff.edit');
  const { id } = await params;

  const staff = await prisma.staff.findUnique({ where: { id }, include: { trainer: true } });
  if (!staff) notFound();

  // Client Component'lere yalnızca düz (plain) değerler geçebilir; Prisma Decimal
  // ve benzeri sınıf örnekleri serileştirilemez, bu yüzden önceden string'e çevriliyor.
  const formValue = {
    ...staff,
    salaryAmount: staff.salaryAmount ? staff.salaryAmount.toString() : null,
    trainer: staff.trainer ? { ...staff.trainer, payRate: staff.trainer.payRate.toString() } : null,
  };

  return (
    <div>
      <PageHeader title={`${staff.fullName} — Düzenle`} />
      <Card className="max-w-2xl">
        <StaffForm staff={formValue} />
      </Card>
    </div>
  );
}
