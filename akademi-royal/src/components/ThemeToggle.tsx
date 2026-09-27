'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // localStorage kullanılamıyor olabilir (gizli sekme vb.); tema yine de değişir.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-[var(--color-mist)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-royal)] hover:bg-[var(--color-mist)]"
      title={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
    >
      {isDark ? '☀️ Açık Mod' : '🌙 Koyu Mod'}
    </button>
  );
}
