import { requirePermission } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';
import { StaffForm } from '../StaffForm';

export default async function NewStaffPage() {
  await requirePermission('staff.create');

  return (
    <div>
      <PageHeader title="Yeni Personel" description="Personel bilgilerini girin." />
      <Card className="max-w-2xl">
        <StaffForm />
      </Card>
    </div>
  );
}
