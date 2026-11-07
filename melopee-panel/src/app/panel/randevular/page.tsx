"use client";

import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BranchTabs } from "@/components/BranchTabs";
import { DayGrid, StaffLegend, WeekGrid } from "@/components/appointments/Calendar";
import { Avatar, Dot, Empty, PageHeader, Segmented, StatusBadge } from "@/components/ui";
import { PAYMENT_LABEL, STATUS_LABEL, STATUS_ORDER } from "@/lib/constants";
import { download, toCsv } from "@/lib/csv";
import { addDays, endTime, formatDayShort, formatLong, formatWeekdayShort, periodOf, startOfWeek } from "@/lib/dates";
import { money, normalizeSearch } from "@/lib/format";
import { useLookup, useNow } from "@/lib/hooks";
import { isRevenue, matchBranch, sum } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import type { AppointmentStatus } from "@/lib/types";

type View = "day" | "week" | "list";

export default function AppointmentsPage() {
  const { today, minutes } = useNow();
  const branches = useStore((s) => s.branches);
  const staff = useStore((s) => s.staff);
  const appointments = useStore((s) => s.appointments);
  const slot = useStore((s) => s.settings.slotMinutes);
  const branchFilter = useStore((s) => s.branchFilter);
  const openAppt = useUi((s) => s.openAppt);
  const openApptForm = useUi((s) => s.openApptForm);
  const L = useLookup();

  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState(today);
  const [staffFilter, setStaffFilter] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [q, setQ] = useState("");
  const setFocusDate = useUi((s) => s.setFocusDate);
  useEffect(() => {
    setFocusDate(date);
    return () => setFocusDate(null);
  }, [date, setFocusDate]);

  const visibleBranches = branches.filter((b) => matchBranch(b.id, branchFilter));
  const branchStaff = staff.filter((s) => matchBranch(s.branchId, branchFilter) && s.active);
  const columns = branchStaff.filter((s) => staffFilter === "all" || s.id === staffFilter);
  const effectiveStaffFilter = columns.length === branchStaff.length ? "all" : staffFilter;

  const range = view === "day" ? { start: date, end: date } : periodOf("week", date);
  const inRange = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.date >= range.start &&
          a.date <= range.end &&
          matchBranch(a.branchId, branchFilter) &&
          (effectiveStaffFilter === "all" || a.staffId === effectiveStaffFilter),
      ),
    [appointments, range.start, range.end, branchFilter, effectiveStaffFilter],
  );
  const onGrid = inRange.filter((a) => showCancelled || a.status !== "cancelled");

  const listRows = useMemo(() => {
    const nq = normalizeSearch(q);
    return inRange
      .filter((a) => status === "all" || a.status === status)
      .filter((a) => {
        if (!nq) return true;
        const c = L.customers.get(a.customerId);
        return normalizeSearch(`${c?.name ?? ""} ${c?.phone ?? ""} ${L.services.get(a.serviceId)?.name ?? ""}`).includes(nq);
      })
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  }, [inRange, status, q, L]);

  const step = (dir: 1 | -1) => setDate((d) => addDays(d, view === "day" ? dir : 7 * dir));
  const active = inRange.filter((a) => a.status !== "cancelled");
  const expected = sum(active.filter((a) => a.status !== "noshow"), (a) => a.price);
  const earned = sum(inRange.filter(isRevenue), (a) => a.price);
  const rangeLabel = view === "day" ? formatLong(date) : periodOf("week", date).label;

  function exportCsv() {
    const rows = listRows.map((a) => {
      const c = L.customers.get(a.customerId);
      return [a.date, a.start, endTime(a.start, a.durationMin), c?.name, c?.phone, L.services.get(a.serviceId)?.name, L.staff.get(a.staffId)?.name, L.branches.get(a.branchId)?.name, a.price, STATUS_LABEL[a.status], a.payment ? PAYMENT_LABEL[a.payment] : "", a.note];
    });
    download(`randevular-${range.start}_${range.end}.csv`, toCsv(["Tarih", "Başlangıç", "Bitiş", "Müşteri", "Telefon", "Hizmet", "Personel", "Şube", "Ücret", "Durum", "Ödeme", "Not"], rows));
  }

  return (
    <>
      <PageHeader
        title="Randevular"
        sub={
          <span className="num">
            {rangeLabel} · <strong className="text-ink">{active.length}</strong> randevu · tahsil edilen <strong className="text-ink">{money(earned)}</strong> · toplam beklenen{" "}
            <strong className="text-ink">{money(expected)}</strong>
          </span>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <BranchTabs />
          <Segmented<View>
            label="Görünüm"
            value={view}
            onChange={setView}
            options={[
              { value: "day", label: "Gün" },
              { value: "week", label: "Hafta" },
              { value: "list", label: "Liste" },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => step(-1)} aria-label={view === "day" ? "Önceki gün" : "Önceki hafta"}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setDate(today)} disabled={view === "day" ? date === today : startOfWeek(date) === startOfWeek(today)}>
              Bugün
            </button>
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => step(1)} aria-label={view === "day" ? "Sonraki gün" : "Sonraki hafta"}>
              <ChevronRight size={18} />
            </button>
          </div>
          <label className="sr-only" htmlFor="appt-date">
            Tarih
          </label>
          <input id="appt-date" type="date" className="input num !w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <label className="sr-only" htmlFor="appt-staff">
            Personel
          </label>
          <select id="appt-staff" className="input !w-auto" value={effectiveStaffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
            <option value="all">Tüm personel</option>
            {branchStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {view !== "list" && (
            <label className="ml-1 flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold text-ink-2">
              <input type="checkbox" className="size-4 accent-[#a3486a]" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
              İptalleri göster
            </label>
          )}
        </div>
        {/* Hafta şeridi: günlük görünümde hızlı gün seçimi */}
        {view === "day" && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Haftanın günleri">
            {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i)).map((d) => {
              const n = appointments.filter((a) => a.date === d && a.status !== "cancelled" && matchBranch(a.branchId, branchFilter)).length;
              const on = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  aria-pressed={on}
                  className={`flex min-w-[78px] cursor-pointer flex-col items-start rounded-xl border px-3 py-1.5 text-left transition-colors ${on ? "border-rose bg-rose-50" : "border-line bg-surface hover:bg-sunk"}`}
                >
                  <span className={`text-[11.5px] font-bold uppercase ${d === today ? "text-rose-700" : "text-ink-3"}`}>{d === today ? "Bugün" : formatWeekdayShort(d)}</span>
                  <span className="num text-[14px] font-bold">{formatDayShort(d)}</span>
                  <span className="num text-[11.5px] text-ink-3">{n} randevu</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {view === "day" &&
        (columns.length ? (
          <DayGrid
            date={date}
            staff={columns}
            branches={visibleBranches}
            appointments={onGrid}
            L={L}
            slot={slot}
            nowMin={minutes}
            isToday={date === today}
            onOpen={openAppt}
            onCreate={(s, start) => openApptForm({ branchId: s.branchId, staffId: s.id, date, start })}
          />
        ) : (
          <div className="card">
            <Empty title="Bu şubede aktif personel yok">Personel sayfasından personel ekleyin.</Empty>
          </div>
        ))}

      {view === "week" && (
        <div className="flex flex-col gap-3">
          <StaffLegend staff={columns} />
          <WeekGrid
            start={startOfWeek(date)}
            staffOrder={columns.map((s) => s.id)}
            branches={visibleBranches}
            appointments={onGrid}
            L={L}
            slot={slot}
            nowMin={minutes}
            today={today}
            onOpen={openAppt}
            onPickDay={(d) => {
              setDate(d);
              setView("day");
            }}
          />
        </div>
      )}

      {view === "list" && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
              <input className="input !pl-9" placeholder="Müşteri, telefon veya hizmet ara" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Randevularda ara" />
            </div>
            <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus | "all")} aria-label="Durum">
              <option value="all">Tüm durumlar</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button type="button" data-export className="btn btn-secondary" onClick={exportCsv} disabled={!listRows.length}>
              <Download size={16} aria-hidden /> CSV
            </button>
          </div>
          {listRows.length ? (
            <div className="overflow-x-auto">
              <table className="table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Saat</th>
                    <th>Müşteri</th>
                    <th>Hizmet</th>
                    <th>Personel</th>
                    {branchFilter === "all" && <th>Şube</th>}
                    <th className="!text-right">Ücret</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {listRows.map((a) => {
                    const c = L.customers.get(a.customerId);
                    const s = L.staff.get(a.staffId);
                    const b = L.branches.get(a.branchId);
                    return (
                      <tr key={a.id} className="row-link" onClick={() => openAppt(a.id)}>
                        <td className="num whitespace-nowrap font-semibold">
                          {formatWeekdayShort(a.date)} {formatDayShort(a.date)}
                        </td>
                        <td className="num whitespace-nowrap">
                          {a.start}–{endTime(a.start, a.durationMin)}
                        </td>
                        <td>
                          <button type="button" className="cursor-pointer font-semibold hover:text-rose-700 hover:underline" onClick={(e) => { e.stopPropagation(); openAppt(a.id); }}>
                            {c?.name ?? "—"}
                          </button>
                        </td>
                        <td className="text-ink-2">{L.services.get(a.serviceId)?.name}</td>
                        <td>
                          <span className="flex items-center gap-2 whitespace-nowrap">
                            {s && <Avatar name={s.name} color={s.color} size={22} />}
                            {s?.name}
                          </span>
                        </td>
                        {branchFilter === "all" && (
                          <td>
                            <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-2">
                              {b && <Dot color={b.color} />} {b?.name}
                            </span>
                          </td>
                        )}
                        <td className="num whitespace-nowrap text-right font-semibold">{money(a.price)}</td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Bu aralıkta randevu yok">Filtreleri değiştirin ya da yeni randevu oluşturun.</Empty>
          )}
        </div>
      )}
    </>
  );
}
