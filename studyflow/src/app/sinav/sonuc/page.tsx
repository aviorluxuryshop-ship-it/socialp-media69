"use client";

import clsx from "clsx";
import { Check, ChevronDown, CircleHelp, MinusCircle, PlayCircle, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { QuestionMeta } from "@/components/QuestionMeta";
import { CheckMark, Notice, ProgressBar, Skeleton } from "@/components/ui";
import { pdfPageUrl, getBook, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { makeRevisionExam, summarizeAttempt } from "@/lib/exam/analysis";
import { formatDay, toDay } from "@/lib/dates";
import { isCorrect, MIN_ATTEMPTS, MIN_QUESTIONS, mistakePatterns, topicStats, type TopicLevel } from "@/lib/memory/insights";
import { useRecord, useRecords, useStoreCtx } from "@/lib/store/provider";
import type { AttemptRecord, Question } from "@/lib/types";

const LEVEL: Record<TopicLevel, { label: string; cls: string }> = {
  insufficient: { label: "Henüz yeterli veri yok", cls: "" },
  strong: { label: "Sağlam görünüyor", cls: "badge-ok" },
  steady: { label: "Gelişiyor", cls: "badge-accent" },
  review: { label: "Tekrar önerilir", cls: "badge-warn" },
};

function Result() {
  const id = useSearchParams().get("deneme");
  const { item, loading } = useRecord("attempt", id);
  const all = useRecords("attempt", { limit: 200 });
  if (loading || all.loading) return <Skeleton className="h-72 w-full" />;
  if (!item)
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl text-ink">Sonuç bulunamadı</p>
        <Link href="/sinav" className="btn btn-secondary mt-5">
          Sınavlara dön
        </Link>
      </div>
    );
  return <View a={item} all={all.items} />;
}

function View({ a, all }: { a: AttemptRecord; all: AttemptRecord[] }) {
  const router = useRouter();
  const { update, create } = useStoreCtx();
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "wrong">("all");
  const stats = useMemo(() => topicStats(all), [all]);
  const sum = useMemo(() => summarizeAttempt(a, stats), [a, stats]);
  const patterns = useMemo(() => mistakePatterns(all), [all]);
  const pct = sum.auto.total ? sum.auto.correct / sum.auto.total : 0;

  async function setHits(q: Question, hits: number[]) {
    await update("attempt", a.id, { rubricHits: { ...a.rubricHits, [q.id]: hits } });
  }

  async function reviseWrong() {
    const data = makeRevisionExam(sum.wrong, Math.min(15, sum.wrong.length), "Hata tekrarı · bu denemeden");
    if (!data) return;
    const rec = await create("exam", data);
    router.push(`/sinav/coz?id=${rec.id}&anlik=1`);
  }

  const reviewList = a.questions.filter((q) => filter === "all" || isCorrect(q, a.answers[q.id]) === false);

  return (
    <div className="space-y-10">
      <header className="space-y-5">
        <div className="flex items-start gap-4">
          <CheckMark size={52} />
          <div>
            <p className="eyebrow mb-1.5">Sonuç · {formatDay(toDay(new Date(a.finishedAt)))}</p>
            <h1 className="font-display text-[1.8rem] leading-tight text-ink sm:text-[2.2rem]">{a.examTitle}</h1>
          </div>
        </div>

        {sum.auto.total > 0 && (
          <div className="card space-y-3.5 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-[2.2rem] leading-none text-ink">
                {sum.auto.correct}
                <span className="text-ink-3"> / {sum.auto.total}</span>
              </p>
              <p className="text-sm text-ink-3">
                {sum.auto.unanswered > 0 ? `${sum.auto.unanswered} boş · ` : ""}
                {Math.floor(a.durationSec / 60)} dk {a.durationSec % 60} sn
              </p>
            </div>
            <ProgressBar value={pct} tone={pct >= 0.7 ? "ok" : pct >= 0.45 ? "accent" : "warn"} label="Doğru oranı" />
            <p className="text-[0.92rem] leading-relaxed text-ink-2">
              {sum.auto.total < 8
                ? "Bu denemede az soru vardı; tek bir deneme için yüzde yorumu yapmıyoruz. Daha fazla çözdükçe konu bazında net bir resim oluşur."
                : `Bu denemede otomatik puanlanan ${sum.auto.total} sorunun ${Math.round(pct * 100)}%'ini doğru yaptın. Bu tek bir deneme; konu durumları aşağıda ancak yeterli kanıt toplanınca belirir.`}
            </p>
          </div>
        )}
        {sum.manual.total > 0 && (
          <div className="card p-5 text-[0.95rem] text-ink-2">
            <p className="font-semibold text-ink">Yazılı ve kısa cevaplı sorular</p>
            <p className="mt-1">Bunları otomatik puanlamıyoruz. Aşağıda örnek cevaba ve puanlama anahtarına bakıp kendini işaretle.{sum.manual.rubricTotal > 0 ? ` Şu ana kadar ${sum.manual.rubricHit}/${sum.manual.rubricTotal} madde işaretlendi.` : ""}</p>
          </div>
        )}
      </header>

      {sum.byTopic.length > 0 && (
        <section aria-label="Konu bazında">
          <h2 className="mb-3 font-display text-xl text-ink">Konu bazında</h2>
          <ul className="card hair overflow-hidden">
            {sum.byTopic.map((t) => {
              const lv = LEVEL[t.level];
              return (
                <li key={t.topicId} className="space-y-2 px-4 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="min-w-0 flex-1 text-[0.97rem] font-medium leading-snug text-ink">{topicLabel(t.topicId) || subjectName(t.subjectId)}</p>
                    <p className="shrink-0 text-sm tabular-nums text-ink-2">
                      Bu denemede {t.correct}/{t.total}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx("badge", lv.cls)}>{lv.label}</span>
                    {t.level === "insufficient" && (
                      <span className="text-[12.5px] text-ink-3">
                        Durum için en az {MIN_QUESTIONS} soru ve {MIN_ATTEMPTS} deneme gerekir (şimdi {t.evidence.questions} soru, {t.evidence.attempts} deneme).
                      </span>
                    )}
                  </div>
                  {t.correct < t.total && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <Link href={`/ogren?konu=${t.topicId}`} className="btn btn-secondary btn-sm">
                        <Sparkles size={15} /> Konuyu anlat
                      </Link>
                      <Link href={`/video?konu=${t.topicId}`} className="btn btn-ghost btn-sm">
                        <PlayCircle size={15} /> Video bul
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label="Hata örüntüleri">
        <h2 className="mb-3 font-display text-xl text-ink">Hata örüntüleri</h2>
        {patterns.length > 0 ? (
          <ul className="card hair overflow-hidden">
            {patterns.slice(0, 4).map((p) => (
              <li key={p.tag} className="flex items-baseline justify-between gap-3 px-4 py-3.5">
                <span className="text-[0.97rem] text-ink">{p.tag}</span>
                <span className="text-sm text-ink-3">
                  {p.count} kez · {p.topics} konuda
                </span>
              </li>
            ))}
          </ul>
        ) : sum.tagsInAttempt.length > 0 ? (
          <Notice tone="info" title="Bu denemede dikkat çeken">
            {sum.tagsInAttempt.map((t) => `“${t.tag}” (${t.count} soru)`).join(", ")}. Tek denemeden kalıcı bir örüntü çıkarmıyoruz; tekrar ederse burada görünür.
          </Notice>
        ) : (
          <p className="text-[0.95rem] text-ink-3">Henüz belirgin bir hata örüntüsü yok. Aynı hata birkaç denemede tekrarlanırsa burada gösteririz.</p>
        )}
      </section>

      {sum.wrong.length > 0 && (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-lg text-ink">Önerilen tekrar</p>
            <p className="mt-1 text-[0.93rem] text-ink-2">{sum.wrong.length} yanlışını kısa bir testle yeniden çöz; anında açıklama görürsün.</p>
          </div>
          <button className="btn btn-primary" onClick={() => void reviseWrong()}>
            <RotateCcw size={17} /> Yanlışlarımı çöz
          </button>
        </section>
      )}

      <section aria-label="Soru soru inceleme">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">Sorular</h2>
          <div className="inline-flex gap-1 rounded-2xl border border-line bg-surface-2 p-1 text-sm" role="radiogroup" aria-label="Filtre">
            {(["all", "wrong"] as const).map((f) => (
              <button key={f} role="radio" aria-checked={filter === f} onClick={() => setFilter(f)} className={clsx("rounded-xl px-3 py-1.5 font-medium", filter === f ? "bg-raised text-ink shadow-[var(--shadow-1)]" : "text-ink-3")}>
                {f === "all" ? "Tümü" : "Yanlışlar"}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-[13px] leading-relaxed text-ink-3">
          {a.questions.every((q) => q.provenance === "ai-generated")
            ? "Bu denemedeki tüm sorular yapay zekâ ürettiği sorulardır; resmî MEB sorusu değildir. Her sorunun altında hangi kontrollerden geçtiği yazar."
            : "Her sorunun kökeni (resmî / yapay zekâ üretimi) ve geçtiği kontroller sorunun altında yazar."}
        </p>
        <ul className="space-y-3">
          {reviewList.map((q) => {
            const i = a.questions.indexOf(q);
            const ans = a.answers[q.id];
            const r = isCorrect(q, ans);
            const isOpen = open === q.id;
            const book = q.source.bookId ? getBook(q.source.bookId) : null;
            const hits = a.rubricHits[q.id] ?? [];
            return (
              <li key={q.id} className="card overflow-hidden">
                <button className="flex w-full items-start gap-3 px-4 py-3.5 text-left" onClick={() => setOpen(isOpen ? null : q.id)} aria-expanded={isOpen}>
                  <span className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", r === true ? "bg-ok-soft text-ok" : r === false ? "bg-warn-soft text-warn" : "bg-surface-2 text-ink-3")}>
                    {r === true ? <Check size={14} strokeWidth={3} /> : r === false ? (ans === null || ans === "" ? <MinusCircle size={14} /> : <X size={14} strokeWidth={3} />) : <CircleHelp size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.82rem] text-ink-3">
                      Soru {i + 1} · {topicLabel(q.topicId) || subjectName(q.subjectId)}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[0.97rem] leading-snug text-ink">{q.stem.replace(/\$/g, "")}</span>
                  </span>
                  <ChevronDown size={18} className={clsx("mt-1 shrink-0 text-ink-3 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="space-y-4 border-t border-line px-4 py-4">
                    <QuestionMeta q={q} />
                    <div className="text-[1rem] leading-relaxed text-ink">
                      <Markdown>{q.stem}</Markdown>
                    </div>
                    {(q.type === "mcq" || q.type === "truefalse") && (
                      <ul className="space-y-2">
                        {q.choices!.map((c, ci) => {
                          const chosen = ans === ci;
                          const isAns = ci === q.answerIndex;
                          return (
                            <li key={ci} className={clsx("flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-[0.95rem]", isAns ? "border-ok/50 bg-ok-soft" : chosen ? "border-warn/50 bg-warn-soft" : "border-line")}>
                              <span className="mt-px w-5 shrink-0 text-sm font-semibold text-ink-3">{String.fromCharCode(65 + ci)}</span>
                              <span className="min-w-0 flex-1">
                                <Markdown>{c}</Markdown>
                                {chosen && !isAns && q.choiceTags?.[ci] && <span className="mt-1 block text-[12.5px] text-warn">Bu seçenek genelde şu hatadan gelir: {q.choiceTags[ci]}</span>}
                              </span>
                              <span className="shrink-0 text-xs font-medium text-ink-3">{isAns ? "Doğru" : chosen ? "Senin cevabın" : ""}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {(q.type === "short" || q.type === "written") && (
                      <div className="space-y-3">
                        <div>
                          <p className="eyebrow mb-1">Senin cevabın</p>
                          <p className="whitespace-pre-wrap rounded-xl bg-surface-2 px-3.5 py-3 text-[0.95rem] text-ink-2">{typeof ans === "string" && ans ? ans : "Boş bıraktın."}</p>
                        </div>
                        <div>
                          <p className="eyebrow mb-1">Örnek cevap</p>
                          <div className="rounded-xl bg-ok-soft/60 px-3.5 py-3 text-[0.95rem] text-ink">
                            <Markdown>{q.answerText ?? ""}</Markdown>
                          </div>
                        </div>
                        {q.type === "written" && q.rubric ? (
                          <div>
                            <p className="eyebrow mb-1.5">Kendini değerlendir — yanıtında hangileri var?</p>
                            <ul className="space-y-1.5">
                              {q.rubric.map((r2, ri) => {
                                const on = hits.includes(ri);
                                return (
                                  <li key={ri}>
                                    <button
                                      className={clsx("flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[0.93rem]", on ? "border-ok/50 bg-ok-soft" : "border-line hover:bg-surface-2")}
                                      aria-pressed={on}
                                      onClick={() => void setHits(q, on ? hits.filter((h) => h !== ri) : [...hits, ri])}
                                    >
                                      <span className={clsx("mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border", on ? "border-ok bg-ok text-accent-ink" : "border-line-strong")}>{on && <Check size={12} strokeWidth={3} />}</span>
                                      {r2}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : (
                          <button className={clsx("btn btn-sm", hits.length ? "btn-primary" : "btn-secondary")} aria-pressed={hits.length > 0} onClick={() => void setHits(q, hits.length ? [] : [0])}>
                            <Check size={15} /> {hits.length ? "Doğru yaptım olarak işaretli" : "Doğru yaptım"}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="rounded-2xl bg-surface-2 px-4 py-3.5 text-[0.95rem] leading-relaxed text-ink-2">
                      <p className="mb-1 font-semibold text-ink">Açıklama</p>
                      <Markdown>{q.explanation}</Markdown>
                      {q.commonMistake && <p className="mt-2 text-[0.9rem] text-ink-3">Sık yapılan hata: {q.commonMistake}</p>}
                    </div>
                    {book && q.source.pages && (
                      <p className="text-[13px] text-ink-3">
                        Konu kaynağı:{" "}
                        <a href={pdfPageUrl(book, q.source.pages[0])} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-4 hover:underline">
                          {book.title.replace(/\.Sınıf/, ". sınıf")}, s. {q.source.pages[0]}–{q.source.pages[1]}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 pb-4">
        <Link href="/sinav" className="btn btn-secondary">
          Yeni sınav
        </Link>
        <Link href="/ilerleme" className="btn btn-ghost">
          İlerlememe bak
        </Link>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  );
}
