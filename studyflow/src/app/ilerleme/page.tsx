"use client";

import { ArrowRight, BookOpenCheck, Clock3, Compass, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState, Notice, PageHeader, ProgressBar, SectionTitle, Skeleton } from "@/components/ui";
import { topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { timeAgo } from "@/lib/dates";
import { MIN_ATTEMPTS, MIN_QUESTIONS, levelOf, mistakePatterns, repeatedMistakes, studiedTopics, suggest, topicStats, type TopicLevel } from "@/lib/memory/insights";
import { useRecords } from "@/lib/store/provider";

const LEVEL_TEXT: Record<TopicLevel, { label: string; tone: "ok" | "accent" | "warn" | "none" }> = {
  strong: { label: "Sağlam görünüyor", tone: "ok" },
  steady: { label: "Gelişiyor", tone: "accent" },
  review: { label: "Tekrar iyi gelir", tone: "warn" },
  insufficient: { label: "Henüz yeterli veri yok", tone: "none" },
};

export default function ProgressPage() {
  const attempts = useRecords("attempt", { limit: 200 });
  const events = useRecords("event", { limit: 500 });
  const cards = useRecords("card", { limit: 500 });
  const loading = attempts.loading || events.loading || cards.loading;

  const data = useMemo(() => {
    const stats = [...topicStats(attempts.items).values()].sort((a, b) => b.lastAt - a.lastAt);
    const studied = [...studiedTopics(events.items).values()].sort((a, b) => b.lastAt - a.lastAt);
    const minutes = events.items.reduce((s, e) => s + (e.minutes ?? 0), 0);
    return {
      stats,
      studied,
      minutes,
      repeats: repeatedMistakes(attempts.items),
      patterns: mistakePatterns(attempts.items),
      tips: suggest({ attempts: attempts.items, events: events.items, cards: cards.items }),
    };
  }, [attempts.items, events.items, cards.items]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const empty = attempts.items.length === 0 && events.items.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="İlerleme"
        title="Nerede olduğunu dürüstçe gör"
        lead="Burada yalnızca gerçekten yaptığın çalışmalar ve çözdüğün sorular sayılır. Tek bir yanlış bir konuyu zayıf yapmaz; yorum için yeterli kanıt gerekir. Seri, sıralama ya da puan baskısı yoktur."
      />

      {empty ? (
        <EmptyState
          icon={<Compass size={22} />}
          title="Henüz gösterecek bir şey yok"
          text="Bir konuyu çalışıp kısa bir test çözdüğünde burada hangi konulara baktığını ve neyi pekiştirmen gerektiğini görürsün."
          action={
            <Link href="/ogren" className="btn btn-primary">
              İlk konunu seç <ArrowRight size={16} />
            </Link>
          }
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Özet">
            <Stat icon={<BookOpenCheck size={18} />} value={String(data.studied.length)} label="Çalışılan konu" />
            <Stat icon={<RotateCcw size={18} />} value={String(attempts.items.length)} label="Çözülen deneme" />
            <Stat icon={<Clock3 size={18} />} value={data.minutes ? `${data.minutes} dk` : "—"} label="Kayıtlı çalışma süresi" />
          </section>

          <SectionTitle>Sıradaki adım</SectionTitle>
          <ul className="space-y-2.5">
            {data.tips.map((t) => (
              <li key={t.id}>
                <Link href={t.href} className="card group flex items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-2)]">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{t.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ink-3">{t.reason}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>

          <SectionTitle aside={`Yorum için en az ${MIN_QUESTIONS} soru, ${MIN_ATTEMPTS} deneme`}>Konu bazında sonuçlar</SectionTitle>
          {data.stats.length === 0 ? (
            <Notice tone="info">Henüz otomatik puanlanan (çoktan seçmeli / doğru-yanlış) bir sorun yok. Test çözdükçe konu sonuçları burada belirir.</Notice>
          ) : (
            <ul className="card hair overflow-hidden">
              {data.stats.map((s) => {
                const level = levelOf(s);
                const meta = LEVEL_TEXT[level];
                return (
                  <li key={s.topicId} className="space-y-2 px-4 py-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="min-w-0 font-medium text-ink">{topicLabel(s.topicId) || subjectName(s.subjectId)}</p>
                      <span className={level === "insufficient" ? "badge" : level === "review" ? "badge badge-warn" : level === "strong" ? "badge badge-ok" : "badge badge-accent"}>{meta.label}</span>
                    </div>
                    {level === "insufficient" ? (
                      <p className="text-sm text-ink-3">
                        {s.questions} soru, {s.attempts} deneme. Anlamlı bir yorum için biraz daha soru gerekiyor; şimdilik bir şey söylemiyoruz.
                      </p>
                    ) : (
                      <>
                        <ProgressBar value={s.correct / s.questions} tone={meta.tone === "none" ? "accent" : meta.tone} label={`${topicLabel(s.topicId)} doğru oranı`} />
                        <p className="text-sm text-ink-3">
                          {s.questions} sorunun {s.correct}&apos;i doğru · {s.attempts} deneme · son: {timeAgo(s.lastAt)}
                        </p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {(data.repeats.length > 0 || data.patterns.length > 0) && (
            <>
              <SectionTitle>Tekrarlanan hatalar</SectionTitle>
              <div className="space-y-3">
                {data.repeats.length > 0 && (
                  <div className="card p-4">
                    <p className="font-medium text-ink">{data.repeats.length} soruyu birden fazla denemede yanlış yaptın</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                      {data.repeats.slice(0, 4).map((r) => (
                        <li key={r.originId} className="line-clamp-2">
                          {r.question.stem} <span className="text-ink-3">({r.wrongCount}×)</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/sinav?tur=revision" className="btn btn-secondary btn-sm mt-3">
                      Hata tekrarı testi
                    </Link>
                  </div>
                )}
                {data.patterns.length > 0 && (
                  <div className="card p-4">
                    <p className="font-medium text-ink">Tekrar eden hata türleri</p>
                    <p className="mt-0.5 text-sm text-ink-3">Yalnızca en az 3 kez ve farklı denemelerde görülenler listelenir.</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                      {data.patterns.slice(0, 5).map((p) => (
                        <li key={p.tag}>
                          {p.tag} <span className="text-ink-3">· {p.count} kez, {p.topics} konuda</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {data.studied.length > 0 && (
            <>
              <SectionTitle>Son çalıştığın konular</SectionTitle>
              <ul className="card hair overflow-hidden">
                {data.studied.slice(0, 8).map((s) => (
                  <li key={s.topicId}>
                    <Link href={`/ogren?konu=${encodeURIComponent(s.topicId)}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-ink">{topicLabel(s.topicId)}</span>
                        <span className="block text-sm text-ink-3">
                          {s.subjectId ? `${subjectName(s.subjectId)} · ` : ""}
                          {timeAgo(s.lastAt)}
                        </span>
                      </span>
                      <ArrowRight size={16} className="text-ink-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-8">
            <Notice tone="info">
              Sorular yapay zekâ tarafından üretilir ve etiketlenir; bu sonuçlar bir resmî sınav puanı değildir, yalnızca çalışmana rehberlik eder. Cevapsız bırakılan çoktan seçmeli soru yanlış sayılır.
            </Notice>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card flex items-center gap-3.5 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <div>
        <p className="font-display text-2xl leading-none text-ink tabular-nums">{value}</p>
        <p className="mt-1 text-[13px] text-ink-3">{label}</p>
      </div>
    </div>
  );
}
