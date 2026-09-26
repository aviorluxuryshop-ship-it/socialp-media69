import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { CourseGroupForm } from '../CourseGroupForm';

export default async function NewCourseGroupPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('courses.create');
  const { id: courseId } = await params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) notFound();

  const trainers = await prisma.trainer.findMany({
    where: { staff: { isActive: true } },
    include: { staff: { select: { fullName: true } } },
    orderBy: { staff: { fullName: 'asc' } },
  });

  const trainerOptions = trainers.map((t) => ({ id: t.staffId, fullName: t.staff.fullName, specialty: t.specialty }));

  return (
    <div>
      <PageHeader title="Yeni Grup" description={`${course.name} için yeni bir grup/sınıf oluşturun.`} />
      <Card className="max-w-2xl">
        {trainerOptions.length === 0 ? (
          <EmptyState
            title="Önce bir eğitmen tanımlamalısınız"
            description="Personeller modülünden bir personeli eğitmen olarak işaretleyin, ardından buraya dönün."
          />
        ) : (
          <CourseGroupForm courseId={courseId} trainers={trainerOptions} />
        )}
      </Card>
    </div>
  );
}
