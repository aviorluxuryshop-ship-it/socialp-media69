import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatCurrencyTR } from '@/lib/form-utils';
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

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const enrollmentCount = await prisma.groupEnrollment.count({ where: { courseGroup: { courseId: id } } });

  const canEdit = hasPermission(user, 'courses.edit');
  const canDelete = hasPermission(user, 'courses.delete');

  return (
    <div>
      <PageHeader
        title={course.name}
        description={course.category ?? undefined}
        action={
          <div className="flex gap-2">
            {canEdit && <Button href={`/courses/${course.id}/edit`} variant="secondary">Düzenle</Button>}
            {canDelete && enrollmentCount === 0 && (
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

      <Card>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[var(--color-royal-dim)]">Süre</dt>
            <dd className="font-medium text-[var(--color-royal)]">{course.durationDays ? `${course.durationDays} gün` : '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Standart Ücret</dt>
            <dd className="font-medium text-[var(--color-royal)]">{formatCurrencyTR(course.defaultPrice as never)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Kayıtlı Öğrenci</dt>
            <dd className="font-medium text-[var(--color-royal)]">{enrollmentCount}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-royal-dim)]">Durum</dt>
            <dd><Badge tone={course.isActive ? 'success' : 'default'}>{course.isActive ? 'Aktif' : 'Pasif'}</Badge></dd>
          </div>
        </dl>
        {course.description && <p className="mt-4 text-sm text-[var(--color-royal-dim)]">{course.description}</p>}
      </Card>
    </div>
  );
}
