"use client";

import { useState } from "react";
import { Field, Modal, toast } from "@/components/ui";
import { CUSTOMER_SOURCES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { Customer, CustomerSource } from "@/lib/types";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function CustomerForm({ customer, onClose, onSaved }: { customer?: Customer | null; onClose: () => void; onSaved?: (id: string) => void }) {
  const staff = useStore((s) => s.staff);
  const branches = useStore((s) => s.branches);
  const customers = useStore((s) => s.customers);
  const save = useStore((s) => s.saveCustomer);
  const [f, setF] = useState({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    bMonth: customer?.birthday ? customer.birthday.slice(0, 2) : "",
    bDay: customer?.birthday ? customer.birthday.slice(3, 5) : "",
    source: customer?.source ?? ("Instagram" as CustomerSource),
    preferredStaffId: customer?.preferredStaffId ?? "",
    vip: customer?.vip ?? false,
    allergies: customer?.allergies ?? "",
    notes: customer?.notes ?? "",
  });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const digits = f.phone.replace(/\D/g, "");
  const dup = digits.length >= 10 ? customers.find((c) => c.id !== customer?.id && c.phone.replace(/\D/g, "").endsWith(digits.slice(-10))) : undefined;
  const errors = {
    name: !f.name.trim() ? "Ad soyad gerekli." : null,
    phone: digits.length < 10 ? "Geçerli bir telefon numarası girin (en az 10 hane)." : dup ? `Bu numara ${dup.name} adına kayıtlı.` : null,
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (errors.name || errors.phone) return;
    const id = save({
      id: customer?.id,
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      birthday: f.bMonth && f.bDay ? `${f.bMonth}-${f.bDay}` : "",
      source: f.source,
      preferredStaffId: f.preferredStaffId || null,
      vip: f.vip,
      allergies: f.allergies.trim(),
      notes: f.notes.trim(),
    });
    toast(customer ? "Müşteri güncellendi" : "Müşteri eklendi");
    onSaved?.(id);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? "Müşteriyi düzenle" : "Yeni müşteri"}
      width={600}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form="customer-form" className="btn btn-primary">
            Kaydet
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ad soyad" required error={tried ? errors.name : null}>
          {(id, d) => <input id={id} aria-describedby={d} aria-invalid={tried && !!errors.name} className="input" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" data-autofocus />}
        </Field>
        <Field label="Telefon" required error={tried || dup ? errors.phone : null}>
          {(id, d) => <input id={id} aria-describedby={d} aria-invalid={(tried || !!dup) && !!errors.phone} className="input num" type="tel" inputMode="tel" placeholder="05xx xxx xx xx" value={f.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
        <Field label="E-posta">
          {(id) => <input id={id} className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink-2">Doğum günü</span>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <select className="input num" aria-label="Doğum günü — gün" value={f.bDay} onChange={(e) => set("bDay", e.target.value)}>
              <option value="">Gün</option>
              {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                <option key={d} value={d}>
                  {Number(d)}
                </option>
              ))}
            </select>
            <select className="input" aria-label="Doğum günü — ay" value={f.bMonth} onChange={(e) => set("bMonth", e.target.value)}>
              <option value="">Ay</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Field label="Bizi nereden buldu?">
          {(id) => (
            <select id={id} className="input" value={f.source} onChange={(e) => set("source", e.target.value as CustomerSource)}>
              {CUSTOMER_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tercih ettiği personel">
          {(id) => (
            <select id={id} className="input" value={f.preferredStaffId} onChange={(e) => set("preferredStaffId", e.target.value)}>
              <option value="">Fark etmez</option>
              {branches.map((b) => (
                <optgroup key={b.id} label={b.name}>
                  {staff
                    .filter((s) => s.branchId === b.id && (s.active || s.id === f.preferredStaffId))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          )}
        </Field>
        <Field label="Alerji / hassasiyet" className="sm:col-span-2" hint="Randevu kartlarında uyarı olarak görünür.">
          {(id, d) => <input id={id} aria-describedby={d} className="input" value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="ör. Lateks hassasiyeti" />}
        </Field>
        <Field label="Notlar" className="sm:col-span-2">
          {(id) => <textarea id={id} className="input min-h-[80px]" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Tırnak şekli, renk tercihleri, özel istekler…" />}
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold sm:col-span-2">
          <input type="checkbox" className="size-[18px] accent-[#b84c36]" checked={f.vip} onChange={(e) => set("vip", e.target.checked)} />
          VIP müşteri
        </label>
      </form>
    </Modal>
  );
}
