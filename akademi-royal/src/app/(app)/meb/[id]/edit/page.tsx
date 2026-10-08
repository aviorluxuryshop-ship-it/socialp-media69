import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { MebForm } from '../../MebForm';

export default async function EditMebProcessPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('meb.edit');
  const { id } = await params;

  const process = await prisma.mebProcess.findUnique({
    where: { id },
    include: {
      enrollment: {
        include: {
          student: { select: { fullName: true } },
          courseGroup: { include: { course: { select: { name: true } } } },
        },
      },
    },
  });
  if (!process) notFound();

  const enrollmentOption = {
    id: process.enrollmentId,
    label: `${process.enrollment.student.fullName} — ${process.enrollment.courseGroup.course.name}`,
  };

  return (
    <div>
      <PageHeader title="MEB Süreci Düzenle" />
      <Card className="max-w-2xl">
        <MebForm
          enrollments={[enrollmentOption]}
          returnTo="/meb"
          defaultValues={{
            id: process.id,
            enrollmentId: process.enrollmentId,
            groupNumber: process.groupNumber,
            expiresAt: process.expiresAt,
          }}
        />
      </Card>
    </div>
  );
}
