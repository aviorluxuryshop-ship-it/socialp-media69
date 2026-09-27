'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-royal-dim)] hover:text-[var(--color-royal)]"
    >
      ← Geri
    </button>
  );
}
