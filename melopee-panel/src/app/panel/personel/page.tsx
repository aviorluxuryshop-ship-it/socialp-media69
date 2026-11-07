"use client";

import clsx from "clsx";
import { Download, Pencil, Phone, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Meter } from "@/components/charts/BarChart";
import { Avatar, Card, Dot, Empty, Field, Modal, PageHeader, Segmented, Tag, toast } from "@/components/ui";
import { SERIES, STAFF_ROLES } from "@/lib/constants";
import { download, toCsv } from "@/lib/csv";
import { addMonths, endOfMonth, formatMonthYear, periodOf, startOfMonth, WEEKDAY_SHORT } from "@/lib/dates";
import { money, percent } from "@/lib/format";
import { useData, useLookup, useNow } from "@/lib/hooks";
import { byStaff } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { Staff, StaffRole } from "@/lib/types";

type Range = "week" | "month" | "prev";

export default function StaffPage() {
  const { today } = useNow();
  const data = useData();
  const L = useLookup();
  const f = useStore((s) => s.branchFilter);
  const [range, setRange] = useState<Range>("month");
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const r = useMemo(() => {
    if (range === "week") {
      const p = periodOf("week", today);
      return { start: p.start, end: p.end, label: `Bu hafta (${p.label})` };
    }
    if (range === "month") return { start: startOfMonth(today), end: today, label: `${formatMonthYear(today)} (bugüne kadar)` };
    const pm = addMonths(startOfMonth(today), -1);
    return { start: pm, end: endOfMonth(pm), label: formatMonthYear(pm) };
  }, [range, today]);

  const perf = useMemo(() => byStaff(data, r.start, r.end, f), [data, r, f]);
  const inactive = data.staff.filter((s) => !s.active && (f === "all" || s.branchId === f));
  const totals = perf.reduce((t, p) => ({ revenue: t.revenue + p.revenue, commission: t.commission + p.commission, salary: t.salary + p.staff.salary }), { revenue: 0, commission: 0, salary: 0 });

  function exportCsv() {
    download(
      `prim-hesabi-${r.start}_${r.end}.csv`,
      toCsv(
        ["Personel", "Şube", "Görev", "Randevu", "Tamamlanan", "Ciro", "Prim oranı (%)", "Prim", "Sabit maaş", "Toplam hakediş", "Doluluk"],
        perf.map((p) => [p.staff.name, L.branches.get(p.staff.branchId)?.name, p.staff.role, p.appointments, p.completed, p.revenue, p.staff.commissionRate, Math.round(p.commission), p.staff.salary, Math.round(p.commission + p.staff.salary), percent(p.occupancy)]),
      ),
    );
  }

  return (
    <>
      <PageHeader
        title="Personel"
        sub={`${perf.length} aktif personel · ${r.label}`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
            <UserPlus size={16} aria-hidden /> Yeni personel
          </button>
        }
      />
      <div className="mb-4">
        <Segmented<Range>
          label="Dönem"
          value={range}
          onChange={setRange}
          options={[
            { value: "week", label: "Bu hafta" },
            { value: "month", label: "Bu ay" },
            { value: "prev", label: "Geçen ay" },
          ]}
        />
      </div>

      {perf.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {perf.map((p) => {
            const b = L.branches.get(p.staff.branchId);
            return (
              <section key={p.staff.id} className="card flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={p.staff.name} color={p.staff.color} size={48} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[17px] font-bold">{p.staff.name}</h2>
                    <p className="truncate text-[13px] text-ink-3">{p.staff.role}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2">
                      {b && <Dot color={b.color} className="!size-2" />} {b?.name}
                    </p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(p.staff)} aria-label={`${p.staff.name} düzenle`}>
                    <Pencil size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Randevu", v: String(p.appointments) },
                    { l: "Ciro", v: money(p.revenue) },
                    { l: `Prim (%${p.staff.commissionRate})`, v: money(p.commission) },
                  ].map((x) => (
                    <div key={x.l} className="rounded-xl bg-sunk px-3 py-2">
                      <p className="truncate text-[11.5px] font-semibold text-ink-3">{x.l}</p>
                      <p className="num mt-0.5 truncate text-[15px] font-bold">{x.v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[12.5px] font-semibold text-ink-2">
                    <span>Doluluk</span>
                    <span className="num">{percent(p.occupancy)}</span>
                  </div>
                  <Meter value={p.occupancy} color={p.staff.color} label={`${p.staff.name} doluluk`} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12.5px]">
                  <div className="flex gap-1" aria-label="Çalışma günleri">
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <span key={d} className={clsx("rounded-md px-1.5 py-0.5 font-semibold", p.staff.workDays.includes(d) ? "bg-rose-50 text-rose-700" : "text-ink-3 line-through")}>
                        {WEEKDAY_SHORT[d]}
                      </span>
                    ))}
                  </div>
                  <span className="num text-ink-3">
                    Ort. {money(p.avgTicket)} · {p.customers} müşteri
                    {p.noshow ? ` · ${p.noshow} gelmedi` : ""}
                  </span>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <Empty title="Personel yok" action={<button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>Personel ekle</button>}>
            Personel ekledikten sonra randevu verebilir ve performanslarını izleyebilirsiniz.
          </Empty>
        </div>
      )}

      <Card
        className="mt-4"
        title="Prim ve hakediş"
        sub={`${r.label} · prim = tamamlanan randevu cirosu × prim oranı`}
        action={
          <button type="button" data-export className="btn btn-secondary btn-sm" onClick={exportCsv} disabled={!perf.length}>
            <Download size={14} aria-hidden /> CSV
          </button>
        }
        pad={false}
      >
        <div className="overflow-x-auto">
          <table className="table min-w-[720px]">
            <thead>
              <tr>
                <th>Personel</th>
                <th className="!text-right">Tamamlanan</th>
                <th className="!text-right">Ciro</th>
                <th className="!text-right">Prim</th>
                <th className="!text-right">Sabit maaş</th>
                <th className="!text-right">Toplam hakediş</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((p) => (
                <tr key={p.staff.id}>
                  <td>
                    <span className="flex items-center gap-2 font-semibold">
                      <Avatar name={p.staff.name} color={p.staff.color} size={24} /> {p.staff.name}
                    </span>
                  </td>
                  <td className="num text-right">{p.completed}</td>
                  <td className="num text-right">{money(p.revenue)}</td>
                  <td className="num text-right">{money(p.commission)}</td>
                  <td className="num text-right">{money(p.staff.salary)}</td>
                  <td className="num text-right font-bold">{money(p.commission + p.staff.salary)}</td>
                </tr>
              ))}
              {perf.length > 0 && (
                <tr className="bg-sunk">
                  <td className="font-bold">Toplam</td>
                  <td />
                  <td className="num text-right font-bold">{money(totals.revenue)}</td>
                  <td className="num text-right font-bold">{money(totals.commission)}</td>
                  <td className="num text-right font-bold">{money(totals.salary)}</td>
                  <td className="num text-right font-bold">{money(totals.commission + totals.salary)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {inactive.length > 0 && (
        <div className="mt-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowInactive((v) => !v)} aria-expanded={showInactive}>
            Pasif personel ({inactive.length})
          </button>
          {showInactive && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {inactive.map((s) => (
                <li key={s.id}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(s)}>
                    <Avatar name={s.name} color={s.color} size={20} /> {s.name} <Tag>Pasif</Tag>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing && <StaffForm staff={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function StaffForm({ staff, onClose }: { staff: Staff | null; onClose: () => void }) {
  const branches = useStore((s) => s.branches);
  const all = useStore((s) => s.staff);
  const f = useStore((s) => s.branchFilter);
  const save = useStore((s) => s.saveStaff);
  const { today } = useNow();
  const [s, setS] = useState<Omit<Staff, "id"> & { id?: string }>(
    staff ?? {
      name: "",
      branchId: f === "all" ? (branches[0]?.id ?? "") : f,
      role: "Nail Artist",
      phone: "",
      color: SERIES[all.length % SERIES.length]!,
      commissionRate: 15,
      salary: 30000,
      workDays: [1, 2, 3, 4, 5, 6],
      pin: String(1000 + Math.floor(Math.random() * 9000)),
      active: true,
      startDate: today,
    },
  );
  const [tried, setTried] = useState(false);
  const pinTaken = all.some((x) => x.id !== s.id && x.pin === s.pin && x.active);
  const errors = {
    name: !s.name.trim() ? "Ad soyad gerekli." : null,
    pin: !/^\d{4,6}$/.test(s.pin) ? "PIN 4–6 haneli rakam olmalı." : pinTaken ? "Bu PIN başka bir personelde kullanılıyor." : null,
    days: !s.workDays.length ? "En az bir çalışma günü seçin." : null,
  };
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((x) => ({ ...x, [k]: v }));

  return (
    <Modal
      open
      onClose={onClose}
      title={staff ? "Personeli düzenle" : "Yeni personel"}
      width={620}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setTried(true);
              if (Object.values(errors).some(Boolean)) return;
              save({ ...s, name: s.name.trim(), phone: s.phone.trim() });
              toast(staff ? "Personel güncellendi" : "Personel eklendi");
              onClose();
            }}
          >
            Kaydet
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ad soyad" required error={tried ? errors.name : null}>
          {(id, d) => <input id={id} aria-describedby={d} className="input" value={s.name} onChange={(e) => set("name", e.target.value)} data-autofocus />}
        </Field>
        <Field label="Telefon">
          {(id) => <input id={id} className="input num" type="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
        <Field label="Şube">
          {(id) => (
            <select id={id} className="input" value={s.branchId} onChange={(e) => set("branchId", e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Görev">
          {(id) => (
            <select id={id} className="input" value={s.role} onChange={(e) => set("role", e.target.value as StaffRole)}>
              {STAFF_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Prim oranı (%)" hint="Tamamlanan randevu cirosu üzerinden">
          {(id, d) => <input id={id} aria-describedby={d} className="input num" type="number" min={0} max={100} value={s.commissionRate} onChange={(e) => set("commissionRate", Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />}
        </Field>
        <Field label="Sabit aylık maaş (₺)">
          {(id) => <input id={id} className="input num" type="number" min={0} step={500} value={s.salary} onChange={(e) => set("salary", Math.max(0, Number(e.target.value) || 0))} />}
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Çalışma günleri</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const on = s.workDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("workDays", on ? s.workDays.filter((x) => x !== d) : [...s.workDays, d])}
                  className={clsx("min-h-[38px] min-w-[52px] cursor-pointer rounded-lg border px-3 text-[13.5px] font-semibold transition-colors", on ? "border-rose bg-rose-50 text-rose-700" : "border-line-2 text-ink-3 hover:bg-sunk")}
                >
                  {WEEKDAY_SHORT[d]}
                </button>
              );
            })}
          </div>
          {tried && errors.days && <p className="mt-1.5 text-[12.5px] font-semibold text-bad">{errors.days}</p>}
        </fieldset>
        <Field label="Personel paneli PIN" required error={tried || pinTaken ? errors.pin : null} hint="Personel bu PIN ile kendi programını görür.">
          {(id, d) => <input id={id} aria-describedby={d} className="input num tracking-[0.3em]" inputMode="numeric" maxLength={6} value={s.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))} />}
        </Field>
        <Field label="İşe başlama">
          {(id) => <input id={id} className="input num" type="date" value={s.startDate} onChange={(e) => set("startDate", e.target.value)} />}
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Takvim rengi</legend>
          <div className="flex gap-2">
            {SERIES.map((c) => (
              <button key={c} type="button" onClick={() => set("color", c)} aria-label={`Renk ${c}`} aria-pressed={s.color === c} className={clsx("size-9 cursor-pointer rounded-full border-2 transition-transform", s.color === c ? "scale-110 border-ink" : "border-transparent")} style={{ background: c }} />
            ))}
          </div>
        </fieldset>
        {staff && (
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold sm:col-span-2">
            <input type="checkbox" className="size-[18px] accent-[#b84c36]" checked={s.active} onChange={(e) => set("active", e.target.checked)} />
            Aktif (pasif personel takvimde ve girişte görünmez, geçmiş kayıtları korunur)
          </label>
        )}
        {staff?.phone && (
          <a href={`tel:${staff.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-sm justify-self-start">
            <Phone size={14} aria-hidden /> {staff.phone}
          </a>
        )}
      </div>
    </Modal>
  );
}
