import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { PAY_TYPE_LABELS } from '@/lib/labels';
import { toggleStaffActiveAction, deleteStaffAction } from '../actions';

export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission('staff.view');
  const { id } = await params;
  const { error } = await searchParams;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { trainer: true, branch: true, _count: { select: { courseGroups: true } } },
  });
  if (!staff) notFound();

  const canEdit = hasPermission(user, 'staff.edit');
  const canDelete = hasPermission(user, 'staff.delete');

  return (
    <div>
      <PageHeader
        title={staff.fullName}
        description={staff.position}
        action={
          <div className="flex gap-2">
            {canEdit && <Button href={`/staff/${staff.id}/edit`} variant="secondary">Düzenle</Button>}
            {canEdit && (
              <ConfirmForm
                action={toggleStaffActiveAction.bind(null, staff.id)}
                confirmText={staff.isActive ? 'Personel pasife alınsın mı?' : 'Personel aktif hale getirilsin mi?'}
                className="rounded-md border border-[var(--color-mist)] px-3 py-2 text-sm font-medium text-[var(--color-royal)] transition hover:bg-[var(--color-mist)]"
              >
                {staff.isActive ? 'Pasife Al' : 'Aktif Et'}
              </ConfirmForm>
            )}
            {canDelete && staff._count.courseGroups === 0 && (
              <ConfirmForm
                action={deleteStaffAction.bind(null, staff.id)}
                confirmText="Bu personel kalıcı olarak silinsin mi?"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sil
              </ConfirmForm>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Kişisel Bilgiler</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Durum"><Badge tone={staff.isActive ? 'success' : 'default'}>{staff.isActive ? 'Aktif' : 'Pasif'}</Badge></Row>
            <Row label="Telefon">{staff.phone ?? '—'}</Row>
            <Row label="E-posta">{staff.email ?? '—'}</Row>
            <Row label="Adres">{staff.address ?? '—'}</Row>
            <Row label="Doğum Tarihi">{formatDateTR(staff.birthDate)}</Row>
            <Row label="İşe Giriş Tarihi">{formatDateTR(staff.hireDate)}</Row>
            <Row label="Maaş">{formatCurrencyTR(staff.salaryAmount as never)}</Row>
            {staff.notes && <Row label="Notlar">{staff.notes}</Row>}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Eğitmen Bilgisi</h2>
          {staff.trainer ? (
            <dl className="space-y-2 text-sm">
              <Row label="Uzmanlık Alanı">{staff.trainer.specialty}</Row>
              <Row label="Ücretlendirme">{PAY_TYPE_LABELS[staff.trainer.payType]}</Row>
              <Row label="Ücret">{formatCurrencyTR(staff.trainer.payRate as never)}</Row>
              {staff.trainer.bio && <Row label="Özgeçmiş">{staff.trainer.bio}</Row>}
              <Row label="Atandığı Grup Sayısı">{staff._count.courseGroups}</Row>
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-royal-dim)]">Bu personel eğitmen olarak işaretlenmemiş.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-mist)] pb-2 last:border-0 last:pb-0">
      <dt className="text-[var(--color-royal-dim)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--color-royal)]">{children}</dd>
    </div>
  );
}
