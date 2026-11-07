"use client";

import { ArrowRight, Cake, CalendarCheck, CheckCheck, HeartHandshake, MessageCircle, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { BarChart, Meter, RankBars } from "@/components/charts/BarChart";
import { Avatar, Card, Dot, Empty, PageHeader, Stat, StatusBadge, toast } from "@/components/ui";
import { SERIES } from "@/lib/constants";
import { DEFAULT_SETTINGS } from "@/lib/seed";
import { addDays, addMonths, diffDays, endOfMonth, endTime, formatDayMonth, formatDayShort, formatLong, startOfMonth, timeToMin } from "@/lib/dates";
import { change, money, percent, whatsappLink } from "@/lib/format";
import { useData, useLookup, useNow } from "@/lib/hooks";
import { apptsIn, byBranch, byService, byStaff, customerStats, isRevenue, lapsedCustomers, sum, summarize, upcomingBirthdays } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

function greeting(min: number) {
  if (min < 12 * 60) return "Günaydın";
  if (min < 18 * 60) return "İyi günler";
  return "İyi akşamlar";
}

export default function OverviewPage() {
  const { today, minutes } = useNow();
  const data = useData();
  const L = useLookup();
  const f = useStore((s) => s.branchFilter);
  const setStatus = useStore((s) => s.setAppointmentStatus);
  const openAppt = useUi((s) => s.openAppt);
  const openCustomer = useUi((s) => s.openCustomer);

  const m = useMemo(() => {
    const ms = startOfMonth(today);
    const pms = addMonths(ms, -1);
    const pme = [addMonths(today, -1), endOfMonth(pms)].sort()[0]!;
    const todayList = apptsIn(data, today, today, f).sort((a, b) => a.start.localeCompare(b.start));
    const month = summarize(data, ms, today, f);
    const prevMonth = summarize(data, pms, pme, f);
    const prevFull = summarize(data, pms, endOfMonth(pms), f);
    const stats = customerStats(data.appointments, today);
    const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
    const s14 = last14.map((d) => {
      const s = summarize(data, d, d, f);
      return { key: d, label: formatDayShort(d).replace(/\s.+$/, ""), title: formatDayShort(d), values: [s.income] };
    });
    return {
      todayList,
      month,
      prevMonth,
      prevFull,
      s14,
      branches: byBranch(data, ms, today),
      services: byService(data, ms, today, f),
      staffToday: byStaff(data, today, today, f),
      birthdays: upcomingBirthdays(data.customers, today, 14),
      lapsed: lapsedCustomers(data.customers, stats, today).filter(({ c }) => {
        if (f === "all") return true;
        const last = data.appointments.filter((a) => a.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
        return last?.branchId === f;
      }),
      stats,
    };
  }, [data, today, f]);

  const active = m.todayList.filter((a) => a.status !== "cancelled");
  const done = active.filter(isRevenue);
  const upcoming = active.filter((a) => (a.status === "planned" || a.status === "confirmed") && timeToMin(a.start) + a.durationMin > minutes);
  const next = upcoming[0];
  const todayEarned = sum(done, (a) => a.price);
  const todayExpected = sum(active.filter((a) => a.status !== "noshow"), (a) => a.price);
  const ownerName = data.settings.ownerName;

  return (
    <>
      <PageHeader
        title={ownerName && ownerName !== DEFAULT_SETTINGS.ownerName ? `${greeting(minutes)}, ${ownerName.split(" ")[0]}` : greeting(minutes)}
        sub={`${formatLong(today)} · ${f === "all" ? "Tüm şubeler" : (L.branches.get(f)?.name ?? "")}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Bugünkü randevular"
          value={active.length}
          icon={<CalendarCheck size={18} />}
          hint={next ? <>Sıradaki <strong className="num text-ink">{next.start}</strong> · {L.customers.get(next.customerId)?.name}</> : `${done.length} tamamlandı`}
        />
        <Stat label="Bugün tahsil edilen" value={money(todayEarned)} icon={<Wallet size={18} />} hint={<>Gün sonu beklenen <strong className="num text-ink">{money(todayExpected)}</strong></>} />
        <Stat label="Bu ay ciro" value={money(m.month.income)} icon={<TrendingUp size={18} />} delta={change(m.month.income, m.prevMonth.income)} hint="geçen ayın aynı günlerine göre" />
        <Stat
          label="Bu ay net kâr"
          value={money(m.month.net)}
          icon={<CheckCheck size={18} />}
          hint={<>Gider {money(m.month.expense)} · geçen ay {money(m.prevFull.net)}</>}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Bugünün akışı"
          sub={`${upcoming.length} randevu bekliyor · ${done.length} tamamlandı`}
          action={
            <Link href="/panel/randevular" className="btn btn-ghost btn-sm">
              Takvim <ArrowRight size={14} aria-hidden />
            </Link>
          }
          pad={false}
        >
          {m.todayList.length ? (
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {m.todayList.map((a) => {
                const c = L.customers.get(a.customerId);
                const s = L.staff.get(a.staffId);
                const b = L.branches.get(a.branchId);
                const now = timeToMin(a.start) <= minutes && minutes < timeToMin(a.start) + a.durationMin && a.status !== "cancelled";
                const canComplete = a.status === "planned" || a.status === "confirmed";
                return (
                  <li key={a.id} className={`flex items-center gap-3 px-5 py-3 ${now ? "bg-rose-50/60" : ""}`}>
                    <div className="w-[76px] shrink-0">
                      <p className="num text-[15px] font-bold">{a.start}</p>
                      <p className="num text-[12px] text-ink-3">{endTime(a.start, a.durationMin)}’e kadar</p>
                    </div>
                    <button type="button" onClick={() => openAppt(a.id)} className="min-w-0 flex-1 cursor-pointer text-left">
                      <p className="truncate font-semibold hover:text-rose-700">
                        {c?.name}
                        {now && <span className="ml-2 rounded-full bg-rose px-1.5 py-px text-[10.5px] font-bold text-white">ŞU AN</span>}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-[13px] text-ink-3">
                        {L.services.get(a.serviceId)?.name} · {s?.name.split(" ")[0]}
                        {f === "all" && b && (
                          <>
                            {" · "}
                            <Dot color={b.color} className="!size-2" /> {b.name}
                          </>
                        )}
                      </p>
                    </button>
                    <div className="hidden sm:block">
                      <StatusBadge status={a.status} />
                    </div>
                    {canComplete && timeToMin(a.start) <= minutes ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setStatus(a.id, "completed", "kart");
                          toast(`${c?.name.split(" ")[0]} — tamamlandı (kart)`);
                        }}
                      >
                        <CheckCheck size={14} aria-hidden /> <span className="hidden md:inline">Tamamlandı</span>
                      </button>
                    ) : (
                      <span className="num w-[72px] text-right text-[13.5px] font-semibold">{money(a.price)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty icon={<CalendarCheck size={20} />} title="Bugün randevu yok">Yeni randevu oluşturmak için üstteki düğmeyi kullanın.</Empty>
          )}
        </Card>

        {f === "all" ? (
          <Card title="Şube karşılaştırması" sub="Bu ay, bugüne kadar">
            <div className="flex flex-col gap-5">
              {m.branches.map(({ branch, income, net, appointments, occupancy }) => (
                <div key={branch.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold">
                      <Dot color={branch.color} /> {branch.name}
                    </span>
                    <span className="num font-bold">{money(income)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[12.5px]">
                    <div className="rounded-lg bg-sunk px-2.5 py-2">
                      <p className="text-ink-3">Randevu</p>
                      <p className="num font-bold">{appointments}</p>
                    </div>
                    <div className="rounded-lg bg-sunk px-2.5 py-2">
                      <p className="text-ink-3">Net</p>
                      <p className="num font-bold">{money(net)}</p>
                    </div>
                    <div className="rounded-lg bg-sunk px-2.5 py-2">
                      <p className="text-ink-3">Doluluk</p>
                      <p className="num font-bold">{percent(occupancy)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Meter value={occupancy} color={branch.color} label={`${branch.name} doluluk`} />
                  </div>
                </div>
              ))}
              <Link href="/panel/subeler" className="btn btn-secondary btn-sm self-start">
                Şube detayları <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </Card>
        ) : (
          <Card title="Bugün personel" sub="Doluluk ve randevu sayısı">
            <ul className="flex flex-col gap-4">
              {m.staffToday.map((p) => (
                <li key={p.staff.id}>
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <Avatar name={p.staff.name} color={p.staff.color} size={28} />
                    <span className="flex-1 truncate font-semibold">{p.staff.name}</span>
                    <span className="num text-[13px] text-ink-2">
                      {p.appointments} rnd. · {percent(p.occupancy)}
                    </span>
                  </div>
                  <Meter value={p.occupancy} color={p.staff.color} label={`${p.staff.name} doluluk`} />
                </li>
              ))}
              {!m.staffToday.length && <p className="text-[14px] text-ink-3">Bu şubede personel yok.</p>}
            </ul>
          </Card>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Son 14 gün ciro"
          sub="Günlük hizmet ve ürün geliri"
          action={
            <Link href="/panel/raporlar" className="btn btn-ghost btn-sm">
              Raporlar <ArrowRight size={14} aria-hidden />
            </Link>
          }
        >
          <BarChart data={m.s14} series={[{ name: "Gelir", color: SERIES[0] }]} formatFull={money} ariaLabel="Son 14 günün günlük ciro grafiği" />
        </Card>
        <Card title="Popüler hizmetler" sub="Bu ay, ciroya göre">
          <RankBars rows={m.services} format={money} sub={(r) => `${r.count} kez`} limit={6} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Yaklaşan doğum günleri" sub="Önümüzdeki 14 gün — küçük bir jest sadakati büyütür">
          {m.birthdays.length ? (
            <ul className="divide-y divide-line">
              {m.birthdays.slice(0, 6).map(({ c, date, inDays }) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose" aria-hidden>
                    <Cake size={17} />
                  </span>
                  <button type="button" className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => openCustomer(c.id)}>
                    <p className="truncate font-semibold hover:text-rose-700">{c.name}</p>
                    <p className="text-[12.5px] text-ink-3">{inDays === 0 ? "Bugün" : inDays === 1 ? "Yarın" : `${formatDayMonth(date)} · ${inDays} gün sonra`}</p>
                  </button>
                  <a className="btn btn-secondary btn-sm" href={whatsappLink(c.phone, `Doğum gününüz kutlu olsun ${c.name.split(" ")[0]}! Bu aya özel bakımınızda %15 indirim sizi bekliyor. — ${data.settings.studioName}`)} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} aria-hidden /> Kutla
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Yaklaşan doğum günü yok" />
          )}
        </Card>
        <Card title="Geri kazanılacak müşteriler" sub="45+ gündür gelmeyen, randevusu olmayanlar (harcamaya göre)" action={<Link href="/panel/musteriler" className="btn btn-ghost btn-sm">Tümü <ArrowRight size={14} aria-hidden /></Link>}>
          {m.lapsed.length ? (
            <ul className="divide-y divide-line">
              {m.lapsed.slice(0, 6).map(({ c, s }) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-warn-50 text-warn" aria-hidden>
                    <HeartHandshake size={17} />
                  </span>
                  <button type="button" className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => openCustomer(c.id)}>
                    <p className="truncate font-semibold hover:text-rose-700">{c.name}</p>
                    <p className="num text-[12.5px] text-ink-3">
                      {diffDays(s!.lastVisit!, today)} gün önce · toplam {money(s!.spend)}
                    </p>
                  </button>
                  <a className="btn btn-secondary btn-sm" href={whatsappLink(c.phone, `Merhaba ${c.name.split(" ")[0]}, sizi özledik! Yeni sezon renklerimizle randevunuzu bekliyoruz. — ${data.settings.studioName}`)} target="_blank" rel="noreferrer">
                    <MessageCircle size={14} aria-hidden /> Yaz
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Herkes düzenli geliyor">45 günden uzun süredir gelmeyen müşteri yok.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
