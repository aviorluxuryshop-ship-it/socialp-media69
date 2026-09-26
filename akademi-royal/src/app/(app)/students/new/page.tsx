import { requirePermission } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';
import { StudentForm } from '../StudentForm';

export default async function NewStudentPage() {
  await requirePermission('students.create');

  return (
    <div>
      <PageHeader title="Yeni Öğrenci" description="Öğrenci bilgilerini girin." />
      <Card className="max-w-2xl">
        <StudentForm />
      </Card>
    </div>
  );
}
