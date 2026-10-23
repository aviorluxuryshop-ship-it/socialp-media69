"use client";

import { ArrowLeft, ClipboardCheck, ExternalLink, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookCover } from "@/components/books";
import { Notice, KeyValue } from "@/components/ui";
import { editionLabel, getBook, pdfPageUrl } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const book = getBook(Number(id));
  if (!book) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl text-ink">Kitap bulunamadı</p>
        <Link href="/kitaplarim" className="btn btn-secondary mt-5">
          Kitaplarıma dön
        </Link>
      </div>
    );
  }
  const unitWord = book.units[0]?.kind === "unite" ? "Ünite" : "Tema";
  return (
    <div>
      <Link href="/kitaplarim" className="btn btn-ghost btn-sm -ml-2 mb-4">
        <ArrowLeft size={17} /> Kitaplarım
      </Link>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0">
          <BookCover book={book} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-2">{subjectName(book.subjectId)}</p>
          <h1 className="font-display text-[1.8rem] leading-tight text-ink sm:text-[2.1rem]">{book.title.replace(/\.Sınıf/, ". sınıf")}</h1>
          <p className="mt-2 text-ink-2">{editionLabel(book)}</p>
          <dl className="hair mt-5 max-w-md">
            <KeyValue k="Yayıncı" v={book.publisher} />
            <KeyValue k="Sayfa sayısı" v={book.pageCount || "—"} />
            <KeyValue k="Güncelleme" v={book.updatedOn ? book.updatedOn.split("-").reverse().join(".") : "Belirtilmemiş"} />
            <KeyValue k="Konu dizini" v={book.tocVerified ? "Doğrulandı" : "Yok"} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <ExternalLink size={16} /> Resmî PDF
            </a>
            <a href={book.detailUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              Portal sayfası
            </a>
          </div>
        </div>
      </div>

      {book.units.length === 0 ? (
        <Notice tone="warn" title="Bu kitabın konu dizini çıkarılamadı">
          Sayfa düzeni otomatik ayrıştırmaya uygun olmadığı için ünite ve konu listesi eklenmedi (uydurma bir liste göstermiyoruz). Konuyu soru metninde yazarak çalışabilir, notlarını yazabilir veya
          kitaptan sayfa yükleyebilirsin.
        </Notice>
      ) : (
        <div className="space-y-7">
          {book.units.map((u) => (
            <section key={u.id}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl text-ink">
                  {u.no}. {unitWord}: {u.title}
                </h2>
                <a href={pdfPageUrl(book, u.page)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-ink-3 underline-offset-4 hover:text-accent hover:underline">
                  s. {u.page}
                </a>
              </div>
              {u.topics.length === 0 ? (
                <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <span className="text-[0.95rem] text-ink-2">
                    s. {u.page}–{u.endPage}
                  </span>
                  <TopicActions topicId={u.id} />
                </div>
              ) : (
                <ul className="card hair overflow-hidden">
                  {u.topics.map((t) => (
                    <li key={t.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.97rem] font-medium leading-snug text-ink">
                            <span className="mr-1.5 text-ink-3">{t.no}</span>
                            {t.title}
                          </p>
                          <a href={pdfPageUrl(book, t.page)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-3 underline-offset-4 hover:text-accent hover:underline">
                            s. {t.page}–{t.endPage}
                          </a>
                        </div>
                        <TopicActions topicId={t.id} />
                      </div>
                      {t.sections.length > 0 && (
                        <ul className="mt-2.5 space-y-1 border-l border-line pl-3.5">
                          {t.sections.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-3 text-[0.9rem] text-ink-2">
                              <span className="min-w-0 truncate">
                                <span className="mr-1.5 text-ink-3">{s.no}</span>
                                {s.title}
                              </span>
                              <Link href={`/ogren?konu=${s.id}`} className="shrink-0 text-[13px] text-accent underline-offset-4 hover:underline">
                                Anlat
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicActions({ topicId }: { topicId: string }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-1.5">
      <Link href={`/ogren?konu=${topicId}`} className="btn btn-secondary btn-sm">
        <Sparkles size={15} /> Anlat
      </Link>
      <Link href={`/sinav?konu=${topicId}`} className="btn btn-ghost btn-sm">
        <ClipboardCheck size={15} /> Test
      </Link>
      <Link href={`/video?konu=${topicId}`} className="btn btn-ghost btn-sm">
        <PlayCircle size={15} /> Video
      </Link>
    </div>
  );
}
