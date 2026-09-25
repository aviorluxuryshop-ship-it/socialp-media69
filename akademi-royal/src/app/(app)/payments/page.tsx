import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function PaymentsPage() {
  await requirePermission('payments.view');

  return (
    <div>
      <PageHeader title="Hesaplarım" description="Ödemeler, cari hesaplar, kasa/banka/POS." />
      <EmptyState title="Bu modül Faz 4'te geliştirilecek" description="Ödeme kaydı ve hesap ekstresi yakında burada." />
    </div>
  );
}
