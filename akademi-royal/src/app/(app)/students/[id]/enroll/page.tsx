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

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const courseOptions = courses.map((c) => ({
    id: c.id,
    label: c.name,
    defaultPrice: c.defaultPrice.toString(),
  }));

  return (
    <div>
      <PageHeader title="Eğitime Kaydet" description={`${student.fullName} için yeni bir eğitim kaydı oluşturun.`} />
      <Card className="max-w-2xl">
        {courseOptions.length === 0 ? (
          <EmptyState title="Kaydedilebilecek aktif eğitim yok" description="Eğitimler modülünden bir eğitim oluşturun." />
        ) : (
          <EnrollForm studentId={studentId} courses={courseOptions} />
        )}
      </Card>
    </div>
  );
}
