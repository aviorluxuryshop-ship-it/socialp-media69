"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCheck, ChevronLeft, ChevronRight, Coffee, MessageCircle, Phone, StickyNote, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Empty, Segmented, StatusBadge, toast } from "@/components/ui";
import { PAYMENT_LABEL } from "@/lib/constants";
import { addDays, endTime, formatDayMonth, formatDayShort, formatLong, formatWeekdayLong, formatWeekdayShort, minToTime, startOfMonth, startOfWeek, timeToMin, weekday } from "@/lib/dates";
import { minutesLabel, money, whatsappLink } from "@/lib/format";
import { useLookup, useNow } from "@/lib/hooks";
import { isRevenue, sum } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { Appointment, PaymentMethod } from "@/lib/types";

type View = "day" | "week";

export default function StaffHome() {
  const { today, minutes } = useNow();
  const session = useStore((s) => s.session);
  const staffId = session?.role === "staff" ? session.staffId : "";
  const me = useStore((s) => s.staff.find((x) => x.id === staffId))!;
  const branch = useStore((s) => s.branches.find((b) => b.id === me?.branchId));
  const all = useStore((s) => s.appointments);
  const L = useLookup();
  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState(today);

  const mine = useMemo(() => all.filter((a) => a.staffId === staffId && a.status !== "cancelled"), [all, staffId]);
  const byDay = (d: string) => mine.filter((a) => a.date === d).sort((a, b) => a.start.localeCompare(b.start));

  const ws = startOfWeek(date);
  const week = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const ms = startOfMonth(today);
  const monthDone = mine.filter((a) => a.date >= ms && a.date <= today && isRevenue(a));
  const monthRevenue = sum(monthDone, (a) => a.price);
  const todayList = byDay(today);
  const left = todayList.filter((a) => (a.status === "planned" || a.status === "confirmed") && timeToMin(a.start) + a.durationMin > minutes);

  if (!me) return null;
  const off = !me.workDays.includes(weekday(date));

  return (
    <>
      <div className="mb-5">
        <h1 className="display text-[34px]">Merhaba {me.name.split(" ")[0]}</h1>
        <p className="text-ink-2">
          {formatLong(today)} · {branch?.name}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Bugün", v: `${todayList.length} randevu`, h: left.length ? `${left.length} tanesi bekliyor` : "Gün tamamlandı" },
          { l: "Sıradaki", v: left[0] ? left[0].start : "—", h: left[0] ? L.customers.get(left[0].customerId)?.name : "Bugün başka randevu yok" },
          { l: "Bu hafta", v: `${week.reduce((s, d) => s + byDay(d).length, 0)} randevu`, h: `${formatDayShort(ws)} – ${formatDayShort(addDays(ws, 6))}` },
          { l: "Bu ay primim", v: money((monthRevenue * me.commissionRate) / 100), h: `${monthDone.length} tamamlanan · %${me.commissionRate}` },
        ].map((x) => (
          <div key={x.l} className="card px-4 py-3">
            <p className="text-[12.5px] font-semibold text-ink-3">{x.l}</p>
            <p className="num mt-0.5 truncate text-[20px] font-bold">{x.v}</p>
            <p className="truncate text-[12.5px] text-ink-3">{x.h}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented<View>
          label="Görünüm"
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Günlük" },
            { value: "week", label: "Haftalık" },
          ]}
        />
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => setDate(addDays(date, view === "day" ? -1 : -7))} aria-label={view === "day" ? "Önceki gün" : "Önceki hafta"}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setDate(today)}>
            Bugün
          </button>
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => setDate(addDays(date, view === "day" ? 1 : 7))} aria-label={view === "day" ? "Sonraki gün" : "Sonraki hafta"}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Hafta şeridi */}
      <div className="mb-4 grid grid-cols-7 gap-1.5" role="group" aria-label="Haftanın günleri">
        {week.map((d) => {
          const n = byDay(d).length;
          const on = view === "day" && d === date;
          const isOff = !me.workDays.includes(weekday(d));
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDate(d);
                setView("day");
              }}
              aria-pressed={on}
              className={clsx("flex cursor-pointer flex-col items-center rounded-xl border px-1 py-2 transition-colors", on ? "border-rose bg-rose-50" : "border-line bg-surface hover:bg-sunk")}
            >
              <span className={clsx("text-[11px] font-bold uppercase", d === today ? "text-rose-700" : "text-ink-3")}>{formatWeekdayShort(d)}</span>
              <span className="num text-[17px] font-bold">{Number(d.slice(8))}</span>
              <span className={clsx("num text-[11px]", isOff ? "text-ink-3" : n ? "font-semibold text-ink-2" : "text-ink-3")}>{isOff ? "izin" : `${n} rnd.`}</span>
            </button>
          );
        })}
      </div>

      {view === "day" ? (
        <section aria-label={`${formatLong(date)} programı`}>
          <h2 className="mb-3 text-[15px] font-bold">
            {date === today ? "Bugün" : formatWeekdayLong(date)}, {formatDayMonth(date)}
          </h2>
          <DayList list={byDay(date)} open={branch ? branch.openHour * 60 : 600} close={branch ? branch.closeHour * 60 : 1200} isToday={date === today} nowMin={minutes} off={off} L={L} />
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {week.map((d) => {
            const list = byDay(d);
            const isOff = !me.workDays.includes(weekday(d));
            return (
              <section key={d} className={clsx("card p-4", d === today && "!border-rose")}>
                <button type="button" className="mb-2 flex w-full cursor-pointer items-baseline justify-between text-left" onClick={() => { setDate(d); setView("day"); }}>
                  <span className="font-bold">{formatWeekdayLong(d)}</span>
                  <span className="num text-[13px] text-ink-3">{formatDayShort(d)}</span>
                </button>
                {isOff && !list.length ? (
                  <p className="text-[13.5px] text-ink-3">İzinli</p>
                ) : list.length ? (
                  <ul className="flex flex-col gap-1.5">
                    {list.map((a) => (
                      <li key={a.id} className="flex items-baseline gap-2 text-[13.5px]">
                        <span className="num w-[44px] shrink-0 font-bold">{a.start}</span>
                        <span className="min-w-0 flex-1 truncate">{L.customers.get(a.customerId)?.name}</span>
                        {a.status === "completed" && <CheckCheck size={13} className="shrink-0 text-ok" aria-label="Tamamlandı" />}
                        {a.status === "noshow" && <UserX size={13} className="shrink-0 text-warn" aria-label="Gelmedi" />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13.5px] text-ink-3">Randevu yok</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function DayList({ list, open, close, isToday, nowMin, off, L }: { list: Appointment[]; open: number; close: number; isToday: boolean; nowMin: number; off: boolean; L: ReturnType<typeof useLookup> }) {
  if (!list.length)
    return (
      <div className="card">
        <Empty icon={<Coffee size={20} />} title={off ? "Bugün izinlisiniz" : "Bu gün için randevu yok"}>
          {off ? "İyi dinlenmeler!" : "Yeni randevular yönetici tarafından eklendiğinde burada görünür."}
        </Empty>
      </div>
    );
  // Randevular arasındaki boşluklar da gösterilir (ara verme / ek randevu için).
  const items: ({ kind: "appt"; a: Appointment } | { kind: "gap"; from: number; to: number })[] = [];
  let cursor = open;
  for (const a of list) {
    const s = timeToMin(a.start);
    if (s - cursor >= 30) items.push({ kind: "gap", from: cursor, to: s });
    items.push({ kind: "appt", a });
    cursor = Math.max(cursor, s + a.durationMin);
  }
  if (close - cursor >= 30) items.push({ kind: "gap", from: cursor, to: close });

  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((it) =>
        it.kind === "gap" ? (
          <li key={`gap-${it.from}`} className="flex items-center gap-3 rounded-xl border border-dashed border-line-2 px-4 py-2 text-[13px] text-ink-3">
            <span className="num font-semibold">
              {minToTime(it.from)}–{minToTime(it.to)}
            </span>
            Boş · {minutesLabel(it.to - it.from)}
          </li>
        ) : (
          <ApptCard key={it.a.id} a={it.a} L={L} now={isToday && timeToMin(it.a.start) <= nowMin && nowMin < timeToMin(it.a.start) + it.a.durationMin} />
        ),
      )}
    </ol>
  );
}

function ApptCard({ a, L, now }: { a: Appointment; L: ReturnType<typeof useLookup>; now: boolean }) {
  const setStatus = useStore((s) => s.setAppointmentStatus);
  const [paying, setPaying] = useState(false);
  const c = L.customers.get(a.customerId);
  const svc = L.services.get(a.serviceId);
  const open = a.status === "planned" || a.status === "confirmed";
  return (
    <li className={clsx("card overflow-hidden", now && "!border-rose ring-2 ring-rose/15")}>
      <div className="flex gap-4 p-4">
        <div className="w-[64px] shrink-0">
          <p className="num text-[19px] font-bold leading-none">{a.start}</p>
          <p className="num mt-1 text-[12.5px] text-ink-3">{endTime(a.start, a.durationMin)}</p>
          {now && <span className="mt-2 inline-block rounded-full bg-rose px-1.5 py-px text-[10.5px] font-bold text-white">ŞU AN</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold">{c?.name ?? "Müşteri"}</p>
              <p className="text-[13.5px] text-ink-2">
                {svc?.name} · {minutesLabel(a.durationMin)}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          {c?.allergies && (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-warn-50 px-2.5 py-1.5 text-[13px] font-semibold text-warn">
              <AlertTriangle size={14} aria-hidden /> {c.allergies}
            </p>
          )}
          {(c?.notes || a.note) && (
            <p className="mt-2 flex items-start gap-1.5 text-[13px] text-ink-2">
              <StickyNote size={14} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
              <span>{[a.note, c?.notes].filter(Boolean).join(" · ")}</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {c && (
              <>
                <a className="btn btn-secondary btn-sm" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                  <Phone size={14} aria-hidden /> Ara
                </a>
                <a className="btn btn-secondary btn-sm" href={whatsappLink(c.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle size={14} aria-hidden /> WhatsApp
                </a>
              </>
            )}
            {open && !paying && (
              <>
                <button type="button" className="btn btn-primary btn-sm !bg-ok hover:!bg-[#25633e]" onClick={() => setPaying(true)}>
                  <CheckCheck size={14} aria-hidden /> Tamamlandı
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setStatus(a.id, "noshow");
                    toast("Gelmedi olarak işaretlendi");
                  }}
                >
                  <UserX size={14} aria-hidden /> Gelmedi
                </button>
              </>
            )}
          </div>
          {paying && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-ok-50 p-2.5" role="group" aria-label="Ödeme yöntemi">
              <span className="px-1 text-[13px] font-semibold text-ok">Ödeme:</span>
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setStatus(a.id, "completed", p);
                    setPaying(false);
                    toast(`Tamamlandı · ${PAYMENT_LABEL[p]} · ${money(a.price)}`);
                  }}
                >
                  {PAYMENT_LABEL[p]}
                </button>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPaying(false)}>
                Vazgeç
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
