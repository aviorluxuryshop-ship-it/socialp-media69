import type { CategoryId } from '@/lib/types';

// Kategori simgeleri: 48 × 48, saha çizgisi diliyle sade çizgiler.
const G: Record<CategoryId, React.ReactNode> = {
  pas: (
    <>
      <circle cx="9" cy="34" r="4" />
      <circle cx="39" cy="14" r="4" />
      <path d="M13 32c8-2 14-8 22-16m0 0h-7m7 0v7" />
    </>
  ),
  sut: (
    <>
      <path d="M6 40V16h36v24" />
      <path d="M6 28h36M16 16v24M26 16v24M36 16v24" opacity=".35" />
      <circle cx="24" cy="38" r="3.5" fill="currentColor" stroke="none" />
      <path d="M24 34c0-8 9-14 14-20" strokeDasharray="2 3" />
    </>
  ),
  kontrol: (
    <>
      <circle cx="24" cy="26" r="8" />
      <path d="M8 12c4 4 7 6 12 7M40 12c-4 4-7 6-12 7M24 4v8" />
      <path d="M10 42h28" />
    </>
  ),
  surme: (
    <>
      <path d="M5 36c6-14 10 6 16-8s10 6 16-8" strokeDasharray="1 0" />
      <circle cx="40" cy="14" r="4" />
      <path d="M5 42h38" opacity=".35" />
    </>
  ),
  kafa: (
    <>
      <circle cx="24" cy="12" r="6" />
      <path d="M14 42c0-8 4-13 10-13s10 5 10 13" />
      <path d="M24 20v5" />
      <path d="M10 6l4 3M38 6l-4 3" opacity=".5" />
    </>
  ),
  bitiricilik: (
    <>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="10" />
      <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  hucum: (
    <>
      <path d="M8 40 20 22l8 8 14-18m0 0h-9m9 0v9" />
      <path d="M8 44h34" opacity=".35" />
    </>
  ),
  savunma: (
    <>
      <path d="M24 5 8 11v13c0 10 7 16 16 19 9-3 16-9 16-19V11L24 5Z" />
      <path d="M17 24l5 5 9-10" />
    </>
  ),
  kalecilik: (
    <>
      <path d="M13 22V12a3 3 0 0 1 6 0v6m0-8a3 3 0 0 1 6 0v8m0-6a3 3 0 0 1 6 0v6m0-3a3 3 0 0 1 6 0v10c0 8-6 14-14 14s-14-5-14-12v-6l6 6" />
    </>
  ),
  duran: (
    <>
      <path d="M14 6v38" />
      <path d="M14 8h22l-6 8 6 8H14" />
      <path d="M8 44h14" />
    </>
  ),
  topsuz: (
    <>
      <circle cx="10" cy="38" r="4" />
      <path d="M15 35c6-3 8-10 16-14" strokeDasharray="3 3" />
      <path d="M31 21l-6 0m6 0 0 6" />
      <circle cx="40" cy="14" r="2" fill="currentColor" stroke="none" />
    </>
  ),
};

export function CatGlyph({ id, size = 44 }: { id: CategoryId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {G[id]}
    </svg>
  );
}
