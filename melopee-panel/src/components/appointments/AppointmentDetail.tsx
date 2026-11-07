"use client";

import { AlertTriangle, CalendarClock, Check, CheckCheck, MessageCircle, Pencil, Phone, StickyNote, Trash2, UserX, XCircle } from "lucide-react";
import { useState } from "react";
import { Avatar, Confirm, Dot, Drawer, StatusBadge, toast } from "@/components/ui";
import { PAYMENT_LABEL } from "@/lib/constants";
import { endTime, formatLong } from "@/lib/dates";
import { minutesLabel, money, whatsappLink } from "@/lib/format";
import { useLookup } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import type { PaymentMethod } from "@/lib/types";

export function AppointmentDetail() {
  const id = useUi((s) => s.apptDetail);
  const openAppt = useUi((s) => s.openAppt);
  const openApptForm = useUi((s) => s.openApptForm);
  const openCustomer = useUi((s) => s.openCustomer);
  const appt = useStore((s) => s.appointments.find((a) => a.id === id));
  const studio = useStore((s) => s.settings.studioName);
  const setStatus = useStore((s) => s.setAppointmentStatus);
  const remove = useStore((s) => s.deleteAppointment);
  const L = useLookup();
  const [payment, setPayment] = useState<PaymentMethod>("kart");
  const [confirmDel, setConfirmDel] = useState(false);

  if (!id || !appt) return null;
  const c = L.customers.get(appt.customerId);
  const s = L.staff.get(appt.staffId);
  const svc = L.services.get(appt.serviceId);
  const b = L.branches.get(appt.branchId);
  const close = () => openAppt(null);
  const open = appt.status === "planned" || appt.status === "confirmed";
  const reminder = c
    ? `Merhaba ${c.name.split(" ")[0]}, ${formatLong(appt.date)} saat ${appt.start} için ${svc ? `${svc.name} ` : ""}randevunuzu hatırlatmak isteriz. Görüşmek üzere! — ${studio}`
    : "";

  return (
    <>
      <Drawer
        open
        onClose={close}
        title={
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="eyebrow">Randevu</p>
              <p className="display mt-1 truncate text-[26px]">{svc?.name ?? "Hizmet"}</p>
            </div>
          </div>
        }
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => openApptForm({ ...appt })}>
              <Pencil size={15} aria-hidden /> Düzenle
            </button>
            <button type="button" className="btn btn-danger ml-auto" onClick={() => setConfirmDel(true)}>
              <Trash2 size={15} aria-hidden /> Sil
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={appt.status} />
            {appt.payment && <span className="rounded-full bg-sunk px-2 py-0.5 text-[12px] font-semibold text-ink-2">{PAYMENT_LABEL[appt.payment]}</span>}
          </div>

          <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-[14.5px]">
            <dt className="text-ink-3">Tarih</dt>
            <dd className="font-semibold">{formatLong(appt.date)}</dd>
            <dt className="text-ink-3">Saat</dt>
            <dd className="num font-semibold">
              {appt.start} – {endTime(appt.start, appt.durationMin)} <span className="font-normal text-ink-3">({minutesLabel(appt.durationMin)})</span>
            </dd>
            <dt className="text-ink-3">Personel</dt>
            <dd className="flex items-center gap-2 font-semibold">
              {s && <Avatar name={s.name} color={s.color} size={22} />} {s?.name ?? "—"}
            </dd>
            <dt className="text-ink-3">Şube</dt>
            <dd className="flex items-center gap-2 font-semibold">
              {b && <Dot color={b.color} />} {b?.name ?? "—"}
            </dd>
            <dt className="text-ink-3">Ücret</dt>
            <dd className="num font-semibold">
              {money(appt.price)}
              {svc && svc.price !== appt.price && <span className="ml-1.5 font-normal text-ink-3">(liste: {money(svc.price)})</span>}
            </dd>
          </dl>

          {c && (
            <div className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size={40} color="#a3486a" />
                <div className="min-w-0 flex-1">
                  <button type="button" className="cursor-pointer truncate text-left text-[16px] font-bold hover:text-rose-700 hover:underline" onClick={() => openCustomer(c.id)}>
                    {c.name}
                  </button>
                  <p className="num text-[13.5px] text-ink-3">{c.phone}</p>
                </div>
                {c.vip && <span className="rounded-full bg-[#f6efe2] px-2 py-0.5 text-[11.5px] font-bold text-[#7d5f2e]">VIP</span>}
              </div>
              {c.allergies && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-warn-50 px-3 py-2 text-[13.5px] font-semibold text-warn">
                  <AlertTriangle size={15} aria-hidden /> {c.allergies}
                </p>
              )}
              {c.notes && (
                <p className="mt-2 flex items-start gap-2 text-[13.5px] text-ink-2">
                  <StickyNote size={15} className="mt-0.5 shrink-0 text-ink-3" aria-hidden /> {c.notes}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="btn btn-secondary btn-sm" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                  <Phone size={14} aria-hidden /> Ara
                </a>
                {open && (
                  <a className="btn btn-secondary btn-sm" href={whatsappLink(c.phone, reminder)} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} aria-hidden /> WhatsApp hatırlatma
                  </a>
                )}
              </div>
            </div>
          )}

          {appt.note && (
            <div>
              <p className="eyebrow mb-1.5">Randevu notu</p>
              <p className="text-[14.5px] text-ink-2">{appt.note}</p>
            </div>
          )}

          <div>
            <p className="eyebrow mb-2.5">Durumu güncelle</p>
            {open ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end gap-2 rounded-xl bg-ok-50 p-3">
                  <label className="flex flex-1 flex-col gap-1 text-[12.5px] font-semibold text-ok">
                    Ödeme yöntemi
                    <select className="input !min-h-[38px] bg-surface" value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
                      {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => (
                        <option key={p} value={p}>
                          {PAYMENT_LABEL[p]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary !bg-ok hover:!bg-[#25633e]"
                    onClick={() => {
                      setStatus(appt.id, "completed", payment);
                      toast("Randevu tamamlandı, gelir kaydedildi");
                    }}
                  >
                    <CheckCheck size={16} aria-hidden /> Tamamlandı
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appt.status === "planned" && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStatus(appt.id, "confirmed")}>
                      <Check size={14} aria-hidden /> Onaylandı
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openApptForm({ ...appt })}>
                    <CalendarClock size={14} aria-hidden /> Ertele / taşı
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStatus(appt.id, "noshow")}>
                    <UserX size={14} aria-hidden /> Gelmedi
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setStatus(appt.id, "cancelled")}>
                    <XCircle size={14} aria-hidden /> İptal et
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStatus(appt.id, "confirmed")}>
                Yeniden aç (onaylandı)
              </button>
            )}
          </div>
        </div>
      </Drawer>
      <Confirm
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Randevu silinsin mi?"
        onConfirm={() => {
          remove(appt.id);
          close();
          toast("Randevu silindi");
        }}
      >
        Bu randevu kalıcı olarak silinir ve raporlardan çıkar. Müşteri gelmediyse silmek yerine “Gelmedi” ya da “İptal” olarak işaretleyin.
      </Confirm>
    </>
  );
}
