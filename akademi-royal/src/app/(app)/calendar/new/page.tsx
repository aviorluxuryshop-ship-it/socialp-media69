import { requirePermission } from '@/lib/auth';
import { isoDate } from '@/lib/calendar';
import { Card, PageHeader } from '@/components/ui';
import { CalendarEventForm } from '../CalendarEventForm';

export default async function NewCalendarEventPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePermission('calendar.create');
  const { date } = await searchParams;

  return (
    <div>
      <PageHeader title="Yeni Etkinlik" description="MEB sınavı, toplantı, personel izni veya diğer önemli tarihler." />
      <Card className="max-w-lg">
        <CalendarEventForm defaultDate={date ?? isoDate(new Date())} />
      </Card>
    </div>
  );
}
