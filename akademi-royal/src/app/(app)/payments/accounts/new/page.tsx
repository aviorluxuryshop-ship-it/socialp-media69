import { requirePermission } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';
import { AccountForm } from '../../AccountForm';

export default async function NewAccountPage() {
  await requirePermission('payments.create');

  return (
    <div>
      <PageHeader title="Yeni Hesap" description="Kasa, banka veya POS hesabı tanımlayın." />
      <Card className="max-w-lg">
        <AccountForm />
      </Card>
    </div>
  );
}
