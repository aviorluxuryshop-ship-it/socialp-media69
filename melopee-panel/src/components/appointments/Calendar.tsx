"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCheck, UserX } from "lucide-react";
import { useMemo } from "react";
import { Avatar } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/constants";
import { addDays, daysBetween, endTime, formatDayShort, formatWeekdayShort, minToTime, timeToMin, weekday } from "@/lib/dates";
import type { Lookup } from "@/lib/hooks";
import type { Appointment, Branch, Staff } from "@/lib/types";

const PX_PER_MIN = 1.3;
const HEADER = 56;

function tint(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function hoursRange(branches: Branch[]) {
  const open = Math.min(...branches.map((b) => b.openHour), 24);
  const close = Math.max(...branches.map((b) => b.closeHour), 0);
  return open < close ? { open, close } : { open: 10, close: 20 };
}

function TimeGutter({ open, close }: { open: number; close: number }) {
  return (
    <div className="sticky left-0 z-20 w-[56px] shrink-0 border-r border-line bg-surface">
      <div style={{ height: HEADER }} className="border-b border-line" />
      <div className="relative" style={{ height: (close - open) * 60 * PX_PER_MIN }}>
        {Array.from({ length: close - open }, (_, i) => (
          <span key={i} className="num absolute right-2 -translate-y-1/2 text-[11.5px] font-semibold text-ink-3" style={{ top: i * 60 * PX_PER_MIN }}>
            {i === 0 ? "" : `${String(open + i).padStart(2, "0")}:00`}
          </span>
        ))}
      </div>
    </div>
  );
}

function HourLines({ open, close, slot }: { open: number; close: number; slot: number }) {
  const n = ((close - open) * 60) / slot;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className={clsx("pointer-events-none absolute inset-x-0 border-t", (i * slot) % 60 === 0 ? "border-line" : "border-dashed border-[#f1ebe5]")}
          style={{ top: i * slot * PX_PER_MIN }}
        />
      ))}
    </>
  );
}

function NowLine({ open, close, minutes }: { open: number; close: number; minutes: number }) {
  if (minutes < open * 60 || minutes > close * 60) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: (minutes - open * 60) * PX_PER_MIN }}>
      <span className="-ml-1 size-2 rounded-full bg-rose" />
      <span className="h-px flex-1 bg-rose" />
    </div>
  );
}

/** Blok: renk personelden gelir; durum ikon + metinle, iptal/gelmedi ayrıca çizgili dokuyla gösterilir. */
function Block({ a, L, color, style, compact, onOpen }: { a: Appointment; L: Lookup; color: string; style: React.CSSProperties; compact?: boolean; onOpen: (id: string) => void }) {
  const c = L.customers.get(a.customerId);
  const svc = L.services.get(a.serviceId);
  const dead = a.status === "cancelled" || a.status === "noshow";
  const short = a.durationMin < 45;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(a.id);
      }}
      className={clsx(
        "group absolute z-[5] cursor-pointer overflow-hidden rounded-[9px] border text-left transition-shadow hover:z-[15] hover:shadow-[var(--shadow-pop)] focus-visible:z-[15]",
        dead && "hatch",
      )}
      style={{
        ...style,
        background: dead ? "#faf8f6" : tint(color, 0.1),
        borderColor: dead ? "#e2d9d2" : tint(color, 0.35),
        borderLeft: `3px solid ${dead ? "#b5a9ad" : color}`,
      }}
      aria-label={`${a.start}–${endTime(a.start, a.durationMin)}, ${c?.name ?? "Müşteri"}, ${svc?.name ?? ""}, ${STATUS_LABEL[a.status]}`}
    >
      <div className={clsx("flex h-full flex-col", compact ? "px-1.5" : "px-2", short ? "justify-center py-0.5" : "py-1.5")}>
        <div className="flex items-center gap-1">
          <span className={clsx("num text-[11px] font-bold", dead ? "text-ink-3" : "text-ink-2")}>
            {a.start}
            {!short && !compact && `–${endTime(a.start, a.durationMin)}`}
          </span>
          {a.status === "completed" && <CheckCheck size={12} className="text-ok" aria-hidden />}
          {a.status === "noshow" && <UserX size={12} className="text-warn" aria-hidden />}
          {c?.allergies && !dead && <AlertTriangle size={11} className="text-warn" aria-hidden />}
        </div>
        <p className={clsx("truncate text-[12.5px] font-bold leading-tight", dead ? "text-ink-3 line-through" : "text-ink")}>{(compact ? c?.name.split(" ")[0] : c?.name) ?? "Müşteri"}</p>
        {!short && !compact && <p className="truncate text-[11.5px] leading-tight text-ink-2">{svc?.name}</p>}
      </div>
    </button>
  );
}

/* ───────── Günlük: personel sütunları ───────── */

export function DayGrid({
  date,
  staff,
  branches,
  appointments,
  L,
  slot,
  nowMin,
  isToday,
  onOpen,
  onCreate,
}: {
  date: string;
  staff: Staff[];
  branches: Branch[];
  appointments: Appointment[];
  L: Lookup;
  slot: number;
  nowMin: number;
  isToday: boolean;
  onOpen: (id: string) => void;
  onCreate: (staff: Staff, start: string) => void;
}) {
  const { open, close } = hoursRange(branches);
  const height = (close - open) * 60 * PX_PER_MIN;
  const wd = weekday(date);
  const multiBranch = new Set(staff.map((s) => s.branchId)).size > 1;

  return (
    <div className="card overflow-hidden">
      <div className="flex max-h-[calc(100dvh-230px)] min-h-[420px] overflow-auto">
        <TimeGutter open={open} close={close} />
        <div className="flex flex-1">
          {staff.map((s, i) => {
            const b = branches.find((x) => x.id === s.branchId)!;
            const off = !s.workDays.includes(wd) || !s.active;
            const mine = appointments.filter((a) => a.staffId === s.id);
            const newBranch = multiBranch && i > 0 && staff[i - 1]!.branchId !== s.branchId;
            return (
              <div key={s.id} className={clsx("relative min-w-[150px] flex-1 border-r border-line last:border-r-0", newBranch && "border-l-2 border-l-line-2")}>
                <div className="sticky top-0 z-[12] flex items-center gap-2 border-b border-line bg-surface px-3" style={{ height: HEADER }}>
                  <Avatar name={s.name} color={s.color} size={28} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold">{s.name}</p>
                    <p className="flex items-center gap-1.5 truncate text-[11.5px] text-ink-3">
                      {multiBranch && <span aria-label={b.name} title={b.name} className="inline-block size-2 shrink-0 rounded-full" style={{ background: b.color }} />}
                      {off ? "İzinli" : `${mine.filter((a) => a.status !== "cancelled").length} randevu`}
                    </p>
                  </div>
                </div>
                <div className={clsx("relative", off && "hatch")} style={{ height }}>
                  <HourLines open={open} close={close} slot={slot} />
                  {/* Şube kapalı saatleri */}
                  {b.openHour > open && <div aria-hidden className="hatch absolute inset-x-0 top-0" style={{ height: (b.openHour - open) * 60 * PX_PER_MIN }} />}
                  {b.closeHour < close && <div aria-hidden className="hatch absolute inset-x-0 bottom-0" style={{ height: (close - b.closeHour) * 60 * PX_PER_MIN }} />}
                  {/* Boş aralığa tıklayınca yeni randevu */}
                  {!off &&
                    Array.from({ length: ((b.closeHour - b.openHour) * 60) / slot }, (_, k) => {
                      const m = b.openHour * 60 + k * slot;
                      return (
                        <button
                          key={k}
                          type="button"
                          tabIndex={-1}
                          className="absolute inset-x-0 cursor-pointer hover:bg-rose-50/70"
                          style={{ top: (m - open * 60) * PX_PER_MIN, height: slot * PX_PER_MIN }}
                          onClick={() => onCreate(s, minToTime(m))}
                          aria-label={`${s.name}, ${minToTime(m)} için yeni randevu`}
                        />
                      );
                    })}
                  {mine.map((a) => (
                    <Block
                      key={a.id}
                      a={a}
                      L={L}
                      color={s.color}
                      onOpen={onOpen}
                      style={{ top: (timeToMin(a.start) - open * 60) * PX_PER_MIN + 1, height: a.durationMin * PX_PER_MIN - 2, left: 4, right: 4 }}
                    />
                  ))}
                  {isToday && <NowLine open={open} close={close} minutes={nowMin} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── Haftalık: gün sütunları, çakışanlar yan yana ───────── */

function layoutLanes(list: Appointment[]) {
  const sorted = [...list].sort((a, b) => timeToMin(a.start) - timeToMin(b.start) || b.durationMin - a.durationMin);
  const out = new Map<string, { lane: number; lanes: number }>();
  let cluster: Appointment[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => {
    const lanes = laneEnds.length;
    for (const a of cluster) out.set(a.id, { ...out.get(a.id)!, lanes });
    cluster = [];
    laneEnds = [];
  };
  for (const a of sorted) {
    const s = timeToMin(a.start);
    const e = s + a.durationMin;
    if (s >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e);
    } else laneEnds[lane] = e;
    out.set(a.id, { lane, lanes: 1 });
    cluster.push(a);
    clusterEnd = Math.max(clusterEnd, e);
  }
  if (cluster.length) flush();
  return out;
}

export function WeekGrid({
  start,
  staffOrder,
  branches,
  appointments,
  L,
  slot,
  nowMin,
  today,
  onOpen,
  onPickDay,
}: {
  start: string;
  /** En fazla 4 personel varsa her personel kendi sabit şeridinde gösterilir. */
  staffOrder?: string[];
  branches: Branch[];
  appointments: Appointment[];
  L: Lookup;
  slot: number;
  nowMin: number;
  today: string;
  onOpen: (id: string) => void;
  onPickDay: (d: string) => void;
}) {
  const { open, close } = hoursRange(branches);
  const height = (close - open) * 60 * PX_PER_MIN;
  const days = useMemo(() => daysBetween(start, addDays(start, 6)), [start]);
  const fixed = staffOrder && staffOrder.length > 1 && staffOrder.length <= 4 ? staffOrder : null;
  const lanesByDay = useMemo(() => {
    const m = new Map<string, Map<string, { lane: number; lanes: number }>>();
    for (const d of days) {
      const list = appointments.filter((a) => a.date === d);
      m.set(d, fixed ? new Map(list.map((a) => [a.id, { lane: Math.max(0, fixed.indexOf(a.staffId)), lanes: fixed.length }])) : layoutLanes(list));
    }
    return m;
  }, [appointments, days, fixed]);

  return (
    <div className="card overflow-hidden">
      <div className="flex max-h-[calc(100dvh-230px)] min-h-[420px] overflow-auto">
        <TimeGutter open={open} close={close} />
        <div className="flex flex-1">
          {days.map((d) => {
            const list = appointments.filter((a) => a.date === d);
            const lanes = lanesByDay.get(d)!;
            const isToday = d === today;
            return (
              <div key={d} className={clsx("relative flex-1 border-r border-line last:border-r-0", fixed && fixed.length > 2 ? "min-w-[170px]" : "min-w-[132px]")}>
                <button
                  type="button"
                  onClick={() => onPickDay(d)}
                  className={clsx("sticky top-0 z-[12] flex w-full cursor-pointer flex-col justify-center border-b border-line px-3 text-left hover:bg-sunk", isToday ? "bg-rose-50" : "bg-surface")}
                  style={{ height: HEADER }}
                  aria-label={`${formatDayShort(d)} gününü aç`}
                >
                  <span className={clsx("text-[12px] font-bold uppercase tracking-wide", isToday ? "text-rose-700" : "text-ink-3")}>{formatWeekdayShort(d)}</span>
                  <span className="num flex items-baseline gap-1.5 text-[15px] font-bold">
                    {formatDayShort(d)}
                    <span className="text-[11.5px] font-semibold text-ink-3">{list.filter((a) => a.status !== "cancelled").length} rnd.</span>
                  </span>
                </button>
                <div className="relative" style={{ height }}>
                  <HourLines open={open} close={close} slot={60} />
                  {list.map((a) => {
                    const pos = lanes.get(a.id) ?? { lane: 0, lanes: 1 };
                    const w = 100 / pos.lanes;
                    const s = L.staff.get(a.staffId);
                    return (
                      <Block
                        key={a.id}
                        a={a}
                        L={L}
                        compact
                        color={s?.color ?? "#756870"}
                        onOpen={onOpen}
                        style={{
                          top: (timeToMin(a.start) - open * 60) * PX_PER_MIN + 1,
                          height: a.durationMin * PX_PER_MIN - 2,
                          left: `calc(${pos.lane * w}% + 2px)`,
                          width: `calc(${w}% - 4px)`,
                        }}
                      />
                    );
                  })}
                  {isToday && <NowLine open={open} close={close} minutes={nowMin} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <span className="sr-only">Adım: {slot} dakika</span>
    </div>
  );
}

/** Haftalık görünümde renk anahtarı: personel (≥2 seri olduğu için her zaman gösterilir). */
export function StaffLegend({ staff }: { staff: Staff[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-semibold text-ink-2" aria-label="Personel renkleri">
      {staff.map((s) => (
        <li key={s.id} className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-[3px]" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="hatch inline-block h-3 w-3 rounded-[3px] border border-line-2" />
        İptal / gelmedi
      </li>
    </ul>
  );
}

