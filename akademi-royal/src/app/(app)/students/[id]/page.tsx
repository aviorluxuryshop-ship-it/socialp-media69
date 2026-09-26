import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { EnrollmentStatusSelect } from '../EnrollmentStatusSelect';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { ENROLLMENT_STATUS_LABELS, STUDENT_STATUS_LABELS } from '@/lib/labels';
import {
  addStudentNoteAction,
  deleteEnrollmentAction,
  deleteStudentAction,
  updateEnrollmentStatusAction,
} from '../actions';

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission('students.view');
  const { id } = await params;
  const { error } = await searchParams;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        include: {
          courseGroup: { include: { course: true, trainer: { select: { fullName: true } } } },
          pricing: { include: { installments: true } },
        },
      },
    },
  });
  if (!student) notFound();

  const canEdit = hasPermission(user, 'students.edit');
  const canDelete = hasPermission(user, 'students.delete');

  const totals = student.enrollments.reduce(
    (acc, e) => {
      if (!e.pricing) return acc;
      const paid = e.pricing.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0);
      acc.total += Number(e.pricing.finalAmount);
      acc.paid += paid;
      return acc;
    },
    { total: 0, paid: 0 },
  );

  return (
    <div>
      <PageHeader
        title={student.fullName}
        description={student.phone}
        action={
          <div className="flex gap-2">
            {canEdit && <Button href={`/students/${student.id}/edit`} variant="secondary">Düzenle</Button>}
            {canDelete && student.enrollments.length === 0 && (
              <ConfirmForm
                action={deleteStudentAction.bind(null, student.id)}
                confirmText="Bu öğrenci kalıcı olarak silinsin mi?"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sil
              </ConfirmForm>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Kişisel Bilgiler</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Durum"><Badge>{STUDENT_STATUS_LABELS[student.status]}</Badge></Row>
            <Row label="TC Kimlik">{student.nationalId ?? '—'}</Row>
            <Row label="E-posta">{student.email ?? '—'}</Row>
            <Row label="Doğum Tarihi">{formatDateTR(student.birthDate)}</Row>
            <Row label="Adres">{student.address ?? '—'}</Row>
            <Row label="Kaynak">{student.source ?? '—'}</Row>
            <Row label="Kayıt Tarihi">{formatDateTR(student.createdAt)}</Row>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Cari Özet</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Toplam Eğitim Ücreti">{formatCurrencyTR(totals.total)}</Row>
            <Row label="Ödenen">{formatCurrencyTR(totals.paid)}</Row>
            <Row label="Kalan">{formatCurrencyTR(totals.total - totals.paid)}</Row>
          </dl>
          <p className="mt-4 text-xs text-[var(--color-royal-dim)]">
            Ödeme alma ve hesap ekstresi Faz 4&apos;te Hesaplarım modülünden yapılacak.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Notlar</h2>
          <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {student.notes.length === 0 ? (
              <p className="text-[var(--color-royal-dim)]">Henüz not eklenmemiş.</p>
            ) : (
              student.notes.map((n) => (
                <div key={n.id} className="rounded-md border border-[var(--color-mist)] px-3 py-2">
                  <p>{n.note}</p>
                  <p className="mt-1 text-xs text-[var(--color-royal-dim)]">{formatDateTR(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
          {canEdit && (
            <form action={addStudentNoteAction.bind(null, student.id)} className="mt-3 flex gap-2">
              <input
                name="note"
                required
                placeholder="Görüşme notu ekle…"
                className="flex-1 rounded-md border border-[var(--color-mist)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-royal)]"
              />
              <button type="submit" className="rounded-md bg-[var(--color-royal)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
                Ekle
              </button>
            </form>
          )}
        </Card>
      </div>

      <PageHeader
        title="Eğitim Bilgileri"
        action={canEdit ? <Button href={`/students/${student.id}/enroll`}>+ Eğitime Kaydet</Button> : undefined}
      />

      {student.enrollments.length === 0 ? (
        <p className="text-sm text-[var(--color-royal-dim)]">Bu öğrenci henüz bir eğitime kayıtlı değil.</p>
      ) : (
        <div className="space-y-3">
          {student.enrollments.map((e) => {
            const paid = e.pricing?.installments.reduce((sum, i) => sum + Number(i.paidAmount), 0) ?? 0;
            const hasPayments = paid > 0;
            return (
              <Card key={e.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link href={`/courses/${e.courseGroup.courseId}/groups/${e.courseGroup.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                      {e.courseGroup.course.name} — {e.courseGroup.code}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--color-royal-dim)]">
                      Eğitmen: {e.courseGroup.trainer.fullName} · Başlangıç: {formatDateTR(e.courseGroup.startDate)}
                    </p>
                    {e.pricing && (
                      <p className="mt-1 text-sm text-[var(--color-royal-dim)]">
                        Ücret: {formatCurrencyTR(e.pricing.finalAmount as never)} · Ödenen: {formatCurrencyTR(paid)} · Kalan:{' '}
                        {formatCurrencyTR(Number(e.pricing.finalAmount) - paid)} ({e.pricing.installmentCount} taksit)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit ? (
                      <EnrollmentStatusSelect
                        action={updateEnrollmentStatusAction.bind(null, student.id, e.id)}
                        defaultValue={e.status}
                      />
                    ) : (
                      <Badge>{ENROLLMENT_STATUS_LABELS[e.status]}</Badge>
                    )}
                    {canDelete && !hasPayments && (
                      <ConfirmForm
                        action={deleteEnrollmentAction.bind(null, student.id, e.id)}
                        confirmText="Bu eğitim kaydı silinsin mi?"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Kaydı Sil
                      </ConfirmForm>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
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
