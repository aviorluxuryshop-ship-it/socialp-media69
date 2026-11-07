"use client";

import { AlertTriangle, Cake, CalendarPlus, MessageCircle, Pencil, Phone, StickyNote, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Confirm, Drawer, Empty, StatusBadge, Tag, toast } from "@/components/ui";
import { diffDays, formatDayMonth, formatDayShort, parseKey } from "@/lib/dates";
import { money, whatsappLink } from "@/lib/format";
import { useLookup, useNow, type Lookup } from "@/lib/hooks";
import type { Appointment } from "@/lib/types";
import { customerStats } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { CustomerForm } from "./CustomerForm";

export function CustomerDrawer() {
  const id = useUi((s) => s.customerDetail);
  const openCustomer = useUi((s) => s.openCustomer);
  const openAppt = useUi((s) => s.openAppt);
  const openApptForm = useUi((s) => s.openApptForm);
  const customer = useStore((s) => s.customers.find((c) => c.id === id));
  const allAppts = useStore((s) => s.appointments);
  const remove = useStore((s) => s.deleteCustomer);
  const L = useLookup();
  const { today } = useNow();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const appts = useMemo(
    () => allAppts.filter((a) => a.customerId === id).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)),
    [allAppts, id],
  );
  const stat = useMemo(() => (id ? customerStats(appts, today).get(id) : undefined), [appts, id, today]);

  if (!id || !customer) return null;
  const close = () => openCustomer(null);
  const pref = customer.preferredStaffId ? L.staff.get(customer.preferredStaffId) : undefined;
  const upcoming = appts.filter((a) => a.date >= today && (a.status === "planned" || a.status === "confirmed")).reverse();
  const past = appts.filter((a) => !upcoming.includes(a));
  const favService = (() => {
    const m = new Map<string, number>();
    for (const a of appts) if (a.status === "completed") m.set(a.serviceId, (m.get(a.serviceId) ?? 0) + 1);
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? L.services.get(top[0])?.name : undefined;
  })();
  const lastBranch = appts[0]?.branchId;

  return (
    <>
      <Drawer
        open
        onClose={close}
        width={560}
        title={
          <div className="flex items-center gap-3">
            <Avatar name={customer.name} size={46} color="#a3486a" />
            <div className="min-w-0">
              <p className="display truncate text-[26px]">{customer.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {customer.vip && <Tag tone="gold">VIP</Tag>}
                <Tag>{customer.source}</Tag>
                {stat?.lastVisit && diffDays(stat.lastVisit, today) >= 45 && !stat.nextVisit && <Tag tone="warn">Uzun süredir gelmedi</Tag>}
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <button type="button" className="btn btn-primary" onClick={() => openApptForm({ customerId: customer.id, branchId: lastBranch, staffId: customer.preferredStaffId ?? undefined })}>
              <CalendarPlus size={16} aria-hidden /> Randevu oluştur
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} aria-hidden /> Düzenle
            </button>
            <button type="button" className="btn btn-danger btn-icon ml-auto" onClick={() => setConfirmDel(true)} aria-label="Müşteriyi sil">
              <Trash2 size={16} />
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-secondary btn-sm" href={`tel:${customer.phone.replace(/\s/g, "")}`}>
              <Phone size={14} aria-hidden /> <span className="num">{customer.phone}</span>
            </a>
            <a className="btn btn-secondary btn-sm" href={whatsappLink(customer.phone)} target="_blank" rel="noreferrer">
              <MessageCircle size={14} aria-hidden /> WhatsApp
            </a>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "Ziyaret", v: String(stat?.visits ?? 0) },
              { l: "Toplam harcama", v: money(stat?.spend ?? 0) },
              { l: "Ortalama", v: money(stat?.visits ? stat.spend / stat.visits : 0) },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-sunk px-3 py-2.5">
                <p className="text-[12px] font-semibold text-ink-3">{x.l}</p>
                <p className="num mt-0.5 text-[17px] font-bold">{x.v}</p>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2.5 text-[14px]">
            <dt className="text-ink-3">Son ziyaret</dt>
            <dd className="font-semibold">{stat?.lastVisit ? `${formatDayMonth(stat.lastVisit)} ${stat.lastVisit.slice(0, 4)} · ${diffDays(stat.lastVisit, today)} gün önce` : "—"}</dd>
            <dt className="text-ink-3">Sık aldığı hizmet</dt>
            <dd className="font-semibold">{favService ?? "—"}</dd>
            <dt className="text-ink-3">Tercih ettiği</dt>
            <dd className="flex items-center gap-2 font-semibold">{pref ? <><Avatar name={pref.name} color={pref.color} size={20} /> {pref.name}</> : "Fark etmez"}</dd>
            <dt className="text-ink-3">Doğum günü</dt>
            <dd className="flex items-center gap-1.5 font-semibold">
              {customer.birthday ? (
                <>
                  <Cake size={15} className="text-rose" aria-hidden /> {formatDayMonth(`2000-${customer.birthday}`)}
                </>
              ) : (
                "—"
              )}
            </dd>
            {customer.email && (
              <>
                <dt className="text-ink-3">E-posta</dt>
                <dd className="truncate font-semibold">{customer.email}</dd>
              </>
            )}
            <dt className="text-ink-3">Kayıt</dt>
            <dd className="font-semibold">{formatDayMonth(customer.createdAt)} {customer.createdAt.slice(0, 4)}</dd>
            {!!stat?.noshows && (
              <>
                <dt className="text-ink-3">Gelmediği</dt>
                <dd className="font-semibold text-warn">{stat.noshows} randevu</dd>
              </>
            )}
          </dl>

          {customer.allergies && (
            <p className="flex items-center gap-2 rounded-xl bg-warn-50 px-3.5 py-2.5 text-[14px] font-semibold text-warn">
              <AlertTriangle size={16} aria-hidden /> {customer.allergies}
            </p>
          )}
          {customer.notes && (
            <p className="flex items-start gap-2 rounded-xl border border-line px-3.5 py-2.5 text-[14px] text-ink-2">
              <StickyNote size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden /> {customer.notes}
            </p>
          )}

          <section>
            <p className="eyebrow mb-2">Yaklaşan randevular</p>
            {upcoming.length ? <ApptList list={upcoming} onOpen={openAppt} L={L} today={today} /> : <p className="text-[14px] text-ink-3">Planlanmış randevu yok.</p>}
          </section>
          <section>
            <p className="eyebrow mb-2">Geçmiş ({past.length})</p>
            {past.length ? <ApptList list={past.slice(0, 30)} onOpen={openAppt} L={L} today={today} /> : <Empty title="Henüz ziyaret yok" />}
          </section>
        </div>
      </Drawer>
      {editing && <CustomerForm customer={customer} onClose={() => setEditing(false)} />}
      <Confirm
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Müşteri silinsin mi?"
        onConfirm={() => {
          remove(customer.id);
          close();
          toast("Müşteri silindi");
        }}
      >
        {customer.name} ve <strong>tüm randevu geçmişi ({appts.length})</strong> kalıcı olarak silinir; geçmiş ciro raporlardan düşer.
      </Confirm>
    </>
  );
}

function ApptList({ list, onOpen, L, today }: { list: Appointment[]; onOpen: (id: string) => void; L: Lookup; today: string }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {list.map((a) => {
        const s = L.staff.get(a.staffId);
        return (
          <li key={a.id}>
            <button type="button" onClick={() => onOpen(a.id)} className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-sunk">
              <div className="w-[64px] shrink-0">
                <p className="num text-[13.5px] font-bold">{formatDayShort(a.date)}</p>
                <p className="num text-[12px] text-ink-3">
                  {parseKey(a.date).getFullYear() !== parseKey(today).getFullYear() ? a.date.slice(0, 4) + " · " : ""}
                  {a.start}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{L.services.get(a.serviceId)?.name ?? "Hizmet"}</p>
                <p className="truncate text-[12.5px] text-ink-3">{s?.name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="num text-[13.5px] font-semibold">{money(a.price)}</span>
                <StatusBadge status={a.status} size="sm" />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
