import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { CourseGroupForm } from '../../CourseGroupForm';

export default async function EditCourseGroupPage({ params }: { params: Promise<{ id: string; groupId: string }> }) {
  await requirePermission('courses.edit');
  const { id: courseId, groupId } = await params;

  const group = await prisma.courseGroup.findUnique({ where: { id: groupId } });
  if (!group || group.courseId !== courseId) notFound();

  const trainers = await prisma.trainer.findMany({
    where: { staff: { isActive: true } },
    include: { staff: { select: { fullName: true } } },
    orderBy: { staff: { fullName: 'asc' } },
  });
  const trainerOptions = trainers.map((t) => ({ id: t.staffId, fullName: t.staff.fullName, specialty: t.specialty }));

  return (
    <div>
      <PageHeader title={`${group.code} — Düzenle`} />
      <Card className="max-w-2xl">
        <CourseGroupForm courseId={courseId} group={group} trainers={trainerOptions} />
      </Card>
    </div>
  );
}
