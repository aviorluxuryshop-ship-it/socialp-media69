import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { EnrollForm } from '../../EnrollForm';

export default async function EnrollStudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('students.edit');
  const { id: studentId } = await params;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) notFound();

  const existingGroupIds = (
    await prisma.groupEnrollment.findMany({ where: { studentId }, select: { courseGroupId: true } })
  ).map((e) => e.courseGroupId);

  const groups = await prisma.courseGroup.findMany({
    where: { status: { in: ['PLANNED', 'ACTIVE'] }, id: { notIn: existingGroupIds } },
    include: { course: true },
    orderBy: { startDate: 'desc' },
  });

  const groupOptions = groups.map((g) => ({
    id: g.id,
    label: `${g.course.name} — ${g.code}`,
    defaultPrice: g.course.defaultPrice.toString(),
  }));

  return (
    <div>
      <PageHeader title="Eğitime Kaydet" description={`${student.fullName} için yeni bir eğitim kaydı oluşturun.`} />
      <Card className="max-w-2xl">
        {groupOptions.length === 0 ? (
          <EmptyState
            title="Kaydedilebilecek uygun grup yok"
            description="Eğitimler modülünden planlanan veya devam eden bir grup oluşturun."
          />
        ) : (
          <EnrollForm studentId={studentId} groups={groupOptions} />
        )}
      </Card>
    </div>
  );
}
