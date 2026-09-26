import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, PageHeader } from '@/components/ui';
import { StudentForm } from '../../StudentForm';

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('students.edit');
  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  return (
    <div>
      <PageHeader title={`${student.fullName} — Düzenle`} />
      <Card className="max-w-2xl">
        <StudentForm student={student} />
      </Card>
    </div>
  );
}
