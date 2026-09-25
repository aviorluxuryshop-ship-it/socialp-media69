import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function StudentsPage() {
  await requirePermission('students.view');

  return (
    <div>
      <PageHeader title="Öğrenciler" description="Öğrenci kayıtları, eğitim ve ödeme durumları." />
      <EmptyState title="Bu modül Faz 3'te geliştirilecek" description="Öğrenci listesi, detay sayfası ve kayıt işlemleri yakında burada." />
    </div>
  );
}
