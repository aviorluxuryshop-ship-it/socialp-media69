"use client";

import { ArrowRight, Check, Flame } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { BarChart } from "@/components/charts/BarChart";
import { Strip } from "@/components/charts/Strip";
import { ExamPanel } from "@/components/ExamPanel";
import { ProgressRing } from "@/components/ProgressRing";
import { Delta, SectionHead } from "@/components/ui";
import { sortPlans } from "@/lib/plans";
import { cloudConfigured, useCloud } from "@/lib/cloud";
import { sfx } from "@/lib/sound";
import { greeting, lastNDays, longDate, prettyDate, shortDay, todayKey, weekDays } from "@/lib/dates";
import { buildInsights } from "@/lib/insights";
import { useRoutines } from "@/lib/useRoutines";
import { comparePeriods, daySummary, groupStats, hasRecord, pct, rangeSummary, recordStreak, routineIdsMissing, statusOf, strongestWeakest } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function Dashboard() {
  const { entries, goals, profile, plans } = useStore();
  const togglePlan = useStore((s) => s.togglePlan);
  const ROUTINES = useRoutines();
  const cloudStatus = useCloud((c) => c.status);
  const today = todayKey();

  const d = useMemo(() => {
    const week = weekDays(today);
    const last30 = lastNDays(30, today);
    const last14 = lastNDays(14, today);
    const sum = daySummary(entries[today], goals);
    const weekSum = rangeSummary(week, entries, goals);
    const cmp = comparePeriods(week, entries, goals);
    const g = groupStats(last30, entries, goals);
    return {
      week,
      sum,
      weekSum,
      cmp,
      sw: strongestWeakest(g),
      streak: recordStreak(entries, today),
      last14,
      recorded14: last14.filter((x) => hasRecord(entries[x])).length,
      missing: routineIdsMissing(entries[today], goals),
      insights: buildInsights(last30, entries, goals, profile.walkUnit).slice(0, 3),
      anyData: Object.keys(entries).length > 0,
      todayPlans: sortPlans(plans.filter((p) => p.date === today)),
      upcoming: plans.filter((p) => p.date > today && !p.done).sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99")).slice(0, 3),
    };
  }, [entries, goals, today, profile.walkUnit, plans, ROUTINES]);

  const weekBars = d.week.map((day) => {
    const s = daySummary(entries[day], goals);
    return { label: shortDay(day), title: longDate(day), value: s.rate === null ? null : pct(s.rate), sub: s.rate === null ? undefined : `${s.done}/${s.judged} hedef` };
  });

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{longDate(today)}</p>
          <h1 className="h-title mt-1 text-[28px] md:text-[34px]">{greeting()}{profile.name ? `, ${profile.name}` : ""}</h1>
        </div>
        <Link href="/takip" className="btn btn-primary">
          Bugünü kaydet <ArrowRight size={16} />
        </Link>
      </header>

      {cloudConfigured && cloudStatus === "idle" && (
        <Link href="/settings" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-mute transition-colors hover:text-text">
          <span>Verilerin şu an yalnızca bu cihazda. Google ile giriş yapıp hesabına yedekle.</span>
          <ArrowRight size={15} className="shrink-0" />
        </Link>
      )}

      <section className="panel grid divide-line md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:divide-x">
        <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:p-6 md:flex-col md:items-start lg:flex-row lg:items-center">
          <ProgressRing value={d.sum.rate} caption="bugün" />
          <div className="w-full flex-1">
            <p className="eyebrow mb-3">Bugünün durumu</p>
            <dl className="space-y-2.5 text-[14px]">
              <Stat label="Tamamlanan" value={d.sum.done} dot="bg-accent" />
              <Stat label="Eksik / hedef dışı" value={d.sum.missed} dot="bg-rose" />
              <Stat label="Henüz kaydedilmedi" value={d.sum.unrecorded} dot="bg-line-2" />
            </dl>
            {d.sum.recorded > 0 && <p className="mt-2 text-[11.5px] text-faint">{d.sum.recorded} hedefsiz kayıt (saat bilgileri) yüzdeye katılmaz.</p>}
          </div>
        </div>
        <div className="border-t border-line p-5 sm:p-6 md:border-t-0">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="eyebrow">Bu hafta</p>
              <p className="num mt-1 text-2xl font-semibold tracking-tight">{d.weekSum.rate === null ? "—" : `%${pct(d.weekSum.rate)}`}<span className="ml-2 text-[13px] font-normal text-mute">{d.weekSum.judged > 0 ? `${d.weekSum.done}/${d.weekSum.judged} hedef` : "henüz kayıt yok"}</span></p>
            </div>
            <div className="text-right">
              <Delta value={d.cmp.delta} />
              {d.cmp.delta !== null && <p className="text-[11px] text-faint">önceki 7 güne göre</p>}
            </div>
          </div>
          <BarChart bars={weekBars} ariaLabel="Haftalık günlük tamamlanma yüzdeleri" height={118} highlightLast={false} />
        </div>
      </section>

      {d.missing.length > 0 && d.missing.length < ROUTINES.length && (
        <section className="rounded-xl border border-line bg-surface px-4 py-3.5">
          <p className="text-[13px] font-medium">Bugün için eksik bilgi <span className="text-mute">({d.missing.length})</span></p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {d.missing.filter((r) => r.kind !== "sleep").map((r) => (
              <Link key={r.id} href="/takip" className="rounded-lg border border-line-2 bg-raised px-2.5 py-1.5 text-[12px] text-mute transition-colors hover:text-text">
                {r.emoji} {r.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="panel p-5 sm:p-6">
        <SectionHead eyebrow="Takvim" title="Bugünün planları" right={<Link href="/takvim" className="btn btn-quiet btn-sm">Takvim <ArrowRight size={14} /></Link>} />
        {d.todayPlans.length ? (
          <ul className="divide-hair">
            {d.todayPlans.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <button type="button" role="checkbox" aria-checked={p.done} aria-label={`${p.title} planını ${p.done ? "geri al" : "tamamla"}`} onClick={() => { p.done ? sfx.clear() : sfx.done(); togglePlan(p.id); }} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${p.done ? "border-accent bg-accent text-[#031a0c]" : "border-line-2 hover:border-accent/60"}`}>
                  {p.done && <Check size={14} strokeWidth={3} />}
                </button>
                <span className={`min-w-0 flex-1 truncate text-[14px] ${p.done ? "text-faint line-through" : "font-medium"}`}>{p.title}</span>
                {p.time && <span className="num text-[12px] text-mute">{p.time}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] leading-relaxed text-mute">Bugün için plan yok.{" "}<Link href="/takvim" className="text-text underline underline-offset-2">Plan ekle</Link></p>
        )}
        {d.upcoming.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="eyebrow mb-2">Yaklaşanlar</p>
            <ul className="space-y-1.5">
              {d.upcoming.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate">{p.title}</span>
                  <span className="num shrink-0 text-mute">{prettyDate(p.date)}{p.time && ` · ${p.time}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5 sm:p-6">
          <SectionHead eyebrow="Tutarlılık" title="Son 14 gün" right={<span className="flex items-center gap-1.5 rounded-lg border border-line-2 px-2.5 py-1 text-[12px] text-mute"><Flame size={13} className="text-amber" /> <b className="num text-text">{d.streak}</b> gün üst üste kayıt</span>} />
          <Strip ariaLabel="Son 14 günde kayıt girilen günler" cells={d.last14.map((x) => {
            const s = daySummary(entries[x], goals);
            return { title: longDate(x), status: !hasRecord(entries[x]) ? "unrecorded" : s.rate === null ? "recorded" : s.rate >= 0.5 ? "done" : "missed" };
          })} />
          <p className="num mt-3 text-[13px] text-mute">
            Son 14 günün <b className="text-text">{d.recorded14}</b> gününde kayıt var{d.recorded14 < 14 && ` · ${14 - d.recorded14} gün boş`}. Yeşil: günün yarısından fazlası hedefte.
          </p>
        </section>

        <section className="panel p-5 sm:p-6">
          <SectionHead eyebrow="Son 30 gün" title="Kategori performansı" />
          {d.sw ? (
            <div className="space-y-3">
              <Cat tone="good" title="En güçlü" name={d.sw.best.label} rate={d.sw.best.rate} judged={d.sw.best.judged} />
              <Cat tone="warn" title="En zayıf" name={d.sw.worst.label} rate={d.sw.worst.rate} judged={d.sw.worst.judged} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line-2 px-4 py-6 text-center text-[13px] leading-relaxed text-mute">
              Kategorileri karşılaştırmak için en az iki kategoride yeterli kayıt (her biri için 5+ değerlendirme) gerekir.
            </p>
          )}
        </section>
      </div>

      <section className="panel p-5 sm:p-6">
        <SectionHead eyebrow="Son 30 gün" title="Öne çıkanlar" right={<Link href="/analiz" className="btn btn-quiet btn-sm">Tüm analiz <ArrowRight size={14} /></Link>} />
        {d.insights.length ? (
          <ul className="divide-hair">
            {d.insights.map((i) => (
              <li key={i.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-[14px] font-medium">{i.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-mute">{i.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-2 px-4 py-6 text-center text-[13px] leading-relaxed text-mute">
            {d.anyData ? "Yorum üretmek için biraz daha kayda ihtiyaç var. Birkaç gün daha girdikten sonra burada gözlemler görünür." : "Henüz kayıt yok. İlk günü girdiğinde özet ve gözlemler burada görünür."}
          </p>
        )}
      </section>

      <ExamPanel />
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-mute"><i className={`h-2 w-2 rounded-full ${dot}`} />{label}</dt>
      <dd className="num text-lg font-semibold">{value}</dd>
    </div>
  );
}

function Cat({ tone, title, name, rate, judged }: { tone: "good" | "warn"; title: string; name: string; rate: number; judged: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/50 px-4 py-3">
      <div>
        <p className={tone === "good" ? "text-[11px] font-semibold uppercase tracking-wider text-accent" : "text-[11px] font-semibold uppercase tracking-wider text-amber"}>{title}</p>
        <p className="mt-0.5 text-[15px] font-semibold">{name}</p>
      </div>
      <div className="text-right">
        <p className="num text-xl font-semibold">%{pct(rate)}</p>
        <p className="text-[11px] text-faint">{judged} değerlendirme</p>
      </div>
    </div>
  );
}
