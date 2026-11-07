"use client";

import { Dot, Segmented } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { BranchFilter } from "@/lib/types";

/** Sayfa içi şube seçimi; üst çubuktaki seçiciyle aynı durumu paylaşır. */
export function BranchTabs({ allowAll = true }: { allowAll?: boolean }) {
  const branches = useStore((s) => s.branches);
  const value = useStore((s) => s.branchFilter);
  const set = useStore((s) => s.setBranchFilter);
  const options: { value: BranchFilter; label: React.ReactNode }[] = [
    ...(allowAll ? [{ value: "all" as BranchFilter, label: "Tüm şubeler" }] : []),
    ...branches.map((b) => ({
      value: b.id as BranchFilter,
      label: (
        <>
          <Dot color={b.color} /> {b.name}
        </>
      ),
    })),
  ];
  return <Segmented<BranchFilter> label="Şube" value={value} onChange={set} options={options} />;
}
