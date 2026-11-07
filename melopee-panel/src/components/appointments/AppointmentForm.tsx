"use client";

import { AlertTriangle, Search, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Field, Modal, toast } from "@/components/ui";
import { SERVICE_CATEGORIES, STATUS_LABEL } from "@/lib/constants";
import { endTime, minToTime, weekday } from "@/lib/dates";
import { money, normalizeSearch } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { findConflict } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import type { AppointmentStatus } from "@/lib/types";

export function AppointmentForm() {
  const draft = useUi((s) => s.apptForm);
  const close = useUi((s) => s.closeApptForm);
  if (!draft) return null;
  // key: her açılışta form durumunu sıfırlar.
  return <FormInner key={draft.id ?? JSON.stringify(draft)} onClose={close} />;
}

function FormInner({ onClose }: { onClose: () => void }) {
  const draft = useUi((s) => s.apptForm)!;
  const openAppt = useUi((s) => s.openAppt);
  const { today } = useNow();
  const branches = useStore((s) => s.branches);
  const staff = useStore((s) => s.staff);
  const services = useStore((s) => s.services);
  const customers = useStore((s) => s.customers);
  const appointments = useStore((s) => s.appointments);
  const settings = useStore((s) => s.settings);
  const saveAppointment = useStore((s) => s.saveAppointment);
  const saveCustomer = useStore((s) => s.saveCustomer);

  const editing = !!draft.id;
  const initialStaff = draft.staffId ? staff.find((s) => s.id === draft.staffId) : undefined;
  const [branchId, setBranchId] = useState(draft.branchId ?? initialStaff?.branchId ?? branches[0]?.id ?? "");
  const [staffId, setStaffId] = useState(draft.staffId ?? "");
  const [serviceId, setServiceId] = useState(draft.serviceId ?? "");
  const [customerId, setCustomerId] = useState(draft.customerId ?? "");
  const [date, setDate] = useState(draft.date ?? today);
  const [start, setStart] = useState(draft.start ?? "");
  const [duration, setDuration] = useState(draft.durationMin ?? 60);
  const [price, setPrice] = useState(draft.price ?? 0);
  const [status, setStatus] = useState<AppointmentStatus>(draft.status ?? "confirmed");
  const [note, setNote] = useState(draft.note ?? "");
  const [query, setQuery] = useState("");
  const [newCustomer, setNewCustomer] = useState<{ name: string; phone: string } | null>(null);
  const [tried, setTried] = useState(false);

  const branch = branches.find((b) => b.id === branchId);
  const branchStaff = staff.filter((s) => s.branchId === branchId && (s.active || s.id === staffId));
  const customer = customers.find((c) => c.id === customerId);

  // Şube değişince başka şubenin personeli seçili kalmasın.
  useEffect(() => {
    if (staffId && !branchStaff.some((s) => s.id === staffId)) setStaffId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Müşterinin tercih ettiği personel bu şubedeyse önceden seç.
  useEffect(() => {
    if (!staffId && customer?.preferredStaffId && branchStaff.some((s) => s.id === customer.preferredStaffId)) setStaffId(customer.preferredStaffId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const times = useMemo(() => {
    if (!branch) return [];
    const out: string[] = [];
    for (let m = branch.openHour * 60; m <= branch.closeHour * 60 - 15; m += settings.slotMinutes) out.push(minToTime(m));
    if (start && !out.includes(start)) out.push(start);
    return out.sort();
  }, [branch, settings.slotMinutes, start]);

  const matches = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return [];
    const qd = query.replace(/\D/g, "");
    return customers
      .filter((c) => normalizeSearch(c.name).includes(q) || (qd.length >= 3 && c.phone.replace(/\D/g, "").includes(qd)))
      .slice(0, 6);
  }, [query, customers]);

  const person = staff.find((s) => s.id === staffId);
  const conflict = staffId && date && start ? findConflict(appointments, { id: draft.id ?? "", staffId, date, start, durationMin: duration }) : null;
  const offDay = person && date && !person.workDays.includes(weekday(date));
  const overClose = branch && start && endTime(start, duration) > `${String(branch.closeHour).padStart(2, "0")}:00`;

  const errors = {
    customer: !customerId && !(newCustomer && newCustomer.name.trim() && newCustomer.phone.trim()) ? "Müşteri seçin ya da yeni müşteri ekleyin." : null,
    service: !serviceId ? "Hizmet seçin." : null,
    staff: !staffId ? "Personel seçin." : null,
    date: !date ? "Tarih seçin." : null,
    start: !start ? "Saat seçin." : null,
    conflict: conflict && conflict.status !== "cancelled" ? `Bu saatte ${person?.name.split(" ")[0]} için başka bir randevu var (${conflict.start}–${endTime(conflict.start, conflict.durationMin)}).` : null,
  };
  const valid = Object.values(errors).every((e) => !e);

  function pickService(id: string) {
    setServiceId(id);
    const s = services.find((x) => x.id === id);
    if (s) {
      setDuration(s.durationMin);
      setPrice(s.price);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid) {
      // Hatalı ilk alanı görünür yap ve odakla.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('#appt-form [aria-invalid="true"]');
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    let cid = customerId;
    if (!cid && newCustomer) {
      cid = saveCustomer({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: "",
        birthday: "",
        notes: "",
        allergies: "",
        vip: false,
        source: "Diğer",
        preferredStaffId: staffId || null,
      });
    }
    const id = saveAppointment({
      id: draft.id,
      branchId,
      staffId,
      customerId: cid,
      serviceId,
      date,
      start,
      durationMin: duration,
      price,
      status,
      payment: status === "completed" ? (draft.payment ?? "kart") : null,
      note: note.trim(),
    });
    toast(editing ? "Randevu güncellendi" : "Randevu oluşturuldu");
    onClose();
    if (editing) openAppt(id);
  }

  const err = (k: keyof typeof errors) => (tried ? errors[k] : null);

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Randevuyu düzenle" : "Yeni randevu"}
      width={640}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form="appt-form" className="btn btn-primary">
            {editing ? "Kaydet" : "Randevu oluştur"}
          </button>
        </>
      }
    >
      <form id="appt-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {/* Müşteri */}
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-semibold text-ink-2">
            Müşteri <span className="text-rose">*</span>
          </p>
          {customer ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-sunk px-3 py-2.5">
              <Avatar name={customer.name} size={34} color="#b84c36" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{customer.name}</p>
                <p className="num text-[13px] text-ink-3">{customer.phone}</p>
              </div>
              {customer.allergies && (
                <span className="hidden items-center gap-1 rounded-md bg-warn-50 px-2 py-1 text-[12px] font-semibold text-warn sm:inline-flex">
                  <AlertTriangle size={13} aria-hidden /> {customer.allergies}
                </span>
              )}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCustomerId("")}>
                Değiştir
              </button>
            </div>
          ) : newCustomer ? (
            <div className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-rose-700">
                  <UserPlus size={15} aria-hidden /> Yeni müşteri
                </p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewCustomer(null)}>
                  <X size={14} aria-hidden /> Vazgeç
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Ad soyad" required>
                  {(id) => <input id={id} className="input" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} autoComplete="off" />}
                </Field>
                <Field label="Telefon" required>
                  {(id) => <input id={id} className="input num" type="tel" inputMode="tel" placeholder="05xx xxx xx xx" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />}
                </Field>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-[13px] text-ink-3" aria-hidden />
              <input
                className="input !pl-9"
                placeholder="Ad veya telefon ile ara…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Müşteri ara"
                aria-invalid={!!err("customer")}
                data-autofocus
                autoComplete="off"
              />
              {query && (
                <ul className="mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-soft)]" role="listbox" aria-label="Eşleşen müşteriler">
                  {matches.map((c) => (
                    <li key={c.id}>
                      <button type="button" role="option" aria-selected={false} className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-sunk" onClick={() => setCustomerId(c.id)}>
                        <Avatar name={c.name} size={28} color="#b84c36" />
                        <span className="flex-1 truncate font-semibold">{c.name}</span>
                        <span className="num text-[13px] text-ink-3">{c.phone}</span>
                      </button>
                    </li>
                  ))}
                  <li className="border-t border-line">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left font-semibold text-rose-700 hover:bg-rose-50"
                      onClick={() => setNewCustomer({ name: /\d/.test(query) ? "" : query, phone: /\d/.test(query) ? query : "" })}
                    >
                      <UserPlus size={16} aria-hidden /> “{query}” için yeni müşteri ekle
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
          {err("customer") && <p className="mt-1.5 text-[12.5px] font-semibold text-bad" role="alert">{err("customer")}</p>}
        </div>

        <Field label="Şube" required>
          {(id) => (
            <select id={id} className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Hizmet" required error={err("service")}>
          {(id, d) => (
            <select id={id} aria-describedby={d} aria-invalid={!!err("service")} className="input" value={serviceId} onChange={(e) => pickService(e.target.value)}>
              <option value="">Seçin…</option>
              {SERVICE_CATEGORIES.map((cat) => {
                const list = services.filter((s) => s.category === cat && (s.active || s.id === serviceId));
                if (!list.length) return null;
                return (
                  <optgroup key={cat} label={cat}>
                    {list.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.durationMin} dk · {money(s.price)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          )}
        </Field>
        <Field label="Personel" required error={err("staff")} hint={offDay ? "Bu personel seçilen günde normalde çalışmıyor." : undefined}>
          {(id, d) => (
            <select id={id} aria-describedby={d} aria-invalid={!!err("staff")} className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Seçin…</option>
              {branchStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {date && !s.workDays.includes(weekday(date)) ? " (izinli)" : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tarih" required error={err("date")}>
          {(id, d) => <input id={id} aria-describedby={d} type="date" className="input num" value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <Field label="Başlangıç saati" required error={err("start") ?? errors.conflict} hint={start && duration ? `Bitiş: ${endTime(start, duration)}${overClose ? " — kapanış saatini aşıyor" : ""}` : undefined}>
          {(id, d) => (
            <select id={id} aria-describedby={d} aria-invalid={!!err("start") || !!errors.conflict} className="input num" value={start} onChange={(e) => setStart(e.target.value)}>
              <option value="">Seçin…</option>
              {times.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Süre (dk)">
            {(id) => <input id={id} type="number" min={15} step={15} className="input num" value={duration} onChange={(e) => setDuration(Math.max(15, Number(e.target.value) || 0))} />}
          </Field>
          <Field label="Ücret (₺)">
            {(id) => <input id={id} type="number" min={0} step={50} className="input num" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />}
          </Field>
        </div>
        <Field label="Durum">
          {(id) => (
            <select id={id} className="input" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
              {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Not" className="sm:col-span-2">
          {(id) => <textarea id={id} className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Renk tercihi, tasarım fikri, hatırlatma…" />}
        </Field>

      </form>
    </Modal>
  );
}
