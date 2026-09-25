import type { ReactNode } from 'react';
import { requireUser, hasPermission } from '@/lib/auth';
import { NAV_ITEMS } from '@/lib/nav';
import { AppSidebar } from '@/components/AppSidebar';
import { logoutAction } from './logout-action';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const items = NAV_ITEMS.filter((item) => hasPermission(user, `${item.key}.view`));

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-[var(--color-mist)] bg-white">
        <div className="border-b border-[var(--color-mist)] px-4 py-4">
          <p className="text-sm font-semibold text-[var(--color-royal)]">Akademi Royal</p>
          <p className="text-xs text-[var(--color-royal-dim)]">Yönetim Paneli</p>
        </div>
        <AppSidebar items={items} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-mist)] bg-white px-6 py-3">
          <div className="text-sm text-[var(--color-royal-dim)]">
            <span className="font-medium text-[var(--color-royal)]">{user.name}</span> · {user.roleName}
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-[var(--color-royal-dim)] hover:text-[var(--color-royal)]">
              Çıkış Yap
            </button>
          </form>
        </header>

        <main className="flex-1 bg-[var(--color-mist)]/40 p-6">{children}</main>
      </div>
    </div>
  );
}
