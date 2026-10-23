"use client";

import { FilePlus2, Pin, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmSheet, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { useApp } from "@/lib/app";
import { topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { timeAgo } from "@/lib/dates";
import { fold } from "@/lib/text";
import { plainSnippet } from "@/lib/mdedit";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { NoteRecord } from "@/lib/types";

const PAGE = 24;

export default function NotesPage() {
  const { profile, toast } = useApp();
  const { remove } = useStoreCtx();
  const notes = useRecords("note");
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [del, setDel] = useState<NoteRecord | null>(null);

  const list = useMemo(() => {
    const needle = fold(q);
    return notes.items
      .filter((n) => (!subject || n.subjectId === subject) && (!needle || fold(`${n.title} ${n.body} ${n.tags.join(" ")} ${topicLabel(n.topicId)}`).includes(needle)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes.items, q, subject]);

  return (
    <div>
      <PageHeader
        eyebrow="Notlarım"
        title="Kendi notların"
        lead="Yazmak için yapay zekâ gerekmez. İstersen sonra bir notu açıklatabilir, özetletebilir veya test yaptırabilirsin."
        actions={
          <Link href="/notlar/yeni" className="btn btn-primary">
            <FilePlus2 size={18} /> Yeni not
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input className="field pl-10" placeholder="Notlarda ara…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Notlarda ara" />
        </div>
        <select className="field w-auto min-w-[160px]" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Derse göre filtrele">
          <option value="">Tüm dersler</option>
          {(profile?.subjectIds ?? []).map((s) => (
            <option key={s} value={s}>
              {subjectName(s)}
            </option>
          ))}
        </select>
      </div>

      {notes.loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : notes.error ? (
        <EmptyState title="Notlar okunamadı" text={notes.error} />
      ) : list.length === 0 ? (
        notes.items.length === 0 ? (
          <EmptyState
            icon={<FilePlus2 size={22} />}
            title="İlk notunu yaz"
            text="Başlık, biçimlendirme ve otomatik kayıt hazır. Konu ve ders ekleyerek notlarını düzenli tutabilirsin."
            action={
              <Link href="/notlar/yeni" className="btn btn-primary">
                Not yaz
              </Link>
            }
          />
        ) : (
          <EmptyState title="Eşleşen not yok" text="Aramayı veya filtreyi değiştirmeyi dene." />
        )
      ) : (
        <>
          <ul className="stagger grid gap-3 sm:grid-cols-2">
            {list.slice(0, shown).map((n) => (
              <li key={n.id} className="card group relative transition-shadow hover:shadow-[var(--shadow-2)]">
                <Link href={`/notlar/${n.id}`} className="block p-4 pr-12">
                  <div className="mb-1.5 flex items-center gap-2">
                    {n.pinned && <Pin size={14} className="text-brass" aria-label="Sabitlendi" />}
                    <h2 className="truncate font-display text-[1.1rem] text-ink">{n.title || "Başlıksız not"}</h2>
                  </div>
                  <p className="line-clamp-2 min-h-[2.8em] text-[0.92rem] leading-snug text-ink-3">{plainSnippet(n.body) || "Boş not"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {n.subjectId && <span className="badge badge-accent">{subjectName(n.subjectId)}</span>}
                    {n.topicId && <span className="badge max-w-[200px] truncate">{topicLabel(n.topicId)}</span>}
                    <span className="ml-auto text-[12.5px] text-ink-3">{timeAgo(n.updatedAt)}</span>
                  </div>
                </Link>
                <button
                  className="btn btn-ghost btn-icon btn-sm absolute right-2 top-2 opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  aria-label={`${n.title || "Not"} notunu sil`}
                  onClick={() => setDel(n)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          {list.length > shown && (
            <div className="mt-6 text-center">
              <button className="btn btn-secondary" onClick={() => setShown(shown + PAGE)}>
                Daha fazla göster ({list.length - shown})
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmSheet
        open={del !== null}
        title="Notu sil"
        text={`“${del?.title || "Başlıksız not"}” kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            await remove("note", del.id);
            toast("Not silindi.", "ok");
          } catch {
            toast("Not silinemedi.", "error");
          }
        }}
      />
    </div>
  );
}
