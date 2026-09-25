import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function CalendarPage() {
  await requirePermission('calendar.view');

  return (
    <div>
      <PageHeader title="Takvim & Planlama" description="Dersler, sınavlar, toplantılar ve izinler." />
      <EmptyState title="Bu modül Faz 5'te geliştirilecek" description="Aylık takvim görünümü yakında burada." />
    </div>
  );
}
