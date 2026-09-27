'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebarCollapsed') === '1');
    } catch {
      // localStorage kullanılamıyor olabilir; varsayılan (açık) durumda kal.
    }
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
    } catch {
      // yoksay
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`shrink-0 overflow-hidden border-r border-[var(--color-mist)] bg-[var(--color-surface)] transition-all duration-150 ${
          collapsed ? 'w-0 border-r-0' : 'w-60'
        }`}
      >
        <div className="w-60">{sidebar}</div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center border-b border-[var(--color-mist)] bg-[var(--color-surface)] px-2 py-1">
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? 'Menüyü göster' : 'Menüyü gizle'}
            className="rounded-md px-2 py-1.5 text-sm text-[var(--color-royal-dim)] hover:bg-[var(--color-mist)] hover:text-[var(--color-royal)]"
          >
            {collapsed ? '☰ Menü' : '⟨⟨'}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
