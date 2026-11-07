"use client";

import clsx from "clsx";
import { Download, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { RankBars } from "@/components/charts/BarChart";
import { PeriodNav } from "@/components/PeriodNav";
import { Card, Confirm, Dot, Empty, Field, Modal, PageHeader, Segmented, Stat, toast } from "@/components/ui";
import { PAYMENT_LABEL, SERIES } from "@/lib/constants";
import { download, toCsv } from "@/lib/csv";
import { comparable, daysBetween, formatDayShort, formatWeekdayShort, periodOf, type Period } from "@/lib/dates";
import { change, money, percent } from "@/lib/format";
import { useData, useLookup, useNow } from "@/lib/hooks";
import { apptsIn, byExpenseCategory, byPayment, isRevenue, summarize, sum, txIn } from "@/lib/stats";
import { useStore } from "@/lib/store";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type PaymentMethod, type Transaction, type TxType } from "@/lib/types";

type Tab = "all" | "income" | "expense";

interface Line {
  id: string;
  date: string;
  type: TxType;
  category: string;
  note: string;
  branchId: string;
  payment: string;
  amount: number;
  tx?: Transaction;
}

export default function FinancePage() {
  const { today } = useNow();
  const data = useData();
  const L = useLookup();
  const f = useStore((s) => s.branchFilter);
  const del = useStore((s) => s.deleteTransaction);
  const [period, setPeriod] = useState<Period>(() => periodOf("month", today));
  const [tab, setTab] = useState<Tab>("all");
  const [form, setForm] = useState<Partial<Transaction> | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const cmp = useMemo(() => comparable(period, today), [period, today]);
  const s = useMemo(() => summarize(data, period.start, period.end, f), [data, period, f]);
  const prev = useMemo(() => summarize(data, cmp.prev.start, cmp.prev.end, f), [data, cmp, f]);
  const expenses = useMemo(() => byExpenseCategory(data, period.start, period.end, f), [data, period, f]);
  const pay = useMemo(() => byPayment(data, period.start, period.end, f), [data, period, f]);

  // Randevu gelirleri gün + şube bazında tek satıra toplanır; elle girilen kayıtlar ayrı satırdır.
  const lines = useMemo(() => {
    const out: Line[] = [];
    const done = apptsIn(data, period.start, period.end, f).filter(isRevenue);
    for (const d of daysBetween(period.start, period.end)) {
      for (const b of data.branches) {
        const list = done.filter((a) => a.date === d && a.branchId === b.id);
        if (!list.length) continue;
        out.push({ id: `appt-${d}-${b.id}`, date: d, type: "income", category: "Hizmet geliri", note: `${list.length} tamamlanan randevu`, branchId: b.id, payment: "Karışık", amount: sum(list, (a) => a.price) });
      }
    }
    for (const t of txIn(data, period.start, period.end, f)) {
      out.push({ id: t.id, date: t.date, type: t.type, category: t.category, note: t.note, branchId: t.branchId, payment: t.payment ? PAYMENT_LABEL[t.payment] : "—", amount: t.amount, tx: t });
    }
    return out.filter((l) => tab === "all" || l.type === tab).sort((a, b) => b.date.localeCompare(a.date) || a.type.localeCompare(b.type));
  }, [data, period, f, tab]);

  const payTotal = pay.nakit + pay.kart + pay.havale;

  function exportCsv() {
    download(
      `gelir-gider-${period.start}_${period.end}.csv`,
      toCsv(
        ["Tarih", "Tür", "Kategori", "Açıklama", "Şube", "Ödeme", "Tutar"],
        lines.map((l) => [l.date, l.type === "income" ? "Gelir" : "Gider", l.category, l.note, L.branches.get(l.branchId)?.name, l.payment, l.type === "income" ? l.amount : -l.amount]),
      ),
    );
  }

  return (
    <>
      <PageHeader
        title="Gelir & Gider"
        sub={f === "all" ? "Tüm şubeler" : L.branches.get(f)?.name}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setForm({ type: "income" })}>
              <Plus size={16} aria-hidden /> Gelir ekle
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setForm({ type: "expense" })}>
              <Minus size={16} aria-hidden /> Gider ekle
            </button>
          </>
        }
      />
      <div className="mb-4">
        <PeriodNav period={period} onChange={setPeriod} today={today} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Toplam gelir" value={money(s.income)} delta={change(s.income, prev.income)} hint={`Hizmet ${money(s.serviceRevenue)} · ürün/diğer ${money(s.otherIncome)}`} />
        <Stat label="Toplam gider" value={money(s.expense)} delta={change(s.expense, prev.expense)} invert hint={cmp.partial ? "önceki dönemin aynı günlerine göre" : "önceki döneme göre"} />
        <Stat label="Net kâr" value={<span className={s.net < 0 ? "text-bad" : ""}>{money(s.net)}</span>} hint={s.income ? `Kâr marjı ${percent(s.net / s.income)}` : undefined} />
        <Stat label="Tamamlanan randevu" value={s.completed} hint={`Ortalama sepet ${money(s.avgTicket)}`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Giderler — kategoriye göre" sub={period.label}>
          <RankBars rows={expenses} color={SERIES[1]} format={money} sub={(r) => `${r.count} kayıt`} />
        </Card>
        <Card title="Tahsilat — ödeme yöntemine göre" sub="Tamamlanan randevular ve elle girilen gelirler">
          {payTotal ? (
            <ul className="flex flex-col gap-4">
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p, i) => (
                <li key={p}>
                  <div className="mb-1 flex items-baseline justify-between text-[13.5px]">
                    <span className="font-semibold">{PAYMENT_LABEL[p]}</span>
                    <span className="num font-semibold">
                      {money(pay[p])} <span className="font-normal text-ink-3">{percent(pay[p] / payTotal)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sunk">
                    <div className="h-full rounded-full" style={{ width: `${(pay[p] / payTotal) * 100}%`, background: [SERIES[0], SERIES[2], SERIES[3]][i] }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[13.5px] text-ink-3">Bu dönemde tahsilat yok.</p>
          )}
        </Card>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
          <Segmented<Tab>
            label="Kayıt türü"
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: "Tümü" },
              { value: "income", label: "Gelirler" },
              { value: "expense", label: "Giderler" },
            ]}
          />
          <button type="button" data-export className="btn btn-secondary btn-sm" onClick={exportCsv} disabled={!lines.length}>
            <Download size={14} aria-hidden /> CSV
          </button>
        </div>
        {lines.length ? (
          <div className="max-h-[560px] overflow-auto">
            <table className="table min-w-[820px]">
              <thead className="sticky top-0 z-[1]">
                <tr>
                  <th>Tarih</th>
                  <th>Kategori</th>
                  <th>Açıklama</th>
                  {f === "all" && <th>Şube</th>}
                  <th>Ödeme</th>
                  <th className="!text-right">Tutar</th>
                  <th className="w-[84px]">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const b = L.branches.get(l.branchId);
                  return (
                    <tr key={l.id}>
                      <td className="num whitespace-nowrap">
                        {formatWeekdayShort(l.date)} {formatDayShort(l.date)}
                      </td>
                      <td className="whitespace-nowrap font-semibold">
                        <span className={clsx("mr-2 inline-grid size-5 place-items-center rounded-full text-[11px] font-bold", l.type === "income" ? "bg-ok-50 text-ok" : "bg-bad-50 text-bad")} aria-label={l.type === "income" ? "Gelir" : "Gider"}>
                          {l.type === "income" ? "+" : "−"}
                        </span>
                        {l.category}
                      </td>
                      <td className="text-ink-2">{l.note}</td>
                      {f === "all" && (
                        <td className="whitespace-nowrap text-ink-2">
                          <span className="flex items-center gap-1.5">
                            {b && <Dot color={b.color} className="!size-2" />} {b?.name}
                          </span>
                        </td>
                      )}
                      <td className="whitespace-nowrap text-ink-2">{l.payment}</td>
                      <td className={clsx("num whitespace-nowrap text-right font-bold", l.type === "income" ? "text-ok" : "text-ink")}>
                        {l.type === "income" ? "+" : "−"}
                        {money(l.amount)}
                      </td>
                      <td>
                        {l.tx ? (
                          <div className="flex justify-end gap-0.5">
                            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setForm(l.tx!)} aria-label="Düzenle">
                              <Pencil size={14} />
                            </button>
                            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleting(l.tx!)} aria-label="Sil">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="block text-right text-[11.5px] text-ink-3">otomatik</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Bu dönemde kayıt yok">Gelir ya da gider eklemek için yukarıdaki düğmeleri kullanın.</Empty>
        )}
      </div>

      {form && <TxForm initial={form} onClose={() => setForm(null)} />}
      <Confirm
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Kayıt silinsin mi?"
        onConfirm={() => {
          if (deleting) del(deleting.id);
          toast("Kayıt silindi");
        }}
      >
        {deleting && (
          <>
            {deleting.category} — <strong className="num">{money(deleting.amount)}</strong> ({formatDayShort(deleting.date)}) kalıcı olarak silinir.
          </>
        )}
      </Confirm>
    </>
  );
}

function TxForm({ initial, onClose }: { initial: Partial<Transaction>; onClose: () => void }) {
  const { today } = useNow();
  const branches = useStore((s) => s.branches);
  const f = useStore((s) => s.branchFilter);
  const save = useStore((s) => s.saveTransaction);
  const [t, setT] = useState({
    id: initial.id,
    type: initial.type ?? ("expense" as TxType),
    category: initial.category ?? (initial.type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]),
    amount: initial.amount ?? 0,
    date: initial.date ?? today,
    branchId: initial.branchId ?? (f === "all" ? (branches[0]?.id ?? "") : f),
    payment: (initial.payment ?? "kart") as PaymentMethod | null,
    note: initial.note ?? "",
  });
  const [tried, setTried] = useState(false);
  const cats: readonly string[] = t.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const amountError = !(t.amount > 0) ? "Tutar 0’dan büyük olmalı." : null;

  return (
    <Modal
      open
      onClose={onClose}
      title={t.id ? "Kaydı düzenle" : t.type === "income" ? "Gelir ekle" : "Gider ekle"}
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
              if (amountError || !t.date) return;
              save({ ...t, category: t.category as Transaction["category"], note: t.note.trim() });
              toast(t.id ? "Kayıt güncellendi" : t.type === "income" ? "Gelir eklendi" : "Gider eklendi");
              onClose();
            }}
          >
            Kaydet
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Segmented<TxType>
            label="Kayıt türü"
            value={t.type}
            onChange={(type) => setT({ ...t, type, category: type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] })}
            options={[
              { value: "expense", label: "Gider" },
              { value: "income", label: "Gelir" },
            ]}
          />
        </div>
        <Field label="Kategori">
          {(id) => (
            <select id={id} className="input" value={t.category} onChange={(e) => setT({ ...t, category: e.target.value as Transaction["category"] })}>
              {cats.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tutar (₺)" required error={tried ? amountError : null}>
          {(id, d) => <input id={id} aria-describedby={d} className="input num" type="number" min={0} step={50} value={t.amount || ""} onChange={(e) => setT({ ...t, amount: Math.max(0, Number(e.target.value) || 0) })} data-autofocus />}
        </Field>
        <Field label="Tarih">
          {(id) => <input id={id} className="input num" type="date" value={t.date} onChange={(e) => setT({ ...t, date: e.target.value })} />}
        </Field>
        <Field label="Şube">
          {(id) => (
            <select id={id} className="input" value={t.branchId} onChange={(e) => setT({ ...t, branchId: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Ödeme yöntemi">
          {(id) => (
            <select id={id} className="input" value={t.payment ?? ""} onChange={(e) => setT({ ...t, payment: (e.target.value || null) as PaymentMethod | null })}>
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_LABEL[p]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Açıklama">
          {(id) => <input id={id} className="input" value={t.note} onChange={(e) => setT({ ...t, note: e.target.value })} placeholder={t.type === "income" ? "ör. Kütikül yağı satışı" : "ör. Kalıcı oje siparişi"} />}
        </Field>
      </div>
    </Modal>
  );
}
