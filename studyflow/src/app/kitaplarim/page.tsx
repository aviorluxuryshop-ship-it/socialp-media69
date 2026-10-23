"use client";

import { BadgeCheck, ChevronRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookCover } from "@/components/books";
import { Notice, PageHeader, Segmented } from "@/components/ui";
import { useApp } from "@/lib/app";
import { BOOKS, booksFor, editionLabel, getBook } from "@/lib/catalog";
import { SUBJECT_BY_ID, SUBJECTS } from "@/lib/catalog/data";

export default function BooksPage() {
  const { profile } = useApp();
  const [view, setView] = useState<"mine" | "all">("mine");

  const mine = useMemo(() => (profile?.bookIds ?? []).map(getBook).filter((b) => b !== undefined), [profile?.bookIds]);
  const all = useMemo(() => (profile ? booksFor({ grade: profile.grade, schoolType: profile.schoolType }).filter((b) => b.kind === "ders") : []), [profile]);
  const list = view === "mine" ? mine : all;
  const bySubject = SUBJECTS.map((s) => ({ s, books: list.filter((b) => b.subjectId === s.id) })).filter((x) => x.books.length);
  const unresolved = (profile?.subjectIds ?? []).filter((s) => !mine.some((b) => b.subjectId === s) && all.some((b) => b.subjectId === s));

  return (
    <div>
      <PageHeader
        eyebrow="Kitaplarım"
        title="Resmî ders kitapların"
        lead="Konu anlatımları ve sınavlar bu kitaplara dayanır. Kitap kapakları, sürüm bilgisi ve PDF bağlantıları MEB'in resmî portalından doğrulandı."
        actions={
          <Link href="/hos-geldin?duzenle=1" className="btn btn-secondary btn-sm">
            <Settings2 size={16} /> Kitapları değiştir
          </Link>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          value={view}
          onChange={setView}
          label="Görünüm"
          options={[
            { value: "mine", label: `Seçtiklerim (${mine.length})` },
            { value: "all", label: `Tümü (${all.length})` },
          ]}
        />
      </div>
      {unresolved.length > 0 && view === "mine" && (
        <div className="mb-6">
          <Notice tone="warn" title="Bazı derslerde kitap seçmedin">
            {unresolved.map((s) => SUBJECT_BY_ID.get(s)?.name).join(", ")}. Bu derslerde açıklamalar genel müfredata dayanır. &quot;Tümü&quot; görünümünden kitaplara bakıp{" "}
            <Link href="/hos-geldin?duzenle=1" className="underline underline-offset-4">
              seçebilirsin
            </Link>
            .
          </Notice>
        </div>
      )}
      {bySubject.length === 0 ? (
        <Notice tone="info">Henüz kitap seçmedin. Kitaplarını seçmek için “Kitapları değiştir”e dokun.</Notice>
      ) : (
        <div className="space-y-9">
          {bySubject.map(({ s, books }) => (
            <section key={s.id}>
              <h2 className="mb-3 font-display text-xl text-ink">{s.name}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {books.map((b) => (
                  <li key={b.id}>
                    <Link href={`/kitaplarim/${b.id}`} className="card group flex gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-2)]">
                      <div className="w-[72px] shrink-0">
                        <BookCover book={b} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[1.05rem] leading-snug text-ink">{b.title.replace(/\.Sınıf/, ". sınıf")}</p>
                        <p className="mt-1 text-[13px] leading-snug text-ink-3">{editionLabel(b)}</p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span className="badge badge-ok">
                            <BadgeCheck size={12} /> Resmî kaynak
                          </span>
                          <span className="badge">
                            {b.units.length ? `${b.units.length} ${b.units[0].kind === "tema" ? "tema" : "ünite"}` : "Konu dizini yok"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="mt-1 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="mt-10 text-[13px] leading-relaxed text-ink-3">
        Kaynak: {BOOKS.length} kitap kaydı, T.C. Millî Eğitim Bakanlığı Türkiye Yüzyılı Maarif Modeli portalından (tymm.meb.gov.tr). Kitapların metni ve soruları MEB&apos;e aittir; StudyFlow bunları kopyalamaz, yalnızca
        açıklama için ilgili sayfaları geçici olarak okur ve sayfa bağlantısı verir.
      </p>
    </div>
  );
}
