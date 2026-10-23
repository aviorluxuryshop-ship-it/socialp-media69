"use client";

import { FileText, NotebookPen } from "lucide-react";
import clsx from "clsx";
import { uploadUsable } from "@/lib/materials";
import { useRecords } from "@/lib/store/provider";
import { Sheet } from "./ui";

export interface PickedMaterial {
  type: "note" | "upload";
  id: string;
  title: string;
}

/** Notlardan ve yüklenen belgelerden (en fazla 3) materyal seçtirir. Metni çıkarılamayan belgeler seçilemez. */
export function MaterialPicker({
  open,
  onClose,
  value,
  onChange,
  max = 3,
}: {
  open: boolean;
  onClose: () => void;
  value: PickedMaterial[];
  onChange: (v: PickedMaterial[]) => void;
  max?: number;
}) {
  const notes = useRecords("note", { limit: 100 });
  const uploads = useRecords("upload", { limit: 100 });
  const has = (id: string) => value.some((v) => v.id === id);
  const toggle = (m: PickedMaterial) => (has(m.id) ? onChange(value.filter((v) => v.id !== m.id)) : value.length < max ? onChange([...value, m]) : undefined);

  const row = (key: string, icon: React.ReactNode, title: string, sub: string, on: boolean, disabled: boolean, onClick: () => void) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors", on ? "bg-accent-soft" : "hover:bg-surface-2", disabled && "opacity-50")}
    >
      <span className="text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.95rem] font-medium text-ink">{title}</span>
        <span className="block truncate text-[13px] text-ink-3">{sub}</span>
      </span>
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Materyal seç">
      <p className="mb-3 text-sm text-ink-3">Seçtiklerin açıklamaya ve sorulara temel olur (en fazla {max}). Yalnızca metni çıkarılabilen belgeler seçilebilir.</p>
      <div className="space-y-0.5">
        {notes.items.map((n) => row(n.id, <NotebookPen size={18} />, n.title || "Başlıksız not", `Not · ${n.body.length} karakter`, has(n.id), n.body.trim().length < 20, () => toggle({ type: "note", id: n.id, title: n.title || "Not" })))}
        {uploads.items.map((u) => {
          const ok = uploadUsable(u);
          return row(u.id, <FileText size={18} />, u.name, ok ? `${u.pageCount} sayfa · metin çıkarıldı` : "Metin çıkarılamadı — seçilemez", has(u.id), !ok, () => toggle({ type: "upload", id: u.id, title: u.name }));
        })}
        {!notes.items.length && !uploads.items.length && <p className="py-6 text-center text-sm text-ink-3">Henüz not veya yüklenmiş belge yok.</p>}
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={onClose}>
          Tamam ({value.length})
        </button>
      </div>
    </Sheet>
  );
}
