"use client";

import clsx from "clsx";
import { ArrowRight, CalendarDays, Clock, MapPin, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart, Meter } from "@/components/charts/BarChart";
import { Avatar, Card, Dot, Empty, Field, Modal, PageHeader, Stat, StatusBadge, toast } from "@/components/ui";
import { SERIES } from "@/lib/constants";
import { addMonths, endOfMonth, endTime, formatMonthYear, startOfMonth, timeToMin } from "@/lib/dates";
import { change, money, percent } from "@/lib/format";
import { useData, useLookup, useNow } from "@/lib/hooks";
import { apptsIn, byStaff, summarize, type Summary } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import type { Branch, BranchFilter } from "@/lib/types";

export default function BranchesPage() {
  const { today, minutes } = useNow();
  const data = useData();
  const L = useLookup();
  const f = useStore((s) => s.branchFilter);
  const setF = useStore((s) => s.setBranchFilter);
  const [editing, setEditing] = useState<Branch | null>(null);

  const ms = startOfMonth(today);
  const cards = useMemo(
    () =>
      data.branches.map((b) => ({
        b,
        today: apptsIn(data, today, today, b.id).filter((a) => a.status !== "cancelled").length,
        month: summarize(data, ms, today, b.id),
        staff: data.staff.filter((s) => s.active && s.branchId === b.id).length,
      })),
    [data, today, ms],
  );
  const months = useMemo(() => Array.from({ length: 5 }, (_, i) => addMonths(ms, i - 4)), [ms]);

  const options: { id: BranchFilter; name: string; color: string }[] = [{ id: "all", name: "Tüm şubeler", color: "#b5a9ad" }, ...data.branches];

  return (
    <>
      <PageHeader title="Şubeler" sub="Detaylarını görmek istediğiniz şubeyi seçin. Seçiminiz diğer sayfalara da uygulanır." />

      <div role="radiogroup" aria-label="Şube seçimi" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map((o) => {
          const on = f === o.id;
          const c = cards.find((x) => x.b.id === o.id);
          const totalToday = cards.reduce((s, x) => s + x.today, 0);
          const totalMonth = cards.reduce((s, x) => s + x.month.income, 0);
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setF(o.id)}
              className={clsx(
                "card cursor-pointer p-5 text-left transition-all",
                on ? "!border-rose ring-2 ring-rose/15" : "hover:border-line-2 hover:shadow-[var(--shadow-pop)]",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Dot color={o.color} className="!size-3" />
                <span className="display text-[24px]">{o.name}</span>
                {on && <span className="ml-auto rounded-full bg-rose px-2 py-0.5 text-[11px] font-bold text-white">Seçili</span>}
              </div>
              <p className="mt-1 truncate text-[13px] text-ink-3">
                {o.id === "all" ? `${data.branches.length} şube birlikte` : c?.b.address || "Adres eklenmedi"}
              </p>
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-[12px] font-semibold text-ink-3">Bugün</p>
                  <p className="num text-[18px] font-bold">{o.id === "all" ? totalToday : c?.today} randevu</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-ink-3">Bu ay ciro</p>
                  <p className="num text-[18px] font-bold">{money(o.id === "all" ? totalMonth : (c?.month.income ?? 0))}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {f === "all" ? <Comparison months={months} today={today} /> : <BranchDetail id={f} today={today} minutes={minutes} months={months} onEdit={setEditing} L={L} />}
      </div>

      {editing && <BranchForm branch={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function Comparison({ months, today }: { months: string[]; today: string }) {
  const data = useData();
  const ms = startOfMonth(today);
  const rows = data.branches.map((b) => ({ b, s: summarize(data, ms, today, b.id) }));
  const metrics: { label: string; get: (s: Summary) => string }[] = [
    { label: "Ciro (hizmet + ürün)", get: (s) => money(s.income) },
    { label: "Gider", get: (s) => money(s.expense) },
    { label: "Net kâr", get: (s) => money(s.net) },
    { label: "Randevu", get: (s) => String(s.appointments) },
    { label: "Tamamlanan", get: (s) => String(s.completed) },
    { label: "Ortalama sepet", get: (s) => money(s.avgTicket) },
    { label: "Doluluk", get: (s) => percent(s.occupancy) },
    { label: "Tekil müşteri", get: (s) => String(s.uniqueCustomers) },
    { label: "Yeni müşteri", get: (s) => String(s.newCustomers) },
    { label: "Gelmedi + iptal", get: (s) => String(s.noshow + s.cancelled) },
  ];
  const chart = months.map((m) => ({
    key: m,
    label: formatMonthYear(m).split(" ")[0]!.slice(0, 3),
    title: formatMonthYear(m),
    values: data.branches.map((b) => summarize(data, m, m === ms ? today : endOfMonth(m), b.id).income),
  }));
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-2" title="Bu ay karşılaştırma" sub={`${formatMonthYear(today)}, bugüne kadar`} pad={false}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Gösterge</th>
                {rows.map(({ b }) => (
                  <th key={b.id} className="!text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <Dot color={b.color} className="!size-2" /> {b.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label}>
                  <td className="font-semibold text-ink-2">{m.label}</td>
                  {rows.map(({ b, s }) => (
                    <td key={b.id} className="num text-right font-semibold">
                      {m.get(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="xl:col-span-3" title="Aylık ciro — şubeler" sub="Son 5 ay (bu ay bugüne kadar)">
        <BarChart data={chart} series={data.branches.map((b, i) => ({ name: b.name, color: b.color ?? SERIES[i]! }))} formatFull={money} height={280} ariaLabel="Son beş ayın şube bazında ciro grafiği" />
      </Card>
    </div>
  );
}

function BranchDetail({ id, today, minutes, months, onEdit, L }: { id: string; today: string; minutes: number; months: string[]; onEdit: (b: Branch) => void; L: ReturnType<typeof useLookup> }) {
  const data = useData();
  const openAppt = useUi((s) => s.openAppt);
  const b = data.branches.find((x) => x.id === id);
  const ms = startOfMonth(today);
  const pms = addMonths(ms, -1);
  const pme = [addMonths(today, -1), endOfMonth(pms)].sort()[0]!;
  const s = useMemo(() => summarize(data, ms, today, id), [data, ms, today, id]);
  const prev = useMemo(() => summarize(data, pms, pme, id), [data, pms, pme, id]);
  const perf = useMemo(() => byStaff(data, ms, today, id), [data, ms, today, id]);
  const todayList = useMemo(() => apptsIn(data, today, today, id).filter((a) => a.status !== "cancelled").sort((a, x) => a.start.localeCompare(x.start)), [data, today, id]);
  const chart = useMemo(
    () =>
      months.map((m) => {
        const x = summarize(data, m, m === ms ? today : endOfMonth(m), id);
        return { key: m, label: formatMonthYear(m).split(" ")[0]!.slice(0, 3), title: formatMonthYear(m), values: [x.income, x.expense] };
      }),
    [data, months, ms, today, id],
  );
  if (!b) return <Empty title="Şube bulunamadı" />;
  const upcoming = todayList.filter((a) => timeToMin(a.start) + a.durationMin > minutes && (a.status === "planned" || a.status === "confirmed"));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Bugün" value={`${todayList.length} randevu`} hint={`${upcoming.length} tanesi bekliyor`} />
        <Stat label="Bu ay ciro" value={money(s.income)} delta={change(s.income, prev.income)} hint="geçen aya göre" />
        <Stat label="Bu ay net" value={money(s.net)} hint={`Gider ${money(s.expense)}`} />
        <Stat label="Doluluk (bu ay)" value={percent(s.occupancy)} delta={change(s.occupancy, prev.occupancy)} hint={`${s.appointments} randevu`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title="Şube bilgileri"
          action={
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(b)}>
              <Pencil size={14} aria-hidden /> Düzenle
            </button>
          }
        >
          <ul className="flex flex-col gap-3 text-[14px]">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
              <span className={b.address ? "" : "text-ink-3"}>{b.address || "Adres eklenmedi"}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="shrink-0 text-ink-3" aria-hidden />
              {b.phone ? <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="num hover:text-rose-700">{b.phone}</a> : <span className="text-ink-3">Telefon eklenmedi</span>}
            </li>
            <li className="flex items-center gap-2.5">
              <Clock size={16} className="shrink-0 text-ink-3" aria-hidden />
              <span className="num">
                {String(b.openHour).padStart(2, "0")}:00 – {String(b.closeHour).padStart(2, "0")}:00
              </span>
            </li>
          </ul>
          <p className="eyebrow mb-2 mt-5">Personel ({perf.length})</p>
          <ul className="flex flex-col gap-3">
            {perf.map((p) => (
              <li key={p.staff.id}>
                <div className="mb-1 flex items-center gap-2.5">
                  <Avatar name={p.staff.name} color={p.staff.color} size={26} />
                  <span className="flex-1 truncate text-[14px] font-semibold">{p.staff.name}</span>
                  <span className="num text-[12.5px] text-ink-3">{money(p.revenue)}</span>
                </div>
                <Meter value={p.occupancy} color={p.staff.color} label={`${p.staff.name} doluluk ${percent(p.occupancy)}`} />
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Bugün bu şubede"
          sub={`${todayList.length} randevu`}
          pad={false}
          action={
            <Link href="/panel/randevular" className="btn btn-ghost btn-sm">
              <CalendarDays size={14} aria-hidden /> Takvim
            </Link>
          }
        >
          {todayList.length ? (
            <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
              {todayList.map((a) => {
                const st = L.staff.get(a.staffId);
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => openAppt(a.id)} className="flex w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-left hover:bg-sunk">
                      <span className="num w-[86px] shrink-0 text-[13.5px] font-bold">
                        {a.start}–{endTime(a.start, a.durationMin)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{L.customers.get(a.customerId)?.name}</span>
                        <span className="block truncate text-[12.5px] text-ink-3">
                          {L.services.get(a.serviceId)?.name} · {st?.name.split(" ")[0]}
                        </span>
                      </span>
                      <StatusBadge status={a.status} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title="Bugün randevu yok" />
          )}
        </Card>

        <Card title="Son 5 ay" sub="Aylık gelir ve gider">
          <BarChart
            data={chart}
            series={[
              { name: "Gelir", color: SERIES[0] },
              { name: "Gider", color: SERIES[1] },
            ]}
            formatFull={money}
            height={260}
            ariaLabel={`${b.name} son beş ay gelir ve gider grafiği`}
          />
          <Link href="/panel/raporlar" className="btn btn-secondary btn-sm mt-3">
            Detaylı rapor <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      </div>
    </div>
  );
}

function BranchForm({ branch, onClose }: { branch: Branch; onClose: () => void }) {
  const save = useStore((s) => s.saveBranch);
  const [b, setB] = useState(branch);
  const valid = b.name.trim() && b.openHour < b.closeHour;
  return (
    <Modal
      open
      onClose={onClose}
      title="Şubeyi düzenle"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => {
              save({ ...b, name: b.name.trim(), address: b.address.trim(), phone: b.phone.trim() });
              toast("Şube bilgileri kaydedildi");
              onClose();
            }}
          >
            Kaydet
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Şube adı" required className="sm:col-span-2">
          {(id) => <input id={id} className="input" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} data-autofocus />}
        </Field>
        <Field label="Adres" className="sm:col-span-2">
          {(id) => <input id={id} className="input" value={b.address} onChange={(e) => setB({ ...b, address: e.target.value })} />}
        </Field>
        <Field label="Telefon">
          {(id) => <input id={id} className="input num" type="tel" value={b.phone} onChange={(e) => setB({ ...b, phone: e.target.value })} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Açılış">
            {(id) => (
              <select id={id} className="input num" value={b.openHour} onChange={(e) => setB({ ...b, openHour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Kapanış" error={b.openHour >= b.closeHour ? "Kapanış açılıştan sonra olmalı." : null}>
            {(id, d) => (
              <select id={id} aria-describedby={d} className="input num" value={b.closeHour} onChange={(e) => setB({ ...b, closeHour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Şube rengi</legend>
          <div className="flex gap-2">
            {SERIES.map((c) => (
              <button key={c} type="button" onClick={() => setB({ ...b, color: c })} aria-label={`Renk ${c}`} aria-pressed={b.color === c} className={clsx("size-9 cursor-pointer rounded-full border-2 transition-transform", b.color === c ? "scale-110 border-ink" : "border-transparent")} style={{ background: c }} />
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
