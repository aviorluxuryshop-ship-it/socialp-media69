import { requirePermission } from '@/lib/auth';
import { EmptyState, PageHeader } from '@/components/ui';

export default async function SettingsPage() {
  await requirePermission('settings.view');

  return (
    <div>
      <PageHeader title="Ayarlar" description="Kurum bilgisi, kullanıcılar, roller ve yetkiler." />
      <EmptyState
        title="Kullanıcı ve rol yönetimi ilerleyen fazlarda genişletilecek"
        description="Şu an için ilk yönetici kullanıcısı seed script ile oluşturuldu."
      />
    </div>
  );
}
