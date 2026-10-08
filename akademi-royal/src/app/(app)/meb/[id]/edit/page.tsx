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
    include: { course: { select: { id: true, name: true } } },
  });
  if (!process) notFound();

  return (
    <div>
      <PageHeader title="MEB Süreci Düzenle" />
      <Card className="max-w-2xl">
        <MebForm
          courses={[{ id: process.course.id, name: process.course.name }]}
          defaultValues={{
            id: process.id,
            courseId: process.courseId,
            groupNumber: process.groupNumber,
            completionDate: process.completionDate,
            capacity: process.capacity,
          }}
        />
      </Card>
    </div>
  );
}
