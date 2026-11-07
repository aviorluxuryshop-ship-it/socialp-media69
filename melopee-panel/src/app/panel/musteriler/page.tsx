"use client";

import { AlertTriangle, Download, Search, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Avatar, Empty, PageHeader, Segmented, Stat, Tag } from "@/components/ui";
import { LAPSED_DAYS } from "@/lib/constants";
import { download, toCsv } from "@/lib/csv";
import { diffDays, formatDayShort, startOfMonth } from "@/lib/dates";
import { money, normalizeSearch } from "@/lib/format";
import { useLookup, useNow } from "@/lib/hooks";
import { customerStats, type CustomerStat } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

type Seg = "all" | "vip" | "new" | "lapsed" | "birthday";
type Sort = "last" | "spend" | "visits" | "name";

export default function CustomersPage() {
  const { today } = useNow();
  const customers = useStore((s) => s.customers);
  const appointments = useStore((s) => s.appointments);
  const f = useStore((s) => s.branchFilter);
  const openCustomer = useUi((s) => s.openCustomer);
  const L = useLookup();
  const [seg, setSeg] = useState<Seg>("all");
  const [sort, setSort] = useState<Sort>("last");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => customerStats(appointments, today), [appointments, today]);
  const inBranch = useMemo(() => {
    if (f === "all") return null;
    return new Set(appointments.filter((a) => a.branchId === f).map((a) => a.customerId));
  }, [appointments, f]);

  const ms = startOfMonth(today);
  const month = today.slice(5, 7);
  const empty: CustomerStat = { visits: 0, spend: 0, lastVisit: null, nextVisit: null, firstVisit: null, noshows: 0 };
  const isLapsed = (s: CustomerStat) => !!s.lastVisit && !s.nextVisit && diffDays(s.lastVisit, today) >= LAPSED_DAYS;
  const isNew = (s: CustomerStat, created: string) => (s.firstVisit ?? created) >= ms;

  const base = useMemo(() => customers.filter((c) => !inBranch || inBranch.has(c.id)), [customers, inBranch]);
  const counts = useMemo(() => {
    const st = (id: string) => stats.get(id) ?? empty;
    return {
      all: base.length,
      vip: base.filter((c) => c.vip).length,
      new: base.filter((c) => isNew(st(c.id), c.createdAt)).length,
      lapsed: base.filter((c) => isLapsed(st(c.id))).length,
      birthday: base.filter((c) => c.birthday.startsWith(month)).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, stats, month, ms]);

  const rows = useMemo(() => {
    const nq = normalizeSearch(q);
    const qd = q.replace(/\D/g, "");
    const st = (id: string) => stats.get(id) ?? empty;
    return base
      .filter((c) => {
        const s = st(c.id);
        if (seg === "vip" && !c.vip) return false;
        if (seg === "new" && !isNew(s, c.createdAt)) return false;
        if (seg === "lapsed" && !isLapsed(s)) return false;
        if (seg === "birthday" && !c.birthday.startsWith(month)) return false;
        if (!nq) return true;
        return normalizeSearch(c.name).includes(nq) || (qd.length >= 3 && c.phone.replace(/\D/g, "").includes(qd));
      })
      .map((c) => ({ c, s: st(c.id) }))
      .sort((a, b) => {
        if (sort === "name") return a.c.name.localeCompare(b.c.name, "tr");
        if (sort === "spend") return b.s.spend - a.s.spend;
        if (sort === "visits") return b.s.visits - a.s.visits;
        return (b.s.lastVisit ?? "").localeCompare(a.s.lastVisit ?? "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, stats, seg, q, sort, month]);

  const totalSpend = rows.reduce((x, r) => x + r.s.spend, 0);

  function exportCsv() {
    download(
      `musteriler-${today}.csv`,
      toCsv(
        ["Ad soyad", "Telefon", "E-posta", "Doğum günü", "VIP", "Kaynak", "Ziyaret", "Toplam harcama", "Son ziyaret", "Sonraki randevu", "Tercih ettiği personel", "Alerji", "Not"],
        rows.map(({ c, s }) => [c.name, c.phone, c.email, c.birthday, c.vip ? "Evet" : "", c.source, s.visits, s.spend, s.lastVisit ?? "", s.nextVisit ?? "", c.preferredStaffId ? L.staff.get(c.preferredStaffId)?.name : "", c.allergies, c.notes]),
      ),
    );
  }

  return (
    <>
      <PageHeader
        title="Müşteriler"
        sub={f === "all" ? "Tüm şubelerin müşterileri" : `${L.branches.get(f)?.name} şubesine gelmiş müşteriler`}
        actions={
          <>
            <button type="button" data-export className="btn btn-secondary" onClick={exportCsv} disabled={!rows.length}>
              <Download size={16} aria-hidden /> CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <UserPlus size={16} aria-hidden /> Yeni müşteri
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Toplam müşteri" value={counts.all} />
        <Stat label="Bu ay yeni" value={counts.new} />
        <Stat label="VIP" value={counts.vip} />
        <Stat label={`${LAPSED_DAYS}+ gündür gelmeyen`} value={counts.lapsed} hint="Geri kazanım için WhatsApp’tan yazın" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-3 lg:flex-row lg:items-center">
          <div className="overflow-x-auto">
            <Segmented<Seg>
              label="Müşteri grubu"
              size="sm"
              value={seg}
              onChange={(v) => {
                setSeg(v);
                setLimit(50);
              }}
              options={[
                { value: "all", label: `Tümü (${counts.all})` },
                { value: "vip", label: `VIP (${counts.vip})` },
                { value: "new", label: `Yeni (${counts.new})` },
                { value: "lapsed", label: `Geri kazanım (${counts.lapsed})` },
                { value: "birthday", label: `Bu ay doğum günü (${counts.birthday})` },
              ]}
            />
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative min-w-[200px] flex-1 lg:max-w-[300px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden />
              <input className="input !pl-9" placeholder="Ad veya telefon" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Müşteri ara" />
            </div>
            <select className="input !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sıralama">
              <option value="last">Son ziyarete göre</option>
              <option value="spend">Harcamaya göre</option>
              <option value="visits">Ziyaret sayısına göre</option>
              <option value="name">Ada göre</option>
            </select>
          </div>
        </div>

        {rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th>Son ziyaret</th>
                    <th className="!text-right">Ziyaret</th>
                    <th className="!text-right">Harcama</th>
                    <th>Sonraki randevu</th>
                    <th>Tercih ettiği</th>
                    <th>Etiketler</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, limit).map(({ c, s }) => {
                    const pref = c.preferredStaffId ? L.staff.get(c.preferredStaffId) : undefined;
                    const days = s.lastVisit ? diffDays(s.lastVisit, today) : null;
                    return (
                      <tr key={c.id} className="row-link" onClick={() => openCustomer(c.id)}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size={32} color="#b84c36" />
                            <div className="min-w-0">
                              <button type="button" className="cursor-pointer truncate font-semibold hover:text-rose-700 hover:underline" onClick={(e) => { e.stopPropagation(); openCustomer(c.id); }}>
                                {c.name}
                              </button>
                              <p className="num text-[12.5px] text-ink-3">{c.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="num whitespace-nowrap">
                          {s.lastVisit ? (
                            <>
                              {formatDayShort(s.lastVisit)}
                              <span className="ml-1.5 text-[12.5px] text-ink-3">{days === 0 ? "bugün" : `${days} gün`}</span>
                            </>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </td>
                        <td className="num text-right">{s.visits}</td>
                        <td className="num whitespace-nowrap text-right font-semibold">{money(s.spend)}</td>
                        <td className="num whitespace-nowrap">{s.nextVisit ? formatDayShort(s.nextVisit) : <span className="text-ink-3">—</span>}</td>
                        <td className="whitespace-nowrap">
                          {pref ? (
                            <span className="flex items-center gap-1.5">
                              <Avatar name={pref.name} color={pref.color} size={20} /> {pref.name.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {c.vip && <Tag tone="gold">VIP</Tag>}
                            {isLapsed(s) && <Tag tone="warn">Geri kazanım</Tag>}
                            {isNew(s, c.createdAt) && <Tag tone="info">Yeni</Tag>}
                            {c.allergies && (
                              <Tag tone="warn">
                                <AlertTriangle size={11} aria-hidden /> Alerji
                              </Tag>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[13px] text-ink-3">
              <span className="num">
                {Math.min(limit, rows.length)} / {rows.length} müşteri · toplam harcama {money(totalSpend)}
              </span>
              {rows.length > limit && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLimit((l) => l + 50)}>
                  Daha fazla göster
                </button>
              )}
            </div>
          </>
        ) : (
          <Empty icon={<Users size={20} />} title="Müşteri bulunamadı">
            Aramayı ya da filtreyi değiştirin.
          </Empty>
        )}
      </div>

      {creating && <CustomerForm onClose={() => setCreating(false)} onSaved={(id) => openCustomer(id)} />}
    </>
  );
}
