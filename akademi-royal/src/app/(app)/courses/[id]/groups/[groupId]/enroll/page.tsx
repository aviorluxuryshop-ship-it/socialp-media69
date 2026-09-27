import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { GroupEnrollForm } from '../GroupEnrollForm';

export default async function GroupEnrollPage({ params }: { params: Promise<{ id: string; groupId: string }> }) {
  await requirePermission('students.edit');
  const { id: courseId, groupId } = await params;

  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    include: { course: { select: { id: true, name: true, defaultPrice: true } } },
  });
  if (!group || group.courseId !== courseId) notFound();

  const existingStudentIds = (
    await prisma.groupEnrollment.findMany({ where: { courseGroupId: groupId }, select: { studentId: true } })
  ).map((e) => e.studentId);

  const students = await prisma.student.findMany({
    where: { id: { notIn: existingStudentIds } },
    orderBy: { fullName: 'asc' },
  });

  const studentOptions = students.map((s) => ({ id: s.id, label: `${s.fullName} — ${s.phone}` }));
  const returnTo = `/courses/${courseId}/groups/${groupId}`;

  return (
    <div>
      <PageHeader title="Öğrenci Ekle" description={`${group.course.name} — ${group.code} grubuna kayıtlı öğrenci ekleyin.`} />
      <Card className="max-w-2xl">
        {studentOptions.length === 0 ? (
          <EmptyState
            title="Eklenebilecek öğrenci yok"
            description="Tüm kayıtlı öğrenciler zaten bu gruba dahil, ya da henüz hiç öğrenci kaydı yok."
          />
        ) : (
          <GroupEnrollForm
            courseGroupId={groupId}
            returnTo={returnTo}
            defaultPrice={group.course.defaultPrice.toString()}
            students={studentOptions}
          />
        )}
      </Card>
    </div>
  );
}
