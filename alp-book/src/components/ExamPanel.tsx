"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysBetween, prettyDate, todayKey } from "@/lib/dates";
import { ExpectActual } from "./charts/ExpectActual";

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
    <section className="card card-violet p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label">Dersler & Sınavlar</p>
          <h2 className="mt-1 text-lg font-semibold">Beklenti Analizi</h2>
        </div>
        <Link href="/exams" className="btn btn-ghost !min-h-9 !px-3 !py-1.5 text-xs">
          Yönet <ArrowRight size={14} />
        </Link>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-5 space-y-2">
          {upcoming.map((e) => {
            const c = name(e.courseId);
            const left = daysBetween(today, e.date);
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-line bg-black/40 px-3 py-2.5">
                <span className="h-8 w-1 rounded-full" style={{ background: c?.color ?? "#8a2be2" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c?.name ?? "Ders"} · {e.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-mute"><CalendarClock size={11} /> {prettyDate(e.date)}</p>
                </div>
                <span className="rounded-lg bg-violet/20 px-2 py-1 font-mono text-xs font-bold text-violet-soft">
                  {left === 0 ? "BUGÜN" : `${left}g`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <ExpectActual exams={exams} courses={courses} />

      {insight && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-black/40 p-3 text-xs text-white/80">
          <Target size={14} className="mt-0.5 shrink-0 text-neon" />
          {insight.avg >= 0
            ? `${insight.n} sınavda beklentini ortalama ${insight.avg} puan aştın. Kendine güvenebilirsin.`
            : `${insight.n} sınavda beklentinin ortalama ${Math.abs(insight.avg)} puan altında kaldın. Beklentilerini gözden geçir ya da çalışmayı artır.`}
        </p>
      )}
      {!exams.length && (
        <Link href="/exams" className="btn btn-neon mt-2 w-full">İlk dersini ve sınavını ekle</Link>
      )}
    </section>
  );
}
