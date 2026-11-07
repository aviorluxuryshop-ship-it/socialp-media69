"use client";

import clsx from "clsx";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, Field, Modal, PageHeader, Tag, toast } from "@/components/ui";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { addDays } from "@/lib/dates";
import { minutesLabel, money } from "@/lib/format";
import { useData, useNow } from "@/lib/hooks";
import { byService } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { Service, ServiceCategory } from "@/lib/types";

export default function ServicesPage() {
  const { today } = useNow();
  const data = useData();
  const f = useStore((s) => s.branchFilter);
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const usage = useMemo(() => new Map(byService(data, addDays(today, -29), today, f).map((r) => [r.id, r])), [data, today, f]);

  return (
    <>
      <PageHeader
        title="Hizmetler"
        sub="Fiyat ve süreler randevu oluştururken otomatik gelir; randevu bazında değiştirilebilir."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={16} aria-hidden /> Yeni hizmet
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {SERVICE_CATEGORIES.map((cat) => {
          const list = data.services.filter((s) => s.category === cat);
          if (!list.length) return null;
          return (
            <Card key={cat} title={cat} sub={`${list.length} hizmet`} pad={false}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Hizmet</th>
                    <th className="!text-right">Süre</th>
                    <th className="!text-right">Fiyat</th>
                    <th className="!text-right">Son 30 gün</th>
                    <th className="w-[52px]">
                      <span className="sr-only">Düzenle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const u = usage.get(s.id);
                    return (
                      <tr key={s.id} className={clsx(!s.active && "opacity-60")}>
                        <td className="font-semibold">
                          {s.name} {!s.active && <Tag>Pasif</Tag>}
                        </td>
                        <td className="num whitespace-nowrap text-right text-ink-2">{minutesLabel(s.durationMin)}</td>
                        <td className="num whitespace-nowrap text-right font-bold">{money(s.price)}</td>
                        <td className="num whitespace-nowrap text-right text-ink-2">{u ? `${u.count} · ${money(u.value)}` : "—"}</td>
                        <td>
                          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(s)} aria-label={`${s.name} düzenle`}>
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>
      {editing && <ServiceForm service={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ServiceForm({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const save = useStore((s) => s.saveService);
  const [s, setS] = useState<Omit<Service, "id"> & { id?: string }>(service ?? { name: "", category: "Manikür", durationMin: 60, price: 0, active: true });
  const [tried, setTried] = useState(false);
  const nameErr = !s.name.trim() ? "Hizmet adı gerekli." : null;
  return (
    <Modal
      open
      onClose={onClose}
      title={service ? "Hizmeti düzenle" : "Yeni hizmet"}
      width={500}
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
              if (nameErr) return;
              save({ ...s, name: s.name.trim() });
              toast(service ? "Hizmet güncellendi" : "Hizmet eklendi");
              onClose();
            }}
          >
            Kaydet
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Hizmet adı" required error={tried ? nameErr : null} className="sm:col-span-2">
          {(id, d) => <input id={id} aria-describedby={d} className="input" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} data-autofocus />}
        </Field>
        <Field label="Kategori">
          {(id) => (
            <select id={id} className="input" value={s.category} onChange={(e) => setS({ ...s, category: e.target.value as ServiceCategory })}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Süre (dk)">
          {(id) => (
            <select id={id} className="input num" value={s.durationMin} onChange={(e) => setS({ ...s, durationMin: Number(e.target.value) })}>
              {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180].map((m) => (
                <option key={m} value={m}>
                  {minutesLabel(m)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Fiyat (₺)">
          {(id) => <input id={id} className="input num" type="number" min={0} step={50} value={s.price} onChange={(e) => setS({ ...s, price: Math.max(0, Number(e.target.value) || 0) })} />}
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5 text-[14px] font-semibold">
          <input type="checkbox" className="size-[18px] accent-[#a3486a]" checked={s.active} onChange={(e) => setS({ ...s, active: e.target.checked })} />
          Randevuda seçilebilir
        </label>
      </div>
    </Modal>
  );
}
