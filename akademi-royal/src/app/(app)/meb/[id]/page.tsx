import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatDateTR } from '@/lib/form-utils';
import { deleteMebProcessAction, removeStudentFromMebProcessAction } from '../actions';
import { AddStudentForm } from '../AddStudentForm';

export default async function MebProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('meb.view');
  const { id } = await params;

  const process = await prisma.mebProcess.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true } },
      enrollments: {
        include: { student: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { enrolledAt: 'asc' },
      },
    },
  });
  if (!process) notFound();

  const eligibleEnrollments = await prisma.groupEnrollment.findMany({
    where: { mebProcessId: null, courseGroup: { courseId: process.courseId } },
    include: { student: { select: { fullName: true, phone: true } } },
    orderBy: { enrolledAt: 'desc' },
  });

  const canEdit = hasPermission(user, 'meb.edit');
  const canDelete = hasPermission(user, 'meb.delete');
  const overdue = process.completionDate < new Date();
  const atCapacity = process.capacity != null && process.enrollments.length >= process.capacity;

  return (
    <div>
      <PageHeader
        title={`MEB Sınav Grubu — ${process.course.name}`}
        description={process.groupNumber ? `Grup No: ${process.groupNumber}` : undefined}
        action={
          <div className="flex gap-2">
            {canEdit && <Button href={`/meb/${process.id}/edit`} variant="secondary">Düzenle</Button>}
            {canDelete && (
              <ConfirmForm
                action={deleteMebProcessAction.bind(null, process.id)}
                confirmText="Bu MEB süreci silinsin mi? Öğrenciler bu gruptan çıkarılacak ama eğitim kayıtları etkilenmeyecek."
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sil
              </ConfirmForm>
            )}
          </div>
        }
      />

      <Card className="mb-6">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[var(--color-royal-dim)]">Eğitim</dt>
            <dd className="font-medium text-[var(--color-royal)]">
              <Link href={`/courses/${process.course.id}`} className="hover:underline">
                {process.course.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Sınav Grup Numarası</dt>
            <dd className="font-medium text-[var(--color-royal)]">{process.groupNumber ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Süreç Tamamlanma Tarihi</dt>
            <dd className="font-medium text-[var(--color-royal)]">
              {formatDateTR(process.completionDate)} {overdue && <Badge tone="danger">Süresi Doldu</Badge>}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Kontenjan</dt>
            <dd className="font-medium text-[var(--color-royal)]">
              {process.enrollments.length}
              {process.capacity ? ` / ${process.capacity}` : ''}
              {atCapacity && <Badge tone="warning">Dolu</Badge>}
            </dd>
          </div>
        </dl>
      </Card>

      <PageHeader title="Gruptaki Öğrenciler" showBack={false} />
      {process.enrollments.length === 0 ? (
        <EmptyState title="Bu gruba henüz öğrenci eklenmemiş" />
      ) : (
        <div className="mb-6 overflow-hidden rounded-lg border border-[var(--color-mist)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Öğrenci</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {process.enrollments.map((e) => (
                <tr key={e.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                  <td className="px-4 py-2">
                    <Link href={`/students/${e.student.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                      {e.student.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{e.student.phone}</td>
                  <td className="px-4 py-2 text-right">
                    {canEdit && (
                      <ConfirmForm
                        action={removeStudentFromMebProcessAction.bind(null, process.id, e.id)}
                        confirmText="Bu öğrenci gruptan çıkarılsın mı?"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Çıkar
                      </ConfirmForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Öğrenci Ekle</h2>
          {eligibleEnrollments.length === 0 ? (
            <p className="text-sm text-[var(--color-royal-dim)]">
              Bu eğitime kayıtlı ve henüz bir MEB grubuna eklenmemiş öğrenci yok.
            </p>
          ) : (
            <AddStudentForm
              mebProcessId={process.id}
              options={eligibleEnrollments.map((e) => ({ id: e.id, label: `${e.student.fullName} — ${e.student.phone}` }))}
            />
          )}
        </Card>
      )}
    </div>
  );
}
