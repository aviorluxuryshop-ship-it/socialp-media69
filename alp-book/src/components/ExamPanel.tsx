"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysBetween, prettyDate, todayKey } from "@/lib/dates";
import { ExpectActual } from "./charts/ExpectActual";
import { SectionHead } from "./ui";

export function examInsight(exams: { expected: number | null; actual: number | null }[]) {
  const rated = exams.filter((e) => e.expected !== null && e.actual !== null);
  if (!rated.length) return null;
  const avg = rated.reduce((a, e) => a + ((e.actual as number) - (e.expected as number)), 0) / rated.length;
  return { avg: Math.round(avg * 10) / 10, n: rated.length };
}

export function ExamPanel() {
  const { exams, courses } = useStore();
  const today = todayKey();
  const upcoming = exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const insight = examInsight(exams);
  const name = (id: string) => courses.find((c) => c.id === id);

  return (
    <section className="panel p-5 sm:p-6">
      <SectionHead eyebrow="Dersler ve sınavlar" title="Beklenti ve sonuç" right={<Link href="/exams" className="btn btn-quiet btn-sm">Yönet <ArrowRight size={14} /></Link>} />

      {upcoming.length > 0 && (
        <ul className="divide-hair mb-5">
          {upcoming.map((e) => {
            const c = name(e.courseId);
            const left = daysBetween(today, e.date);
            return (
              <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="h-8 w-1 rounded-full" style={{ background: c?.color ?? "#7c9cff" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c?.name ?? "Ders"} · {e.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-mute"><CalendarClock size={11} /> {prettyDate(e.date)}</p>
                </div>
                <span className="num rounded-lg border border-line-2 px-2 py-1 text-xs font-semibold text-text">{left === 0 ? "Bugün" : `${left} gün`}</span>
              </li>
            );
          })}
        </ul>
      )}

      <ExpectActual exams={exams} courses={courses} />

      {insight && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-ink/50 p-3 text-[13px] leading-relaxed text-mute">
          <Target size={14} className="mt-0.5 shrink-0 text-accent" />
          {insight.avg >= 0
            ? `${insight.n} sınavda sonuçların beklentini ortalama ${insight.avg} puan aştı.`
            : `${insight.n} sınavda sonuçların beklentinin ortalama ${Math.abs(insight.avg)} puan altında kaldı.`}
        </p>
      )}
      {!exams.length && <Link href="/exams" className="btn btn-quiet mt-2 w-full">İlk dersini ve sınavını ekle</Link>}
    </section>
  );
}
