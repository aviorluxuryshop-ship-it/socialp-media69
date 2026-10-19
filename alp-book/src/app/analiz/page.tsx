"use client";

import clsx from "clsx";
import { Info, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart, type LinePoint } from "@/components/charts/LineChart";
import { Strip, StripLegend } from "@/components/charts/Strip";
import { Delta, EmptyState, Segmented } from "@/components/ui";
import { dayNum, isValidKey, lastNDays, longDate, monthLabel, prettyDate, rangeDays, shortMonth, todayKey } from "@/lib/dates";
import { buildInsights } from "@/lib/insights";
import { GROUPS, ROUTINES, ROUTINE_BY_ID } from "@/lib/routines";
import { comparePeriods, dailyRateSeries, groupStats, mean, monthlyBars, numericSeries, pct, present, rangeSummary, routineTally, statusOf, strongestWeakest, validMeals, weeklyBars, type Entries } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { fmtDuration, fmtHours, fmtNum, parseTime } from "@/lib/time";
import type { GroupId, Goals, Routine, WalkUnit } from "@/lib/types";

type Preset = "7" | "30" | "90" | "custom";

const tickFor = (dates: string[]) => (i: number) => `${dayNum(dates[i])} ${shortMonth(dates[i])}`;
const clock = (h: number) => {
  const t = Math.round(h * 60);
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export default function AnalysisPage() {
  const { entries, goals, profile } = useStore();
  const today = todayKey();
  const [preset, setPreset] = useState<Preset>("30");
  const [from, setFrom] = useState(() => lastNDays(30, today)[0]);
  const [to, setTo] = useState(today);
  const [walkUnit, setWalkUnit] = useState<WalkUnit>(profile.walkUnit);
  const [pick, setPick] = useState("r:yazilim");

  const dates = useMemo(() => {
    if (preset === "custom") {
      const f = isValidKey(from) ? from : today;
      const t = isValidKey(to) ? (to > today ? today : to) : today;
      return rangeDays(f, t);
    }
    return lastNDays(Number(preset), today);
  }, [preset, from, to, today]);

  const end = dates[dates.length - 1];
  const a = useMemo(() => {
    const total = rangeSummary(dates, entries, goals);
    return {
      total,
      cmp: comparePeriods(dates, entries, goals),
      sw: strongestWeakest(groupStats(dates, entries, goals)),
      series: dailyRateSeries(dates, entries, goals),
      weeks: weeklyBars(end, 8, entries, goals),
      months: monthlyBars(end, 6, entries, goals),
      insights: buildInsights(dates, entries, goals, walkUnit),
    };
  }, [dates, end, entries, goals, walkUnit]);

  const tick = tickFor(dates);
  const hasData = a.total.daysWithData > 0;

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Analiz</p>
          <h1 className="h-title mt-1 text-[28px] md:text-[32px]">Trendler ve gözlemler</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Tarih aralığı" value={preset} onChange={setPreset} options={[{ value: "7", label: "7 gün" }, { value: "30", label: "30 gün" }, { value: "90", label: "90 gün" }, { value: "custom", label: "Özel" }]} />
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" aria-label="Başlangıç tarihi" className="input num !min-h-9 !w-[150px] !py-1 text-[13px]" max={today} value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="text-faint">–</span>
              <input type="date" aria-label="Bitiş tarihi" className="input num !min-h-9 !w-[150px] !py-1 text-[13px]" max={today} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          )}
        </div>
      </header>
      <p className="-mt-3 text-[13px] text-mute num">{prettyDate(dates[0])} – {prettyDate(end)} · {dates.length} gün · {a.total.daysWithData} günde kayıt var</p>

      {!hasData ? (
        <EmptyState title="Bu aralıkta kayıt yok" body="Grafikler ve gözlemler girdiğin kayıtlardan üretilir. Takip sayfasında birkaç günü işaretledikten sonra burada görünür." action={<Link href="/takip" className="btn btn-primary btn-sm">Takip tablosuna git</Link>} />
      ) : (
        <>
          <section className="panel p-5 sm:p-6" aria-labelledby="h-genel">
            <div className="mb-5 grid gap-x-8 gap-y-4 sm:grid-cols-3">
              <Metric label="Tamamlanma" value={a.total.rate === null ? "—" : `%${pct(a.total.rate)}`} note={a.total.judged ? `${a.total.done}/${a.total.judged} hedef` : "değerlendirilecek kayıt yok"} extra={<Delta value={a.cmp.delta} />} />
              <Metric label="Kayıt girilen gün" value={`${a.total.daysWithData}/${dates.length}`} note={`%${pct(a.total.daysWithData / dates.length)} kapsam`} />
              <Metric label="En güçlü / en zayıf" value={a.sw ? a.sw.best.label : "—"} note={a.sw ? `zayıf: ${a.sw.worst.label} %${pct(a.sw.worst.rate)}` : "yeterli veri yok (her kategoride 5+ değerlendirme gerekir)"} />
            </div>
            <h2 id="h-genel" className="h-title mb-3 text-base">Günlük tamamlanma yüzdesi</h2>
            {a.series.filter((x) => x !== null).length >= 2 ? (
              <LineChart ariaLabel="Günlük tamamlanma yüzdesi çizgi grafiği" points={a.series.map((y, i) => ({ label: longDate(dates[i]), y }))} unit="%" fmt={(n) => String(Math.round(n))} domain={[0, 100]} tick={tick} />
            ) : (
              <NeedMore />
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="panel p-5 sm:p-6">
              <h2 className="h-title text-base">Haftalık karşılaştırma</h2>
              <p className="mb-4 mt-0.5 text-[12px] text-mute">Seçili aralığın bitişinden geriye son 8 hafta (Pzt–Paz)</p>
              <BarChart ariaLabel="Haftalık tamamlanma yüzdeleri" bars={a.weeks.map((w) => ({ label: prettyDate(w.start).replace(/ (\S{3})\S*/, " $1"), title: `${prettyDate(w.start)} haftası`, value: w.rate, sub: w.judged ? `${w.judged} değerlendirilen kayıt` : "kayıt yok" }))} />
            </section>
            <section className="panel p-5 sm:p-6">
              <h2 className="h-title text-base">Aylık ilerleme</h2>
              <p className="mb-4 mt-0.5 text-[12px] text-mute">Son 6 ay · yalnızca kaydedilen günler hesaba katılır</p>
              <BarChart ariaLabel="Aylık tamamlanma yüzdeleri" bars={a.months.map((m) => ({ label: monthLabel(m.start).slice(0, 3), title: monthLabel(m.start), value: m.rate, sub: m.judged ? `${m.judged} değerlendirilen kayıt` : "kayıt yok" }))} />
            </section>
          </div>

          <section aria-label="Ölçümler">
            <h2 className="h-title mb-3 text-lg">Ölçümler</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <Measure title="Su tüketimi" id="su" dates={dates} entries={entries} goals={goals} unit="bardak" fmt={(n) => String(Math.round(n * 10) / 10)} goal={{ value: goals.waterGlasses, label: `hedef ${goals.waterGlasses}` }} summary={(v) => `ort. ${fmtNum(mean(v) as number, 1)} bardak`} />
              <Measure title="Uyku süresi" id="uyku_sure" dates={dates} entries={entries} goals={goals} unit="sa" fmt={(n) => (Math.round(n * 10) / 10).toString().replace(".", ",")} goal={{ value: goals.sleepHours, label: `hedef ${goals.sleepHours} sa` }} summary={(v) => `ort. ${fmtDuration((mean(v) as number) * 60)}`} note="Yatış ve uyanış saatinden otomatik hesaplanır" />
              <Measure title="Ekran süresi" id="ekran" dates={dates} entries={entries} goals={goals} unit="sa" fmt={(n) => (Math.round(n * 10) / 10).toString().replace(".", ",")} goal={{ value: goals.screenMaxHours, label: `sınır ${goals.screenMaxHours} sa` }} summary={(v) => `ort. ${fmtDuration((mean(v) as number) * 60)}`} />
              <Measure
                title="Yürüyüş"
                id="yuruyus"
                dates={dates}
                entries={entries}
                goals={goals}
                walkUnit={walkUnit}
                unit={walkUnit === "steps" ? "adım" : "dk"}
                fmt={(n) => fmtNum(n)}
                goal={{ value: walkUnit === "steps" ? goals.steps : goals.walkMinutes, label: `hedef ${fmtNum(walkUnit === "steps" ? goals.steps : goals.walkMinutes)}` }}
                summary={(v) => `ort. ${fmtNum(mean(v) as number)} ${walkUnit === "steps" ? "adım" : "dk"}`}
                right={<Segmented size="sm" label="Yürüyüş ölçüsü" value={walkUnit} onChange={setWalkUnit} options={[{ value: "steps", label: "Adım" }, { value: "min", label: "Dakika" }]} />}
                note="Adım ve dakika kayıtları ayrı ölçüler olduğundan birbirine çevrilmez"
              />
            </div>
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="h-tutarlilik">
            <h2 id="h-tutarlilik" className="h-title text-base">Tutarlılık: kodlama, ders çalışma, öğün kaydı</h2>
            <p className="mb-4 mt-0.5 text-[12px] text-mute">Her hücre bir gün. Boş hücreler kaydedilmemiş günleri gösterir; başarısızlık değildir.</p>
            <div className="space-y-4">
              {(["yazilim", "egitim", "beslenme"] as const).map((id) => (
                <StripRow key={id} r={ROUTINE_BY_ID[id]} dates={dates} entries={entries} goals={goals} />
              ))}
            </div>
            <div className="mt-4"><StripLegend /></div>
          </section>

          <Explorer pick={pick} setPick={setPick} dates={dates} entries={entries} goals={goals} walkUnit={walkUnit} tick={tick} />

          <section className="panel p-5 sm:p-6" aria-labelledby="h-gozlem">
            <h2 id="h-gozlem" className="h-title flex items-center gap-2 text-base"><TrendingUp size={16} className="text-accent" /> Gözlemler</h2>
            <p className="mb-4 mt-0.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-mute">
              <Info size={13} className="mt-0.5 shrink-0" />
              Yalnızca kaydettiğin verilere dayanır. İki şeyin birlikte değişmesi biri diğerine neden oldu demek değildir; yorumlar neden-sonuç iddia etmez.
            </p>
            {a.insights.length ? (
              <ul className="divide-hair">
                {a.insights.map((i) => (
                  <li key={i.id} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", i.tone === "good" ? "bg-accent" : i.tone === "warn" ? "bg-amber" : "bg-line-2")} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium leading-snug">{i.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-mute">{i.body}</p>
                      <p className="mt-1 text-[10.5px] uppercase tracking-wider text-faint">{i.basis === "goal" ? "Hedefine göre" : "Gözlem"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Henüz yeterli kayıt yok" body="Gözlem üretmek için her konuda en az birkaç günlük geçerli veri gerekir. Daha fazla gün girdikçe burada belirir." />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, note, extra }: { label: string; value: string; note: string; extra?: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="num mt-1.5 text-[26px] font-semibold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-[12px] text-mute">{note}</p>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}

const NeedMore = () => <EmptyState title="Çizgi için daha fazla veri gerekli" body="Trend çizebilmek için en az iki günde kayıt olmalı." />;

function Measure({
  title, id, dates, entries, goals, unit, fmt, goal, summary, walkUnit, right, note,
}: {
  title: string; id: string; dates: string[]; entries: Entries; goals: Goals; unit: string; fmt: (n: number) => string;
  goal: { value: number; label: string }; summary: (v: number[]) => string; walkUnit?: WalkUnit; right?: React.ReactNode; note?: string;
}) {
  const r = ROUTINE_BY_ID[id];
  const ys = numericSeries(r, dates, entries, walkUnit);
  const vals = present(ys);
  const points: LinePoint[] = ys.map((y, i) => ({ label: longDate(dates[i]), y }));
  void goals;
  return (
    <section className="panel p-5 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="h-title text-base">{r.emoji} {title}</h3>
          <p className="num mt-0.5 text-[12px] text-mute">{vals.length ? `${vals.length} günlük kayıt · ${summary(vals)}` : "Bu aralıkta kayıt yok"}</p>
        </div>
        {right}
      </div>
      {vals.length >= 2 ? (
        <LineChart ariaLabel={`${title} çizgi grafiği`} points={points} unit={unit} fmt={fmt} goal={goal} tick={tickFor(dates)} height={170} />
      ) : (
        <EmptyState title={vals.length === 1 ? "Tek kayıt var" : "Henüz kayıt yok"} body={`Trend için en az iki günlük ${title.toLowerCase()} kaydı gerekir.`} />
      )}
      {note && <p className="mt-2 text-[11px] text-faint">{note}</p>}
    </section>
  );
}

function StripRow({ r, dates, entries, goals }: { r: Routine; dates: string[]; entries: Entries; goals: Goals }) {
  const t = routineTally(r, dates, entries, goals);
  const cells = dates.map((d) => ({ title: longDate(d), status: statusOf(r, entries[d], goals) }));
  const recorded = t.total - t.unrecorded;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium">{r.emoji} {r.label}</p>
        <p className="num text-[12px] text-mute">{t.rate === null ? "kayıt yok" : <>{t.done}/{t.judged} gün hedefte · <b className="text-text">%{pct(t.rate)}</b></>} · {recorded}/{t.total} gün kayıtlı</p>
      </div>
      <Strip cells={cells} ariaLabel={`${r.label} günlük durum şeridi`} />
    </div>
  );
}

function Explorer({ pick, setPick, dates, entries, goals, walkUnit, tick }: { pick: string; setPick: (s: string) => void; dates: string[]; entries: Entries; goals: Goals; walkUnit: WalkUnit; tick: (i: number) => string }) {
  const [kind, id] = pick.split(":");
  const isGroup = kind === "g";
  const routines = isGroup ? ROUTINES.filter((r) => r.group === (id as GroupId)) : [ROUTINE_BY_ID[id]];
  const r = routines[0];
  const title = isGroup ? GROUPS[id as GroupId].label : `${r.emoji} ${r.label}`;

  // Kategori: günlük kategori yüzdesi. Rutin: türüne göre değer çizgisi.
  let chart: React.ReactNode = null;
  if (isGroup) {
    const pts: LinePoint[] = dates.map((d) => {
      let done = 0, judged = 0;
      for (const x of routines) {
        const s = statusOf(x, entries[d], goals);
        if (s === "done") done++;
        if (s === "done" || s === "missed") judged++;
      }
      return { label: longDate(d), y: judged ? Math.round((done / judged) * 100) : null };
    });
    chart = present(pts.map((p) => p.y)).length >= 2 ? <LineChart ariaLabel={`${title} kategorisi günlük tamamlanma`} points={pts} unit="%" domain={[0, 100]} fmt={(n) => String(Math.round(n))} tick={tick} height={170} /> : <NeedMore />;
  } else if (r.kind === "time") {
    const pts: LinePoint[] = dates.map((d) => {
      const m = parseTime(entries[d]?.[r.id]);
      if (m === null) return { label: longDate(d), y: null };
      let h = m / 60;
      if (r.id === "uyku_yatis" && h < 12) h += 24; // gece yarısından sonra yatış: 01:00 → 25:00 olarak çiz
      return { label: longDate(d), y: h };
    });
    const v = present(pts.map((p) => p.y));
    chart = v.length >= 2 ? <LineChart ariaLabel={`${r.label} çizgi grafiği`} points={pts} unit="" fmt={clock} domain={[Math.floor(Math.min(...v)) - 1, Math.ceil(Math.max(...v)) + 1]} tick={tick} height={170} /> : <NeedMore />;
  } else if (r.kind === "meals") {
    const pts: LinePoint[] = dates.map((d) => {
      const n = validMeals(entries[d]?.[r.id]).length;
      return { label: longDate(d), y: n || null };
    });
    chart = present(pts.map((p) => p.y)).length >= 2 ? <LineChart ariaLabel="Günlük öğün sayısı" points={pts} unit="öğün" fmt={(n) => String(Math.round(n))} tick={tick} height={170} /> : null;
  } else if (r.kind !== "yesno") {
    const ys = numericSeries(r, dates, entries, walkUnit);
    const unit = r.kind === "count" ? "bardak" : r.kind === "yesno_min" ? "dk" : r.kind === "walk" ? (walkUnit === "steps" ? "adım" : "dk") : "sa";
    chart = present(ys).length >= 2 ? <LineChart ariaLabel={`${r.label} çizgi grafiği`} points={ys.map((y, i) => ({ label: longDate(dates[i]), y }))} unit={unit} fmt={(n) => String(Math.round(n * 10) / 10)} tick={tick} height={170} /> : <NeedMore />;
  }

  const tallies = routines.map((x) => ({ x, t: routineTally(x, dates, entries, goals) }));
  const tot = tallies.reduce((acc, { t }) => ({ done: acc.done + t.done, missed: acc.missed + t.missed, un: acc.un + t.unrecorded }), { done: 0, missed: 0, un: 0 });
  const judged = tot.done + tot.missed;

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="h-explorer">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Ayrıntılı inceleme</p>
          <h2 id="h-explorer" className="h-title mt-1 text-lg">{title}</h2>
        </div>
        <label className="block">
          <span className="sr-only">Rutin veya kategori seç</span>
          <select className="input !w-auto min-w-[220px] text-[14px]" value={pick} onChange={(e) => setPick(e.target.value)}>
            <optgroup label="Rutinler">
              {ROUTINES.map((x) => <option key={x.id} value={`r:${x.id}`}>{x.emoji} {x.label}</option>)}
            </optgroup>
            <optgroup label="Kategoriler">
              {(Object.keys(GROUPS) as GroupId[]).map((g) => <option key={g} value={`g:${g}`}>{GROUPS[g].label}</option>)}
            </optgroup>
          </select>
        </label>
      </div>

      <p className="num mb-4 text-[13px] text-mute">
        {judged ? <><b className="text-text">%{pct(tot.done / judged)}</b> hedefte · {tot.done} tamamlandı · {tot.missed} hedef dışı · {tot.un} kayıt yok</> : "Bu aralıkta değerlendirilecek kayıt yok."}
      </p>

      {chart && <div className="mb-5">{chart}</div>}

      {isGroup ? (
        <div className="space-y-4">
          {routines.map((x) => <StripRow key={x.id} r={x} dates={dates} entries={entries} goals={goals} />)}
        </div>
      ) : (
        <StripRow r={r} dates={dates} entries={entries} goals={goals} />
      )}
      <div className="mt-4"><StripLegend /></div>
    </section>
  );
}
