import { requirePermission } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';
import { CourseForm } from '../CourseForm';

export default async function NewCoursePage() {
  await requirePermission('courses.create');

  return (
    <div>
      <PageHeader title="Yeni Eğitim" description="Eğitim programı bilgilerini girin." />
      <Card className="max-w-2xl">
        <CourseForm />
      </Card>
    </div>
  );
}
