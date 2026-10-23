"use client";

import clsx from "clsx";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { bookTopicOptions, getBook, searchTopics } from "@/lib/catalog";
import { Sheet } from "./ui";

/** Seçili kitapların resmî içindekiler yapısından konu seçtirir (tek veya çoklu). */
export function TopicPicker({
  open,
  onClose,
  bookIds,
  value,
  onChange,
  multiple,
  title = "Konu seç",
  allowClear = true,
}: {
  open: boolean;
  onClose: () => void;
  bookIds: number[];
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  title?: string;
  allowClear?: boolean;
}) {
  const [q, setQ] = useState("");
  const books = useMemo(() => bookIds.map((id) => getBook(id)).filter((b) => b !== undefined), [bookIds]);
  const results = useMemo(() => (q.trim() ? searchTopics(q, bookIds, 30) : []), [q, bookIds]);

  function pick(id: string) {
    if (multiple) onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    else {
      onChange([id]);
      onClose();
    }
  }

  const row = (id: string, label: string, depth: 0 | 1 | 2) => {
    const on = value.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => pick(id)}
        aria-pressed={on}
        className={clsx(
          "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-[0.93rem] leading-snug transition-colors",
          depth === 0 && "mt-3 font-semibold text-ink",
          depth === 1 && "text-ink-2",
          depth === 2 && "pl-8 text-[0.88rem] text-ink-3",
          on ? "bg-accent-soft text-accent" : "hover:bg-surface-2",
        )}
      >
        <span className="min-w-0 flex-1">{label}</span>
        {on && <Check size={16} className="mt-0.5 shrink-0" />}
      </button>
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} wide>
      {books.length === 0 ? (
        <p className="text-ink-2">Önce Kitaplarım bölümünden bu ders için bir kitap seç; konu listesi o kitabın resmî içindekilerinden gelir.</p>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input data-autofocus className="field pl-10" placeholder="Konu ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {q.trim() ? (
            results.length ? (
              <div className="space-y-0.5">{results.map((r) => row(r.id, r.label, 1))}</div>
            ) : (
              <p className="py-6 text-center text-sm text-ink-3">Eşleşen konu bulunamadı.</p>
            )
          ) : (
            books.map((b) => {
              const opts = bookTopicOptions(b.id);
              return (
                <div key={b.id}>
                  <p className="eyebrow mt-4">{b.title.replace(/\.Sınıf/, ". sınıf")}</p>
                  {opts.length === 0 ? (
                    <p className="mt-2 rounded-xl bg-surface-2 px-3 py-3 text-sm text-ink-3">Bu kitabın konu dizini çıkarılamadı. Konuyu soru metninde yazarak çalışabilirsin.</p>
                  ) : (
                    <div className="space-y-0.5">{opts.map((o) => row(o.id, o.label, o.depth))}</div>
                  )}
                </div>
              );
            })
          )}
          <div className="flex items-center justify-between gap-2 pt-2">
            {allowClear ? (
              <button className="btn btn-ghost btn-sm" onClick={() => onChange([])}>
                Seçimi temizle
              </button>
            ) : (
              <span />
            )}
            {multiple && (
              <button className="btn btn-primary btn-sm" onClick={onClose}>
                Tamam ({value.length})
              </button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
