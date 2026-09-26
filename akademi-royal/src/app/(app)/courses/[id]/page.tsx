import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatCurrencyTR, formatDateTR } from '@/lib/form-utils';
import { COURSE_GROUP_STATUS_LABELS } from '@/lib/labels';
import { deleteCourseAction } from '../actions';

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission('courses.view');
  const { id } = await params;
  const { error } = await searchParams;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      groups: {
        include: { trainer: { select: { fullName: true } }, _count: { select: { enrollments: true } } },
        orderBy: { startDate: 'desc' },
      },
      _count: { select: { groups: true } },
    },
  });
  if (!course) notFound();

  const canEdit = hasPermission(user, 'courses.edit');
  const canDelete = hasPermission(user, 'courses.delete');
  const canCreateGroup = hasPermission(user, 'courses.create');

  return (
    <div>
      <PageHeader
        title={course.name}
        description={course.category ?? undefined}
        action={
          <div className="flex gap-2">
            {canEdit && <Button href={`/courses/${course.id}/edit`} variant="secondary">Düzenle</Button>}
            {canDelete && course._count.groups === 0 && (
              <ConfirmForm
                action={deleteCourseAction.bind(null, course.id)}
                confirmText="Bu eğitim kalıcı olarak silinsin mi?"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Sil
              </ConfirmForm>
            )}
          </div>
        }
      />

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card className="mb-6">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[var(--color-royal-dim)]">Süre</dt>
            <dd className="font-medium text-[var(--color-royal)]">{course.durationHours ? `${course.durationHours} saat` : '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Standart Ücret</dt>
            <dd className="font-medium text-[var(--color-royal)]">{formatCurrencyTR(course.defaultPrice as never)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Durum</dt>
            <dd><Badge tone={course.isActive ? 'success' : 'default'}>{course.isActive ? 'Aktif' : 'Pasif'}</Badge></dd>
          </div>
        </dl>
        {course.description && <p className="mt-4 text-sm text-[var(--color-royal-dim)]">{course.description}</p>}
      </Card>

      <PageHeader
        title="Gruplar / Sınıflar"
        action={canCreateGroup ? <Button href={`/courses/${course.id}/groups/new`}>+ Yeni Grup</Button> : undefined}
      />

      {course.groups.length === 0 ? (
        <EmptyState title="Bu eğitim için henüz grup açılmamış" description="Yeni Grup butonuyla bir sınıf oluşturabilirsiniz." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-mist)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-mist)]/50 text-[var(--color-royal-dim)]">
              <tr>
                <th className="px-4 py-2 font-medium">Kod</th>
                <th className="px-4 py-2 font-medium">Eğitmen</th>
                <th className="px-4 py-2 font-medium">Başlangıç</th>
                <th className="px-4 py-2 font-medium">Bitiş</th>
                <th className="px-4 py-2 font-medium">Kayıtlı / Kontenjan</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {course.groups.map((g) => (
                <tr key={g.id} className="border-t border-[var(--color-mist)] hover:bg-[var(--color-mist)]/30">
                  <td className="px-4 py-2">
                    <Link href={`/courses/${course.id}/groups/${g.id}`} className="font-medium text-[var(--color-royal)] hover:underline">
                      {g.code}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{g.trainer.fullName}</td>
                  <td className="px-4 py-2">{formatDateTR(g.startDate)}</td>
                  <td className="px-4 py-2">{formatDateTR(g.endDate)}</td>
                  <td className="px-4 py-2">
                    {g._count.enrollments}
                    {g.capacity ? ` / ${g.capacity}` : ''}
                  </td>
                  <td className="px-4 py-2">
                    <Badge>{COURSE_GROUP_STATUS_LABELS[g.status]}</Badge>
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
