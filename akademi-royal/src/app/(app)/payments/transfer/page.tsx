import { requirePermission } from '@/lib/auth';
import { getAccountsWithBalances } from '@/lib/accounting';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { TransferForm } from '../TransferForm';

export default async function TransferPage() {
  await requirePermission('payments.create');
  const accounts = await getAccountsWithBalances();

  return (
    <div>
      <PageHeader title="Hesaplar Arası Transfer" description="Kasa, banka ve POS hesapları arasında para aktarımı yapın." />
      <Card className="max-w-xl">
        {accounts.length < 2 ? (
          <EmptyState title="Transfer için en az iki hesap gerekli" description="Yeni Hesap butonuyla ikinci bir hesap oluşturun." />
        ) : (
          <TransferForm accounts={accounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance }))} />
        )}
      </Card>
    </div>
  );
}
