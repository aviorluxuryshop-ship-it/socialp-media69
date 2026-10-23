"use client";

import clsx from "clsx";
import { BadgeCheck, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { SUBJECT_BY_ID } from "@/lib/catalog/data";
import { type CatalogBook, coverFor, editionLabel } from "@/lib/catalog";

/** Resmî kapak doğrulanmışsa onu gösterir; yüklenemezse sade bir yazı kapağına düşer (uydurma kapak yok). */
export function BookCover({ book, className }: { book: CatalogBook; className?: string }) {
  const src = coverFor(book);
  const [failed, setFailed] = useState(false);
  const subject = SUBJECT_BY_ID.get(book.subjectId);
  if (src && !failed) {
    return (
      // Resmî MEB kapağı doğrudan kaynağından gösterilir (depoya kopyalanmaz).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${book.title} kapağı`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={clsx("aspect-[3/4] w-full rounded-lg border border-line bg-surface-2 object-cover shadow-[var(--shadow-1)]", className)}
      />
    );
  }
  return (
    <div
      className={clsx("flex aspect-[3/4] w-full flex-col justify-between rounded-lg border border-line bg-accent-soft p-3 text-accent", className)}
      role="img"
      aria-label={`${book.title} (kapak görseli doğrulanamadı)`}
    >
      <span className="eyebrow text-accent/80">{book.grade}. sınıf</span>
      <span className="font-display text-[0.95rem] leading-tight">{subject?.name ?? book.title}</span>
    </div>
  );
}

export function BookCard({
  book,
  selected,
  onToggle,
  compact,
}: {
  book: CatalogBook;
  selected?: boolean;
  onToggle?: () => void;
  compact?: boolean;
}) {
  const body = (
    <>
      <div className={clsx("shrink-0", compact ? "w-14" : "w-20")}>
        <BookCover book={book} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-display text-[1.02rem] leading-snug text-ink">{book.title.replace(/\.Sınıf/, ". sınıf")}</p>
        <p className="mt-1 text-[13px] leading-snug text-ink-3">{editionLabel(book)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="badge badge-ok">
            <BadgeCheck size={12} /> Resmî kaynak
          </span>
          {book.tocVerified ? <span className="badge">Konu dizini doğrulandı</span> : <span className="badge badge-warn">Konu dizini yok</span>}
        </div>
      </div>
      {onToggle && (
        <span
          aria-hidden
          className={clsx("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors", selected ? "border-accent bg-accent text-accent-ink" : "border-line-strong text-transparent")}
        >
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </>
  );
  if (!onToggle) return <div className="card flex gap-4 p-4">{body}</div>;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={clsx("card flex w-full gap-4 p-4 text-left transition-colors", selected ? "border-accent/50 bg-accent-soft/40" : "hover:bg-surface-2")}
    >
      {body}
    </button>
  );
}

export function OfficialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline">
      {children}
      <ExternalLink size={13} />
    </a>
  );
}
