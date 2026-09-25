import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function CoursesPage() {
  await requirePermission('courses.view');

  return (
    <div>
      <PageHeader title="Eğitimler" description="Eğitim programları, gruplar ve ders programı." />
      <EmptyState title="Bu modül Faz 2'de geliştirilecek" description="Kurs ve grup yönetimi yakında burada." />
    </div>
  );
}
