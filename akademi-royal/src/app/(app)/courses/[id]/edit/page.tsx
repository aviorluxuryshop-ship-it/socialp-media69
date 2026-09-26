import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { CourseForm } from '../../CourseForm';

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('courses.edit');
  const { id } = await params;

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  const formValue = { ...course, defaultPrice: course.defaultPrice.toString() };

  return (
    <div>
      <PageHeader title={`${course.name} — Düzenle`} />
      <Card className="max-w-2xl">
        <CourseForm course={formValue} />
      </Card>
    </div>
  );
}
