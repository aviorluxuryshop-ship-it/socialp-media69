"use client";

import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { BranchTabs } from "@/components/BranchTabs";
import { BarChart, RankBars } from "@/components/charts/BarChart";
import { PeriodNav } from "@/components/PeriodNav";
import { Avatar, Card, Delta, Dot, PageHeader } from "@/components/ui";
import { PAYMENT_LABEL, SERIES } from "@/lib/constants";
import { download, toCsv } from "@/lib/csv";
import { comparable, formatLong, periodOf, type Period } from "@/lib/dates";
import { change, money, number, percent } from "@/lib/format";
import { useData, useLookup, useNow } from "@/lib/hooks";
import { buckets, byBranch, byExpenseCategory, byPayment, byService, byStaff, summarize, type Summary } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

const KPIS: { key: string; label: string; get: (s: Summary) => number; fmt: (n: number) => string; invert?: boolean }[] = [
  { key: "income", label: "Toplam ciro", get: (s) => s.income, fmt: money },
  { key: "expense", label: "Toplam gider", get: (s) => s.expense, fmt: money, invert: true },
  { key: "net", label: "Net kâr", get: (s) => s.net, fmt: money },
  { key: "appointments", label: "Randevu", get: (s) => s.appointments, fmt: number },
  { key: "avg", label: "Ortalama sepet", get: (s) => s.avgTicket, fmt: money },
  { key: "occ", label: "Doluluk", get: (s) => s.occupancy, fmt: percent },
  { key: "new", label: "Yeni müşteri", get: (s) => s.newCustomers, fmt: number },
  { key: "loss", label: "İptal + gelmedi", get: (s) => s.cancelled + s.noshow, fmt: number, invert: true },
];

export default function ReportsPage() {
  const { today } = useNow();
  const data = useData();
  const L = useLookup();
  const f = useStore((s) => s.branchFilter);
  const studio = useStore((s) => s.settings.studioName);
  const [period, setPeriod] = useState<Period>(() => periodOf("week", today));

  const r = useMemo(() => {
    const { cur, prev, partial, prevLabel } = comparable(period, today);
    return {
      s: summarize(data, cur.start, cur.end, f),
      p: summarize(data, prev.start, prev.end, f),
      prevLabel,
      partial,
      buckets: buckets(data, period, f),
      services: byService(data, cur.start, cur.end, f),
      expenses: byExpenseCategory(data, cur.start, cur.end, f),
      staff: byStaff(data, cur.start, cur.end, f),
      branches: byBranch(data, cur.start, cur.end),
      pay: byPayment(data, cur.start, cur.end, f),
    };
  }, [data, period, f, today]);

  const branchName = f === "all" ? "Tüm şubeler" : (L.branches.get(f)?.name ?? "");
  const kindName = period.kind === "day" ? "Günlük" : period.kind === "week" ? "Haftalık" : "Aylık";
  const chart = r.buckets.map((b) => ({ key: b.key, label: b.label, title: b.key.length === 10 ? formatLong(b.key) : b.label, values: period.kind === "day" ? [b.income] : [b.income, b.expense] }));

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Rapor", `${kindName} rapor — ${period.label}`],
      ["Şube", branchName],
      [],
      ["Gösterge", "Bu dönem", "Önceki dönem"],
      ...KPIS.map((k) => [k.label, k.key === "occ" ? percent(k.get(r.s)) : Math.round(k.get(r.s)), k.key === "occ" ? percent(k.get(r.p)) : Math.round(k.get(r.p))]),
      [],
      ["Personel", "Randevu", "Tamamlanan", "Gelmedi", "Ciro", "Ortalama", "Prim", "Doluluk"],
      ...r.staff.map((p) => [p.staff.name, p.appointments, p.completed, p.noshow, p.revenue, Math.round(p.avgTicket), Math.round(p.commission), percent(p.occupancy)]),
      [],
      ["Hizmet", "Adet", "Ciro"],
      ...r.services.map((x) => [x.label, x.count, x.value]),
      [],
      ["Gider kategorisi", "Kayıt", "Tutar"],
      ...r.expenses.map((x) => [x.label, x.count, x.value]),
    ];
    download(`rapor-${period.kind}-${period.start}.csv`, toCsv(["Melopée Panel", studio], rows));
  }

  return (
    <>
      <div className="print:hidden">
      <PageHeader
        title="Raporlar"
        sub="Günlük, haftalık ve aylık performans — önceki döneme göre karşılaştırmalı"
        actions={
          <>
            <button type="button" data-export className="btn btn-secondary" onClick={exportCsv}>
              <Download size={16} aria-hidden /> CSV / Excel
            </button>
            <button type="button" data-export className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} aria-hidden /> Yazdır / PDF
            </button>
          </>
        }
      />
      </div>

      <div className="no-print mb-5 flex flex-col gap-3">
        <BranchTabs />
        <PeriodNav period={period} onChange={setPeriod} today={today} />
      </div>

      {/* Yazdırılan raporun başlığı */}
      <div className="mb-5 hidden print:block">
        <p className="display text-[30px]">{studio}</p>
        <p className="text-[14px]">
          {kindName} rapor · {period.label} · {branchName}
        </p>
        <p className="text-[12px] text-ink-3">Oluşturulma: {formatLong(today)}</p>
      </div>

      {r.partial && (
        <p className="mb-3 text-[13px] text-ink-3">
          Dönem devam ediyor: göstergeler bugüne kadarki günleri, önceki dönemin ({r.prevLabel}) aynı sayıda günüyle karşılaştırır.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k) => {
          const cur = k.get(r.s);
          const prv = k.get(r.p);
          return (
            <div key={k.key} className="card px-4 py-3.5">
              <p className="text-[12.5px] font-semibold text-ink-2">{k.label}</p>
              <p className={`num mt-1 text-[22px] font-bold tracking-tight ${k.key === "net" && cur < 0 ? "text-bad" : ""}`}>{k.fmt(cur)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
                <Delta value={change(cur, prv)} invert={k.invert} />
                <span className="num">önceki: {k.fmt(prv)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-4" title={period.kind === "day" ? "Saatlik ciro" : period.kind === "week" ? "Günlük gelir ve gider" : "Gün gün gelir ve gider"} sub={`${period.label} · ${branchName}`}>
        <BarChart
          data={chart}
          series={period.kind === "day" ? [{ name: "Ciro", color: SERIES[0] }] : [{ name: "Gelir", color: SERIES[0] }, { name: "Gider", color: SERIES[1] }]}
          formatFull={money}
          height={280}
          ariaLabel={`${period.label} dönemi gelir grafiği`}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Hizmetlere göre ciro" sub={`${r.s.completed} tamamlanan randevu`}>
          <RankBars rows={r.services} format={money} sub={(x) => `${x.count} adet`} />
        </Card>
        <Card title="Giderler" sub="Kategoriye göre">
          <RankBars rows={r.expenses} color={SERIES[1]} format={money} sub={(x) => `${x.count} kayıt`} />
        </Card>
      </div>

      <Card className="mt-4" title="Personel performansı" sub="Ciroya göre sıralı" pad={false}>
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead>
              <tr>
                <th>Personel</th>
                {f === "all" && <th>Şube</th>}
                <th className="!text-right">Randevu</th>
                <th className="!text-right">Tamamlanan</th>
                <th className="!text-right">Gelmedi</th>
                <th className="!text-right">Ciro</th>
                <th className="!text-right">Ort. sepet</th>
                <th className="!text-right">Prim</th>
                <th className="!text-right">Doluluk</th>
              </tr>
            </thead>
            <tbody>
              {r.staff.map((p) => {
                const b = L.branches.get(p.staff.branchId);
                return (
                  <tr key={p.staff.id}>
                    <td>
                      <span className="flex items-center gap-2 whitespace-nowrap font-semibold">
                        <Avatar name={p.staff.name} color={p.staff.color} size={24} /> {p.staff.name}
                      </span>
                    </td>
                    {f === "all" && (
                      <td className="whitespace-nowrap text-ink-2">
                        <span className="flex items-center gap-1.5">
                          {b && <Dot color={b.color} className="!size-2" />} {b?.name}
                        </span>
                      </td>
                    )}
                    <td className="num text-right">{p.appointments}</td>
                    <td className="num text-right">{p.completed}</td>
                    <td className="num text-right">{p.noshow}</td>
                    <td className="num text-right font-bold">{money(p.revenue)}</td>
                    <td className="num text-right">{money(p.avgTicket)}</td>
                    <td className="num text-right">{money(p.commission)}</td>
                    <td className="num text-right">{percent(p.occupancy)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 print:grid-cols-1">
        {f === "all" && (
          <Card title="Şubelere göre" pad={false}>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Şube</th>
                    <th className="!text-right">Ciro</th>
                    <th className="!text-right">Gider</th>
                    <th className="!text-right">Net</th>
                    <th className="!text-right">Randevu</th>
                    <th className="!text-right">Doluluk</th>
                  </tr>
                </thead>
                <tbody>
                  {r.branches.map((x) => (
                    <tr key={x.branch.id}>
                      <td>
                        <span className="flex items-center gap-2 whitespace-nowrap font-semibold">
                          <Dot color={x.branch.color} /> {x.branch.name}
                        </span>
                      </td>
                      <td className="num text-right">{money(x.income)}</td>
                      <td className="num text-right">{money(x.expense)}</td>
                      <td className={`num text-right font-bold ${x.net < 0 ? "text-bad" : ""}`}>{money(x.net)}</td>
                      <td className="num text-right">{x.appointments}</td>
                      <td className="num text-right">{percent(x.occupancy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <Card title="Tahsilat dağılımı" sub="Ödeme yöntemine göre" className={f === "all" ? "" : "lg:col-span-2"}>
          <dl className="grid grid-cols-3 gap-3">
            {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => (
              <div key={p} className="rounded-xl bg-sunk px-3 py-2.5">
                <dt className="text-[12px] font-semibold text-ink-3">{PAYMENT_LABEL[p]}</dt>
                <dd className="num mt-0.5 text-[16px] font-bold">{money(r.pay[p])}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
