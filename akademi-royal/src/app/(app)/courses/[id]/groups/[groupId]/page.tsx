import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasPermission, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { ConfirmForm } from '@/components/ConfirmForm';
import { formatDateTR } from '@/lib/form-utils';
import { COURSE_GROUP_STATUS_LABELS, DAY_LABELS } from '@/lib/labels';
import { addScheduleSlotAction, deleteCourseGroupAction, deleteScheduleSlotAction } from '../actions';

export default async function CourseGroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; groupId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission('courses.view');
  const { id: courseId, groupId } = await params;
  const { error } = await searchParams;

  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    include: {
      course: { select: { id: true, name: true } },
      trainer: { select: { fullName: true } },
      scheduleSlots: { orderBy: { dayOfWeek: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!group || group.courseId !== courseId) notFound();

  const canEdit = hasPermission(user, 'courses.edit');
  const canDelete = hasPermission(user, 'courses.delete');

  return (
    <div>
      <PageHeader
        title={group.code}
        description={
          <Link href={`/courses/${group.course.id}`} className="hover:underline">
            {group.course.name}
          </Link>
        }
        action={
          <div className="flex gap-2">
            {canEdit && <Button href={`/courses/${courseId}/groups/${group.id}/edit`} variant="secondary">Düzenle</Button>}
            {canDelete && group._count.enrollments === 0 && (
              <ConfirmForm
                action={deleteCourseGroupAction.bind(null, courseId, group.id)}
                confirmText="Bu grup kalıcı olarak silinsin mi?"
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
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Grup Bilgileri</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Eğitmen">{group.trainer.fullName}</Row>
            <Row label="Başlangıç">{formatDateTR(group.startDate)}</Row>
            <Row label="Bitiş">{formatDateTR(group.endDate)}</Row>
            <Row label="Kontenjan">{group.capacity ?? '—'}</Row>
            <Row label="Kayıtlı Öğrenci">{group._count.enrollments}</Row>
            <Row label="Durum"><Badge>{COURSE_GROUP_STATUS_LABELS[group.status]}</Badge></Row>
          </dl>
          <p className="mt-4 text-xs text-[var(--color-royal-dim)]">
            Öğrenci kaydı Faz 3&apos;te Öğrenciler modülünden bu gruba yapılabilecek.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-royal)]">Ders Programı</h2>
          {group.scheduleSlots.length === 0 ? (
            <p className="text-sm text-[var(--color-royal-dim)]">Henüz haftalık ders programı eklenmemiş.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {group.scheduleSlots.map((slot) => (
                <li key={slot.id} className="flex items-center justify-between rounded-md border border-[var(--color-mist)] px-3 py-2">
                  <span>
                    <span className="font-medium text-[var(--color-royal)]">{DAY_LABELS[slot.dayOfWeek]}</span>{' '}
                    {slot.startTime}–{slot.endTime}
                  </span>
                  {canEdit && (
                    <form action={deleteScheduleSlotAction.bind(null, courseId, group.id, slot.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Kaldır
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <form action={addScheduleSlotAction.bind(null, courseId, group.id)} className="mt-4 grid grid-cols-3 gap-2">
              <select name="dayOfWeek" required className="rounded-md border border-[var(--color-mist)] px-2 py-1.5 text-sm">
                {DAY_LABELS.map((label, idx) => (
                  <option key={label} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
              <input name="startTime" type="time" required className="rounded-md border border-[var(--color-mist)] px-2 py-1.5 text-sm" />
              <input name="endTime" type="time" required className="rounded-md border border-[var(--color-mist)] px-2 py-1.5 text-sm" />
              <button
                type="submit"
                className="col-span-3 mt-1 rounded-md border border-[var(--color-mist)] px-3 py-1.5 text-sm font-medium text-[var(--color-royal)] hover:bg-[var(--color-mist)]"
              >
                + Ders Saati Ekle
              </button>
            </form>
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
